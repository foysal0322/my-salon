import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || "").trim(); // Phone or email
    const password = String(body.password || "").trim();

    // Find admin user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { name: identifier },
        ],
        role: "ADMIN",
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "এডমিন একাউন্ট খুঁজে পাওয়া যায়নি অথবা অনুমতি নেই।" },
        { status: 403 }
      );
    }

    // Default admin password for seed
    if (password !== "admin123" && password !== "adminPassword123") {
      return NextResponse.json(
        { error: "ভুল পাসওয়ার্ড প্রদান করা হয়েছে।" },
        { status: 401 }
      );
    }

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
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
