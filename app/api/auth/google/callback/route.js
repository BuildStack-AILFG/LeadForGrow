import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import Business from '@/models/Business';
import Agency from '@/models/Agency';
import { exchangeGoogleCode } from '@/lib/auth/googleOAuth';
import { generateTokenPair } from '@/lib/security/refreshToken';
import { getDefaultLimitsForTier } from '@/lib/agency/planResolver';
import { logAuthEvent } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

function appBase() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function failRedirect(message) {
  return NextResponse.redirect(
    `${appBase()}/login?error=${encodeURIComponent(message)}`
  );
}

/**
 * GET /api/auth/google/callback?code=...&state=login:0
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state') || 'login:0';
    const oauthError = searchParams.get('error');

    if (oauthError) {
      return failRedirect(oauthError === 'access_denied' ? 'google_cancelled' : 'google_failed');
    }
    if (!code) return failRedirect('google_missing_code');

    const [mode, agencyFlag, stateNonce] = state.split(':');
    const isAgency = agencyFlag === '1';

    // Verify the state nonce matches the httpOnly cookie set when the flow started
    const cookieNonce = req.cookies?.get?.('g_oauth_state')?.value;
    if (!stateNonce || !cookieNonce || stateNonce !== cookieNonce) {
      console.error('[Google OAuth] state mismatch', {
        state,
        stateNonce,
        cookieNonce,
        allCookies: req.cookies?.getAll?.().map((c) => c.name),
      });
      return failRedirect('google_failed');
    }

    const profile = await exchangeGoogleCode(code);
    if (!profile.email) return failRedirect('google_no_email');

    await dbConnect();

    let user =
      (await User.findOne({ googleId: profile.googleId })) ||
      (await User.findOne({ email: profile.email }));

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        const companyName =
          [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
          profile.email.split('@')[0];

        const [createdUser] = await User.create(
          [
            {
              email: profile.email,
              password: randomPassword,
              authProvider: 'google',
              googleId: profile.googleId,
              firstName: profile.firstName,
              lastName: profile.lastName,
              avatarUrl: profile.avatarUrl,
              role: 'owner',
            },
          ],
          { session }
        );

        const [business] = await Business.create(
          [
            {
              businessName: `${companyName}'s Workspace`,
              ownerId: createdUser._id,
              plan: 'free',
              onboardingComplete: false,
              onboardingStep: 'business_details',
            },
          ],
          { session }
        );

        createdUser.businessId = business._id;

        if (isAgency) {
          const [agency] = await Agency.create(
            [
              {
                agencyName: `${companyName}'s Agency`,
                ownerId: createdUser._id,
                businessId: business._id,
                planName: 'Agency Starter',
                limits: getDefaultLimitsForTier('starter'),
                status: 'active',
              },
            ],
            { session }
          );
          createdUser.agencyId = agency._id;
        }

        await createdUser.save({ session });
        await session.commitTransaction();
        user = createdUser;
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } else {
      // Link Google identity to existing account
      const updates = {};
      if (!user.googleId) updates.googleId = profile.googleId;
      if (!user.authProvider || user.authProvider === 'local') {
        // Keep local password; mark as also using google
        if (!user.googleId) updates.authProvider = user.password ? 'local' : 'google';
      }
      if (profile.avatarUrl && !user.avatarUrl) updates.avatarUrl = profile.avatarUrl;
      if (profile.firstName && !user.firstName) updates.firstName = profile.firstName;
      if (profile.lastName && !user.lastName) updates.lastName = profile.lastName;
      if (Object.keys(updates).length) {
        Object.assign(user, updates);
        if (!user.authProvider) user.authProvider = 'google';
        if (profile.googleId) user.googleId = profile.googleId;
        await user.save();
      }
    }

    if (user.active === false) return failRedirect('account_disabled');

    let workspace = null;
    if (user.businessId) {
      const business = await Business.findById(user.businessId);
      if (business) {
        workspace = {
          id: business._id.toString(),
          name: business.businessName,
          plan: business.plan,
          type: 'business',
          onboardingComplete: business.onboardingComplete,
          onboardingStep: business.onboardingStep,
          agencyId: user.agencyId || null,
        };
      }
    }

    if (!workspace) {
      // Recover orphaned Google user without business
      const business = await Business.create({
        businessName: `${profile.firstName || profile.email.split('@')[0]}'s Workspace`,
        ownerId: user._id,
        plan: 'free',
        onboardingComplete: false,
        onboardingStep: 'business_details',
      });
      user.businessId = business._id;
      user.role = user.role || 'owner';
      await user.save();
      workspace = {
        id: business._id.toString(),
        name: business.businessName,
        plan: business.plan,
        type: 'business',
        onboardingComplete: false,
        onboardingStep: 'business_details',
        agencyId: user.agencyId || null,
      };
    }

    const { accessToken, refreshToken, expiresIn } = generateTokenPair(user, {
      plan: workspace.plan,
    });

    const RefreshToken = (await import('@/models/access/RefreshToken')).default;
    await RefreshToken.store(user._id, refreshToken, {
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    });

    await logAuthEvent(req, isNewUser ? 'register_google' : 'login_google', user._id, user.businessId);

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      token: accessToken,
      refreshToken,
      expiresIn,
      businessId: workspace.id,
      plan: workspace.plan,
      businessName: workspace.name,
      isNewUser: isNewUser ? '1' : '0',
    };

    // Never put tokens in the redirect URL: store the payload server-side and
    // hand the browser a one-time exchange code (5 minute TTL, single use).
    const OAuthExchange = (await import('@/models/access/OAuthExchange')).default;
    const exchangeCode = crypto.randomBytes(32).toString('hex');
    await OAuthExchange.create({
      codeHash: crypto.createHash('sha256').update(exchangeCode).digest('hex'),
      payload,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const res = NextResponse.redirect(`${appBase()}/auth/google/complete?code=${exchangeCode}`);
    res.cookies.set('g_oauth_state', '', { maxAge: 0, path: '/' });
    return res;
  } catch (error) {
    console.error('[Google OAuth] callback error:', error);
    return failRedirect('google_failed');
  }
}
