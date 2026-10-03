import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Business from "@/models/Business";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rateLimit";
import { logAuthEvent } from "@/lib/auditLog";
import { evaluatePassword } from "@/lib/security/passwordPolicy";
import { serverErrorMessage } from '@/lib/api/serverError';

async function loginHandler(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Force-rotate flow: this is the ONE spot where we have the user's
    // plaintext password (it just verified). Check it against the current
    // policy — if it's weak (grandfathered from before we tightened rules),
    // set the flag so the frontend can gate them into a rotation screen.
    // Skipped for Google OAuth users (no password to rotate).
    let mustRotatePassword = user.mustRotatePassword === true;
    if (user.authProvider !== 'google') {
      const pwCheck = evaluatePassword(password, { email: user.email });
      if (!pwCheck.ok && !mustRotatePassword) {
        try {
          await User.updateOne({ _id: user._id }, { $set: { mustRotatePassword: true } });
        } catch (err) {
          console.warn('[Login] failed to persist mustRotatePassword flag:', err.message);
        }
        mustRotatePassword = true;
      }
    }

    // Fetch PRIMARY Business information first
    let workspace = null;
    if (user.businessId) {
      const business = await Business.findById(user.businessId);
      if (business) {
        workspace = {
          id: business._id,
          name: business.businessName,
          plan: business.plan,
          type: 'business',
          onboardingComplete: business.onboardingComplete,
          onboardingStep: business.onboardingStep,
          agencyId: user.agencyId || null // Capability attached to business
        };
      }
    }

    // Fallback if businessId is missing but user exists (legacy support)
    if (!workspace && user.agencyId) {
      const agency = (await import("@/models/Agency")).default;
      const agencyDoc = await agency.findById(user.agencyId);
      if (agencyDoc) {
        workspace = {
          id: agencyDoc.businessId || 'legacy',
          agencyId: agencyDoc._id,
          name: agencyDoc.agencyName,
          plan: 'agency',
          type: 'business'
        };
      }
    }

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Business account not found. Please contact support." }, { status: 500 });
    }

    const { generateTokenPair } = await import("@/lib/security/refreshToken");
    const RefreshToken = (await import("@/models/access/RefreshToken")).default;
    const { accessToken, refreshToken, expiresIn } = generateTokenPair(user, { plan: workspace.plan });

    await RefreshToken.store(user._id, refreshToken, {
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    });

    await logAuthEvent(req, 'login_success', user._id, user.businessId);

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        business: workspace,
        token: accessToken,
        refreshToken,
        expiresIn,
        // Flag consumed by the client — when true, the user is redirected to
        // /rotate-password before they can access the app.
        mustRotatePassword,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
}

export const POST = withRateLimit(10, 60, loginHandler);
