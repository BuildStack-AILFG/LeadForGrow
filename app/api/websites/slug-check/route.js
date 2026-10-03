import { NextResponse } from "next/server";
import {dbConnect }from "@/lib/mongodb";
import Website from "@/models/Website";
import { withRateLimit } from '@/lib/rateLimit';
import { serverErrorMessage } from '@/lib/api/serverError';

async function getHandler(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug is required" }, { status: 400 });
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ success: false, error: "Invalid slug format. Use only lowercase letters, numbers, and hyphens." }, { status: 400 });
    }

    const website = await Website.findOne({ slug });

    return NextResponse.json({ 
      success: true, 
      available: !website 
    });
  } catch (error) {
    console.error("Slug check error:", error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
}

export const GET = withRateLimit(30, 60, getHandler);
