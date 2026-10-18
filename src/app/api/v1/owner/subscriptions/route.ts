import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const saloonId = searchParams.get("saloonId");

    if (!saloonId) {
      return NextResponse.json({ error: "সেলুন আইডি প্রয়োজন।" }, { status: 400 });
    }

    const salon = await prisma.saloon.findUnique({
      where: { id: saloonId },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!salon) {
      return NextResponse.json({ error: "সেলুন পাওয়া যায়নি।" }, { status: 404 });
    }

    const now = new Date();
    const trialDaysLeft = Math.max(
      0,
      Math.ceil((new Date(salon.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const isSubActive =
      salon.subscriptionEndsAt && new Date(salon.subscriptionEndsAt) > now;
    const isTrialActive = new Date(salon.trialEndsAt) > now;

    return NextResponse.json({
      status: isSubActive ? "ACTIVE" : isTrialActive ? "TRIAL" : "EXPIRED",
      trialEndsAt: salon.trialEndsAt,
      trialDaysLeft,
      subscriptionEndsAt: salon.subscriptionEndsAt,
      subscriptions: salon.subscriptions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "তথ্য লোড করা যায়নি।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      saloonId,
      planType = "MONTHLY", // MONTHLY or YEARLY
      paymentMethod = "BKASH", // BKASH, NAGAD, ROCKET, BANK
      senderNumber,
      trxId,
      receiptUrl,
    } = body;

    if (!saloonId || (!trxId && !receiptUrl)) {
      return NextResponse.json(
        { error: "Transaction ID (TrxID) অথবা ব্যাংক স্লিপের তথ্য প্রদান করুন।" },
        { status: 400 }
      );
    }

    const cleanTrxId = trxId ? String(trxId).trim().toUpperCase() : null;

    // Rule TRD Section 9.2: TrxID Anti-Fraud check
    if (cleanTrxId) {
      const existing = await prisma.subscription.findUnique({
        where: { trxId: cleanTrxId },
      });
      if (existing) {
        return NextResponse.json(
          {
            error:
              "এই Transaction ID (TrxID) দিয়ে ইতোমধ্যে পেমেন্ট সাবমিট করা হয়েছে। ভিন্ন TrxID প্রদান করুন।",
          },
          { status: 400 }
        );
      }
    }

    const amount = planType === "YEARLY" ? 4999 : 499;

    const subscription = await prisma.subscription.create({
      data: {
        saloonId,
        planType,
        amount,
        paymentMethod,
        senderNumber: senderNumber ? String(senderNumber).trim() : null,
        trxId: cleanTrxId,
        receiptUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "পেমেন্টের তথ্য জমা হয়েছে। এডমিন যাচাই করে প্যাকেজ সচল করবেন (সাধারণত ১৫-৩০ মিনিট)।",
      subscription,
    });
  } catch (error: any) {
    console.error("Subscription submission error:", error);
    return NextResponse.json(
      { error: "পেমেন্ট সাবমিট করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
