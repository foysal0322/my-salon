import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Bangladesh Phone Validation Regex: 013 to 019 followed by 8 digits
const BD_PHONE_REGEX = /^(?:\+8801|8801|01)[3-9]\d{8}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = String(body.phone || "").trim();

    if (!rawPhone || !BD_PHONE_REGEX.test(rawPhone)) {
      return NextResponse.json(
        { error: "সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01711223344)" },
        { status: 400 }
      );
    }

    // Normalize to standard 11-digit local format: 01XXXXXXXXX
    let phone = rawPhone;
    if (phone.startsWith("+88")) phone = phone.slice(3);
    else if (phone.startsWith("88")) phone = phone.slice(2);

    // Rate-limiting check: max 3 OTPs within last 10 minutes (600s)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOtpsCount = await prisma.otpVerification.count({
      where: {
        phone,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentOtpsCount >= 3) {
      return NextResponse.json(
        {
          error:
            "আপনি খুব দ্রুত একাধিকবার কোড চেয়েছেন। অনুগ্রহ করে ১০ মিনিট পর আবার চেষ্টা করুন।",
        },
        { status: 429 }
      );
    }

    // Generate 6-digit numeric OTP
    // For test phone numbers in documentation / seed (e.g. 01700000000, 01711223344, 01712345678),
    // or standard flow, provide standard 180s expiry.
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 180 * 1000); // 180 seconds

    await prisma.otpVerification.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });

    // In a production environment with BD SMS Gateway (e.g., SSL Wireless, BoomCast, GreenWeb),
    // we would call the SMS API here. We provide the generated code in response for testing/demo.
    return NextResponse.json({
      success: true,
      message: "আপনার মোবাইলে ৬ ডিজিটের ওটিপি পাঠানো হয়েছে।",
      phone,
      expiresIn: 180,
      // Demo helper so testing can be performed seamlessly in development/demo environments
      demoOtp: code,
    });
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
