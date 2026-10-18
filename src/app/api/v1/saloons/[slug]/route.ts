import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const salon = await prisma.saloon.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!salon) {
      return NextResponse.json(
        { error: "সেলুনটি খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Check if blocked or deleted
    if (salon.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "এই সেলুনের কার্যক্রম সাময়িকভাবে স্থগিত রয়েছে।" },
        { status: 403 }
      );
    }

    // Get today's bookings count
    const todayStr = new Date().toISOString().split("T")[0];
    const onlineWaitingCount = await prisma.booking.count({
      where: {
        saloonId: salon.id,
        bookingDate: todayStr,
        status: "WAITING",
      },
    });

    let parsedChairStates: Array<{ chairNo: number; isBusy: boolean }> = [];
    try {
      parsedChairStates = JSON.parse(salon.chairStates);
    } catch (e) {
      // Default array if parse fails
      parsedChairStates = Array.from({ length: salon.totalChairs }, (_, i) => ({
        chairNo: i + 1,
        isBusy: i < salon.busyChairs,
      }));
    }

    const freeChairs = Math.max(0, salon.totalChairs - salon.busyChairs);
    const totalQueue = salon.manualQueueCount + onlineWaitingCount;
    const estWaitMins = Math.ceil((totalQueue * 25) / Math.max(salon.totalChairs, 1));

    return NextResponse.json({
      salon: {
        id: salon.id,
        slug: salon.slug,
        nameBn: salon.nameBn,
        nameEn: salon.nameEn,
        category: salon.category,
        isAc: salon.isAc,
        address: salon.address,
        phone: salon.phone,
        latitude: salon.latitude,
        longitude: salon.longitude,
        totalChairs: salon.totalChairs,
        busyChairs: salon.busyChairs,
        freeChairs,
        chairStates: parsedChairStates,
        manualQueueCount: salon.manualQueueCount,
        currentServingToken: salon.currentServingToken,
        onlineWaitingCount,
        totalQueue,
        estWaitMins,
        coverImage: salon.coverImage,
        services: salon.services,
      },
    });
  } catch (error: any) {
    console.error("Salon slug fetch error:", error);
    return NextResponse.json(
      { error: "সেলুনের তথ্য লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
