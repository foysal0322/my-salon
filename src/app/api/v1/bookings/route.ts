import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      saloonId,
      customerId,
      guestName,
      guestPhone,
      serviceIds,
      bookingType = "LIVE_QUEUE",
      scheduledAt,
      cancelExisting = false,
    } = body;

    let phone = String(guestPhone || "").trim();
    if (phone.startsWith("+88")) phone = phone.slice(3);
    else if (phone.startsWith("88")) phone = phone.slice(2);

    if (!saloonId || !phone || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { error: "সেলুন, মোবাইল নম্বর এবং কমপক্ষে একটি সার্ভিস নির্বাচন করুন।" },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Rule FR-BOOK-02: Each phone number is restricted to maximum 1 active live queue booking globally at any given time.
    if (bookingType === "LIVE_QUEUE") {
      const activeBooking = await prisma.booking.findFirst({
        where: {
          guestPhone: phone,
          status: { in: ["WAITING", "IN_SERVICE"] },
          bookingDate: todayStr,
        },
        include: { saloon: true },
      });

      if (activeBooking) {
        if (cancelExisting) {
          // Customer explicitly requested to cancel their previous booking and rebook
          await prisma.booking.update({
            where: { id: activeBooking.id },
            data: { status: "CANCELLED" },
          });
        } else {
          return NextResponse.json(
            {
              error: `আপনার একটি সক্রিয় সিরিয়াল রয়েছে (সেলুন: ${activeBooking.saloon.nameBn}, টোকেন: #${activeBooking.tokenNumber})। একই সাথে একাধিক লাইভ সিরিয়াল নেওয়া যাবে না।`,
              existingBookingId: activeBooking.id,
              existingToken: activeBooking.tokenNumber,
              existingSalonName: activeBooking.saloon.nameBn,
            },
            { status: 400 }
          );
        }
      }
    }

    // Fetch verified services from DB
    const services = await prisma.salonService.findMany({
      where: {
        id: { in: serviceIds },
        saloonId,
        isActive: true,
      },
    });

    if (services.length === 0) {
      return NextResponse.json(
        { error: "নির্বাচিত সার্ভিসগুলো পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    const totalAmount = services.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = services.reduce((sum, s) => sum + s.durationMins, 0);

    const servicesSnapshot = services.map((s) => ({
      id: s.id,
      nameBn: s.nameBn,
      nameEn: s.nameEn,
      price: s.price,
      durationMins: s.durationMins,
    }));

    // Atomic transaction to allocate daily sequential token number
    const booking = await prisma.$transaction(async (tx) => {
      // Find highest token number today for this salon
      const lastBooking = await tx.booking.findFirst({
        where: {
          saloonId,
          bookingDate: todayStr,
        },
        orderBy: { tokenNumber: "desc" },
      });

      const nextTokenNumber = (lastBooking?.tokenNumber || 0) + 1;

      return await tx.booking.create({
        data: {
          saloonId,
          customerId: customerId || null,
          guestName: guestName || "সম্মানিত গ্রাহক",
          guestPhone: phone,
          tokenNumber: nextTokenNumber,
          bookingDate: todayStr,
          bookingType,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          servicesJson: JSON.stringify(servicesSnapshot),
          totalAmount,
          totalDuration,
          status: "WAITING",
        },
        include: { saloon: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: "আপনার সিরিয়াল সফলভাবে বুকিং হয়েছে!",
      booking: {
        id: booking.id,
        tokenNumber: booking.tokenNumber,
        bookingDate: booking.bookingDate,
        totalAmount: booking.totalAmount,
        totalDuration: booking.totalDuration,
        status: booking.status,
        saloonName: booking.saloon.nameBn,
        saloonSlug: booking.saloon.slug,
      },
    });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "সিরিয়াল বুক করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");
    const userId = searchParams.get("userId");
    const phone = searchParams.get("phone");
    const saloonId = searchParams.get("saloonId");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Salon Owner query: list bookings for this salon on a specific date (today by default)
    if (saloonId) {
      const bookings = await prisma.booking.findMany({
        where: {
          saloonId,
          bookingDate: date,
        },
        orderBy: { tokenNumber: "asc" },
      });

      const enriched = bookings.map((b) => {
        let parsed = [];
        try {
          parsed = JSON.parse(b.servicesJson);
        } catch (e) {}
        return {
          ...b,
          services: parsed,
        };
      });

      return NextResponse.json({
        bookings: enriched,
        waiting: enriched.filter((b) => b.status === "WAITING"),
        inService: enriched.filter((b) => b.status === "IN_SERVICE"),
        completed: enriched.filter((b) => b.status === "COMPLETED"),
        noShow: enriched.filter((b) => b.status === "NO_SHOW"),
        cancelled: enriched.filter((b) => b.status === "CANCELLED"),
      });
    }

    // Single booking live tracker query
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          saloon: true,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: "বুকিং রেকর্ড পাওয়া যায়নি।" },
          { status: 404 }
        );
      }

      // Compute live queue position
      const todayStr = booking.bookingDate;
      const waitingAhead = await prisma.booking.count({
        where: {
          saloonId: booking.saloonId,
          bookingDate: todayStr,
          status: "WAITING",
          tokenNumber: { lt: booking.tokenNumber },
        },
      });

      const totalQueueAhead = waitingAhead + booking.saloon.manualQueueCount;
      const estWaitMins = Math.ceil(
        (totalQueueAhead * 25) / Math.max(booking.saloon.totalChairs, 1)
      );

      let parsedServices = [];
      try {
        parsedServices = JSON.parse(booking.servicesJson);
      } catch (e) {}

      return NextResponse.json({
        booking: {
          id: booking.id,
          tokenNumber: booking.tokenNumber,
          bookingDate: booking.bookingDate,
          bookingType: booking.bookingType,
          status: booking.status,
          totalAmount: booking.totalAmount,
          totalDuration: booking.totalDuration,
          services: parsedServices,
          guestName: booking.guestName,
          guestPhone: booking.guestPhone,
          createdAt: booking.createdAt,
        },
        saloon: {
          id: booking.saloon.id,
          slug: booking.saloon.slug,
          nameBn: booking.saloon.nameBn,
          nameEn: booking.saloon.nameEn,
          address: booking.saloon.address,
          phone: booking.saloon.phone,
          totalChairs: booking.saloon.totalChairs,
          busyChairs: booking.saloon.busyChairs,
          currentServingToken: booking.saloon.currentServingToken,
          manualQueueCount: booking.saloon.manualQueueCount,
        },
        queueMetrics: {
          waitingAhead,
          manualQueueAhead: booking.saloon.manualQueueCount,
          totalQueueAhead,
          estWaitMins,
          isCurrentTurn:
            booking.status === "IN_SERVICE" ||
            booking.tokenNumber === booking.saloon.currentServingToken,
        },
      });
    }

    // List user's bookings
    const whereClause: any = {};
    if (userId) {
      whereClause.OR = [{ customerId: userId }];
      if (phone) whereClause.OR.push({ guestPhone: phone });
    } else if (phone) {
      whereClause.guestPhone = phone;
    } else {
      return NextResponse.json(
        { error: "ইউজার আইডি, ফোন নম্বর অথবা সেলুন আইডি প্রয়োজন।" },
        { status: 400 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        saloon: {
          select: {
            id: true,
            slug: true,
            nameBn: true,
            nameEn: true,
            address: true,
            phone: true,
            currentServingToken: true,
            totalChairs: true,
            busyChairs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const enriched = bookings.map((b) => {
      let parsed = [];
      try {
        parsed = JSON.parse(b.servicesJson);
      } catch (e) {}
      return {
        ...b,
        services: parsed,
      };
    });

    return NextResponse.json({ bookings: enriched });
  } catch (error: any) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { error: "বুকিং তালিকা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, action } = body;

    if (!bookingId || action !== "CANCEL") {
      return NextResponse.json(
        { error: "অনুরোধ সঠিক নয়।" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "বুকিং পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status)) {
      return NextResponse.json(
        { error: "এই সিরিয়ালটি ইতোমধ্যে সমাপ্ত বা বাতিল করা হয়েছে।" },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "সিরিয়াল সফলভাবে বাতিল করা হয়েছে।",
      booking: updated,
    });
  } catch (error: any) {
    console.error("Booking cancel error:", error);
    return NextResponse.json(
      { error: "সিরিয়াল বাতিল করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
