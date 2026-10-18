import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            saloons: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: "ব্যবহারকারী তালিকা পাওয়া যায়নি।" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, status } = body;

    if (!userId) {
      return NextResponse.json({ error: "ইউজার আইডি প্রয়োজন।" }, { status: 400 });
    }

    const data: any = {};
    if (role && ["CUSTOMER", "OWNER", "ADMIN"].includes(role)) {
      data.role = role;
    }
    if (status && ["ACTIVE", "SUSPENDED"].includes(status)) {
      data.status = status;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "ব্যবহারকারীর তথ্য আপডেট করা হয়েছে।",
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "ব্যবহারকারী আপডেট ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
