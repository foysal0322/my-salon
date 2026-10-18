import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, chairNo, delta, bookingId, autoIncome } = body;

    const salon = await prisma.saloon.findUnique({
      where: { id },
    });

    if (!salon) {
      return NextResponse.json(
        { error: "সেলুন খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Toggle single chair state Available <-> Busy
    if (action === "TOGGLE_CHAIR") {
      let chairs: Array<{ chairNo: number; isBusy: boolean }> = [];
      try {
        chairs = JSON.parse(salon.chairStates);
      } catch (e) {
        chairs = Array.from({ length: salon.totalChairs }, (_, i) => ({
          chairNo: i + 1,
          isBusy: false,
        }));
      }

      const target = chairs.find((c) => c.chairNo === chairNo);
      if (target) {
        target.isBusy = !target.isBusy;
      } else {
        chairs.push({ chairNo, isBusy: true });
      }

      const busyCount = chairs.filter((c) => c.isBusy).length;

      const updated = await prisma.saloon.update({
        where: { id },
        data: {
          chairStates: JSON.stringify(chairs),
          busyChairs: busyCount,
        },
      });

      return NextResponse.json({
        success: true,
        salon: updated,
        chairStates: chairs,
        busyChairs: busyCount,
      });
    }

    // 2. Adjust manual walk-in queue counter (+1 / -1)
    if (action === "ADJUST_WALK_IN") {
      const adjustment = Number(delta || 0);
      const newCount = Math.max(0, salon.manualQueueCount + adjustment);

      const updated = await prisma.saloon.update({
        where: { id },
        data: { manualQueueCount: newCount },
      });

      return NextResponse.json({
        success: true,
        manualQueueCount: updated.manualQueueCount,
      });
    }

    // 3. Call Next Customer
    if (action === "CALL_NEXT") {
      // Find the next waiting customer for today
      const nextBooking = await prisma.booking.findFirst({
        where: {
          saloonId: id,
          bookingDate: todayStr,
          status: "WAITING",
        },
        orderBy: { tokenNumber: "asc" },
      });

      if (nextBooking) {
        // Update booking status to IN_SERVICE and advance salon serving token
        await prisma.booking.update({
          where: { id: nextBooking.id },
          data: { status: "IN_SERVICE" },
        });

        const updatedSalon = await prisma.saloon.update({
          where: { id },
          data: { currentServingToken: nextBooking.tokenNumber },
        });

        return NextResponse.json({
          success: true,
          message: `টোকেন #${nextBooking.tokenNumber} (${nextBooking.guestName}) কে ডাকা হয়েছে!`,
          currentServingToken: updatedSalon.currentServingToken,
          calledBooking: nextBooking,
        });
      } else {
        // No online booking, check if walk-in exists
        if (salon.manualQueueCount > 0) {
          const updatedSalon = await prisma.saloon.update({
            where: { id },
            data: {
              manualQueueCount: Math.max(0, salon.manualQueueCount - 1),
              currentServingToken: salon.currentServingToken + 1,
            },
          });
          return NextResponse.json({
            success: true,
            message: "ওয়াক-ইন কাস্টমার ডাকা হয়েছে!",
            currentServingToken: updatedSalon.currentServingToken,
          });
        }

        return NextResponse.json({
          success: false,
          message: "লাইনে অপেক্ষমাণ কোন কাস্টমার নেই।",
        });
      }
    }

    // 3.5 Start Specific Booking Service
    if (action === "START_SERVICE") {
      if (!bookingId) {
        return NextResponse.json({ error: "বুকিং আইডি প্রদান করুন।" }, { status: 400 });
      }

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return NextResponse.json({ error: "বুকিং পাওয়া যায়নি।" }, { status: 404 });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "IN_SERVICE" },
      });

      const updatedSalon = await prisma.saloon.update({
        where: { id },
        data: { currentServingToken: booking.tokenNumber },
      });

      return NextResponse.json({
        success: true,
        message: `টোকেন #${booking.tokenNumber} (${booking.guestName}) এর কাজ শুরু হয়েছে।`,
        currentServingToken: updatedSalon.currentServingToken,
      });
    }

    // 4. Complete Service & Convert to Income
    if (action === "COMPLETE_BOOKING") {
      if (!bookingId) {
        return NextResponse.json(
          { error: "বুকিং আইডি প্রদান করুন।" },
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

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "COMPLETED" },
      });

      // 1-Tap convert to ledger income entry if requested
      if (autoIncome) {
        await prisma.ledgerEntry.create({
          data: {
            saloonId: id,
            type: "INCOME",
            category: "সার্ভিস বিল (App Booking)",
            amount: booking.totalAmount,
            note: `টোকেন #${booking.tokenNumber} - ${booking.guestName} (${booking.guestPhone})`,
            entryDate: todayStr,
            bookingId: booking.id,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "সার্ভিস সফলভাবে সম্পন্ন হয়েছে!",
        booking: updatedBooking,
      });
    }

    // 5. Skip / Hold Token (move down by 2 positions)
    if (action === "SKIP_BOOKING") {
      if (!bookingId) {
        return NextResponse.json({ error: "বুকিং আইডি প্রদান করুন।" }, { status: 400 });
      }

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return NextResponse.json({ error: "বুকিং পাওয়া যায়নি।" }, { status: 404 });

      // Move token down by updating tokenNumber or keeping status WAITING
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          tokenNumber: booking.tokenNumber + 2,
          status: "WAITING",
        },
      });

      return NextResponse.json({
        success: true,
        message: `টোকেন #${booking.tokenNumber} কে সাময়িকভাবে ২ ধাপ পেছনে রাখা হয়েছে।`,
        booking: updatedBooking,
      });
    }

    // 6. Mark No-Show
    if (action === "NO_SHOW") {
      if (!bookingId) {
        return NextResponse.json({ error: "বুকিং আইডি প্রদান করুন।" }, { status: 400 });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "NO_SHOW" },
      });

      return NextResponse.json({
        success: true,
        message: "কাস্টমারকে অনুপস্থিত (No-Show) চিহ্নিত করা হয়েছে।",
        booking: updatedBooking,
      });
    }

    return NextResponse.json({ error: "অ্যাকশন সঠিক নয়।" }, { status: 400 });
  } catch (error: any) {
    console.error("Owner state update error:", error);
    return NextResponse.json(
      { error: "অবস্থা আপডেট করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
