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
      bankName,
      accountName,
      accountNumber,
    } = body;

      if (!saloonId) {
        return NextResponse.json(
          { error: "সেলুন আইডি প্রদান করুন।" },
          { status: 400 }
        );
      }

      if (paymentMethod === "BANK") {
        if (!bankName || !accountName || !accountNumber) {
          return NextResponse.json(
            { error: "ব্যাংকের নাম, অ্যাকাউন্টের নাম এবং অ্যাকাউন্ট নম্বর আবশ্যক।" },
            { status: 400 }
          );
        }
      } else {
        if (!trxId && !receiptUrl) {
          return NextResponse.json(
            { error: "Transaction ID (TrxID) প্রদান করুন।" },
            { status: 400 }
          );
        }
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

      const amount = planType === "YEARLY" ? 1010 : 99;

      const adminNote =
        paymentMethod === "BANK"
          ? `ব্যাংক: ${bankName} | হিসাবের নাম: ${accountName} | হিসাব নং: ${accountNumber}`
          : null;

      const subscription = await prisma.subscription.create({
        data: {
          saloonId,
          planType,
          amount,
          paymentMethod,
          senderNumber: paymentMethod === "BANK" ? String(accountNumber).trim() : (senderNumber ? String(senderNumber).trim() : null),
          trxId: cleanTrxId,
          receiptUrl,
          adminNote,
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
