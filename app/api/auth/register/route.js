import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Business from "@/models/Business";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withRateLimit } from "@/lib/rateLimit";
import { evaluatePassword } from "@/lib/security/passwordPolicy";

async function registerHandler(req) {
  try {
    await dbConnect();
    const { companyName, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    if (!companyName) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    // Enforce strong-password policy — see lib/security/passwordPolicy.js.
    // Never trust the client's check: even with the meter and inline
    // requirements, someone can hit this endpoint directly with "123456".
    const pwCheck = evaluatePassword(password, { email, name: companyName });
    if (!pwCheck.ok) {
      return NextResponse.json({
        success: false,
        error: pwCheck.failures[0]?.message || 'Password does not meet security requirements.',
        passwordFailures: pwCheck.failures,
      }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "User already exists" }, { status: 400 });
    }

    // Use a transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 1. Create User
      const user = await User.create([{
        email,
        password: hashedPassword,
        role: 'owner'
      }], { session });

      // 2. ALWAYS Create Business Account (Primary)
      const business = await Business.create([{
        businessName: companyName,
        ownerId: user[0]._id,
        plan: 'free',
        onboardingComplete: false,
        onboardingStep: 'business_details'
      }], { session });

      user[0].businessId = business[0]._id;
      let workspace = {
        id: business[0]._id,
        name: business[0].businessName,
        plan: business[0].plan,
        type: 'business'
      };

      await user[0].save({ session });

      // Commit the transaction
      await session.commitTransaction();

      // 4. Send Welcome Email
      try {
        const { sendResendEmail } = await import("@/lib/resend");
        const welcomeTemplate = `
          <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; color: #1e293b;">
            <div style="margin-bottom: 32px; text-align: center;">
              <h1 style="font-size: 30px; font-weight: 800; color: #0f172a; margin: 0;">Welcome to LeadForGrow!</h1>
              <p style="font-size: 16px; color: #64748b; margin-top: 8px;">Your lead engine is ready for ${companyName}.</p>
            </div>
          </div>
        `;
        await sendResendEmail({
          to: email,
          from: 'LeadForGrow <info@leadforgrow.com>',
          subject: 'Welcome to LeadForGrow! 🚀',
          html: welcomeTemplate
        });
      } catch (emailError) {
        console.error('[Register] Email error:', emailError);
      }

      // Issue a real token pair so the user is signed in immediately (same as login)
      const { generateTokenPair } = await import("@/lib/security/refreshToken");
      const RefreshToken = (await import("@/models/access/RefreshToken")).default;
      const { accessToken, refreshToken, expiresIn } = generateTokenPair(user[0], { plan: workspace.plan });
      await RefreshToken.store(user[0]._id, refreshToken, {
        userAgent: req.headers.get('user-agent'),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      });

      return NextResponse.json({ 
        success: true, 
        data: { 
          userId: user[0]._id,
          email: user[0].email,
          role: 'owner',
          business: workspace, // Keeping 'business' key for frontend backward compatibility
          token: accessToken,
          refreshToken,
          expiresIn,
        } 
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}

export const POST = withRateLimit(10, 60, registerHandler);
