import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        saloon: {
          select: {
            id: true,
            nameBn: true,
            nameEn: true,
            phone: true,
            slug: true,
            subscriptionEndsAt: true,
            owner: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    return NextResponse.json({ error: "সাবস্ক্রিপশন তালিকা পাওয়া যায়নি।" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { subscriptionId, action, adminNote } = body; // action: "APPROVE" or "REJECT"

    if (!subscriptionId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "অনুরোধ সঠিক নয়।" }, { status: 400 });
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { saloon: true },
    });

    if (!sub) {
      return NextResponse.json({ error: "সাবস্ক্রিপশন রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    if (action === "REJECT") {
      const updated = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "REJECTED",
          adminNote: adminNote || "পেমেন্ট তথ্যের অসঙ্গতির কারণে বাতিল করা হয়েছে।",
        },
      });
      return NextResponse.json({
        success: true,
        message: "পেমেন্টটি বাতিল করা হয়েছে।",
        subscription: updated,
      });
    }

    // APPROVE
    const now = new Date();
    const currentExpiry =
      sub.saloon.subscriptionEndsAt && new Date(sub.saloon.subscriptionEndsAt) > now
        ? new Date(sub.saloon.subscriptionEndsAt)
        : now;

    const daysToAdd = sub.planType === "YEARLY" ? 365 : 30;
    const newExpiry = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const [updatedSub] = await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "APPROVED",
          validUntil: newExpiry,
          adminNote: adminNote || "পেমেন্ট সফলভাবে যাচাই করে অনুমোদন করা হয়েছে।",
        },
      }),
      prisma.saloon.update({
        where: { id: sub.saloonId },
        data: {
          subscriptionEndsAt: newExpiry,
          status: "ACTIVE",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `পেমেন্ট অনুমোদিত হয়েছে! সেলুনের মেয়াদ ${newExpiry.toISOString().split("T")[0]} পর্যন্ত বৃদ্ধি করা হয়েছে।`,
      subscription: updatedSub,
    });
  } catch (error: any) {
    console.error("Admin sub update error:", error);
    return NextResponse.json({ error: "অনুমোদন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
