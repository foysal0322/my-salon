import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let rawPhone = String(body.phone || "").trim();
    const code = String(body.code || "").trim();
    const requestedRole = (body.role || "CUSTOMER").toUpperCase(); // "CUSTOMER" or "OWNER"
    const name = body.name ? String(body.name).trim() : null;

    if (!rawPhone || !code) {
      return NextResponse.json(
        { error: "মোবাইল নম্বর এবং ৬ ডিজিটের ওটিপি কোড দিন।" },
        { status: 400 }
      );
    }

    if (rawPhone.startsWith("+88")) rawPhone = rawPhone.slice(3);
    else if (rawPhone.startsWith("88")) rawPhone = rawPhone.slice(2);

    // Verify OTP record
    const now = new Date();
    // Allow master test code "123456" for demo convenience, or check the database record
    const isMasterCode = code === "123456";

    let isValid = isMasterCode;
    if (!isMasterCode) {
      const otpRecord = await prisma.otpVerification.findFirst({
        where: {
          phone: rawPhone,
          code,
          expiresAt: { gte: now },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!otpRecord) {
        return NextResponse.json(
          { error: "ভুল ওটিপি কোড অথবা কোডের মেয়াদ শেষ হয়ে গেছে।" },
          { status: 400 }
        );
      }
      isValid = true;
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone: rawPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: rawPhone,
          name: name || (requestedRole === "OWNER" ? "সেলুন পার্টনার" : "সম্মানিত গ্রাহক"),
          role: requestedRole === "OWNER" ? "OWNER" : "CUSTOMER",
          languagePref: "bn",
          status: "ACTIVE",
        },
      });
    } else {
      // If user logs in through owner portal and was customer, or updating role
      if (requestedRole === "OWNER" && user.role === "CUSTOMER") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "OWNER" },
        });
      }
      if (name && !user.name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name },
        });
      }
    }

    // Clean up used OTPs
    await prisma.otpVerification.deleteMany({
      where: { phone: rawPhone },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        languagePref: user.languagePref,
      },
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "ওটিপি যাচাই করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
