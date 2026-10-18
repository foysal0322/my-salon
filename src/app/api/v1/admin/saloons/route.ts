import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const saloons = await prisma.saloon.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            services: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ saloons });
  } catch (error: any) {
    return NextResponse.json({ error: "সেলুন তালিকা পাওয়া যায়নি।" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { saloonId, status, extendDays } = body;

    if (!saloonId) {
      return NextResponse.json({ error: "সেলুন আইডি প্রদান করুন।" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (status && ["ACTIVE", "BLOCKED", "PENDING"].includes(status)) {
      dataToUpdate.status = status;
    }

    if (extendDays && Number(extendDays) > 0) {
      const salon = await prisma.saloon.findUnique({ where: { id: saloonId } });
      if (salon) {
        const now = new Date();
        const base = salon.trialEndsAt > now ? salon.trialEndsAt : now;
        dataToUpdate.trialEndsAt = new Date(base.getTime() + Number(extendDays) * 24 * 60 * 60 * 1000);
      }
    }

    const updated = await prisma.saloon.update({
      where: { id: saloonId },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: "সেলুনের অবস্থা সফলভাবে পরিবর্তিত হয়েছে।",
      saloon: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "আপডেট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
