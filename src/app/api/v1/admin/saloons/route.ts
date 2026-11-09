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
        services: {
          orderBy: { createdAt: "asc" },
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

    // Rule: Salon IDs 1001-1050 are reserved by Admin.
    // Filter out previously used IDs so they are not visible or applicable in the available list.
    const reservedRange = Array.from({ length: 50 }, (_, i) => (1001 + i).toString());
    const usedCodes = new Set(
      saloons.map((s) => s.code).filter(Boolean) as string[]
    );
    const availableReservedCodes = reservedRange.filter((c) => !usedCodes.has(c));

    return NextResponse.json({
      saloons,
      availableReservedCodes,
      totalReserved: 50,
      usedReservedCount: reservedRange.filter((c) => usedCodes.has(c)).length,
    });
  } catch (error: any) {
    console.error("Admin saloons GET error:", error);
    return NextResponse.json({ error: "সেলুন তালিকা পাওয়া যায়নি।", details: error?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code: requestedCode,
      nameBn,
      nameEn,
      ownerName,
      ownerPhone,
      email,
      address,
      latitude,
      longitude,
      category = "GENTS",
      isAc = false,
      acceptsDigitalPayment = true,
      totalChairs = 3,
      coverImage,
      services = [],
    } = body;

    if (!nameBn || !nameEn || !ownerName || !ownerPhone || !address) {
      return NextResponse.json(
        { error: "সেলুনের নাম (বাংলা ও ইংরেজি), মালিকের নাম, মোবাইল নম্বর এবং ঠিকানা দিন।" },
        { status: 400 }
      );
    }

    // Determine and validate Salon ID (Code)
    let code = requestedCode ? String(requestedCode).trim() : null;

    if (code) {
      if (!/^\d{4,}$/.test(code)) {
        return NextResponse.json(
          { error: "সেলুন আইডি অন্তত ৪ ডিজিটের সংখ্যা হতে হবে (যেমন: 1001)।" },
          { status: 400 }
        );
      }
      const existing = await prisma.saloon.findFirst({ where: { code } as any });
      if (existing) {
        return NextResponse.json(
          { error: `সেলুন আইডি #${code} ইতিমধ্যেই ব্যবহৃত হয়েছে। ড্রপডাউন থেকে খালি আইডি বেছে নিন।` },
          { status: 400 }
        );
      }
    } else {
      // Pick the lowest available reserved ID from 1001 to 1050
      const allSalons = await prisma.saloon.findMany({ select: { code: true } as any });
      const usedCodes = new Set(allSalons.map((s: any) => s.code).filter(Boolean));
      for (let i = 1001; i <= 1050; i++) {
        const candidate = i.toString();
        if (!usedCodes.has(candidate)) {
          code = candidate;
          break;
        }
      }
      if (!code) {
        return NextResponse.json(
          { error: "এডমিন সংরক্ষিত আইডি (১০০১-১০৫০) এর সবগুলো ব্যবহৃত হয়ে গেছে। অনুগ্রহ করে একটি নির্দিষ্ট আইডি টাইপ করুন।" },
          { status: 400 }
        );
      }
    }

    // Find or create Owner User
    const cleanPhone = String(ownerPhone).trim();
    let owner = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!owner) {
      owner = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: ownerName.trim(),
          role: "OWNER",
          languagePref: "bn",
          status: "ACTIVE",
        },
      });
    } else {
      // Upgrade role to OWNER if not already, and update name
      owner = await prisma.user.update({
        where: { id: owner.id },
        data: {
          role: "OWNER",
          name: owner.name || ownerName.trim(),
        },
      });
    }

    // Generate unique slug
    const baseSlug = nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${randomSuffix}`;

    const chairsCount = Number(totalChairs) || 3;
    const initialChairStates = Array.from({ length: chairsCount }, (_, i) => ({
      chairNo: i + 1,
      isBusy: false,
    }));

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day trial

    // Create the salon
    const salon = await prisma.saloon.create({
      data: {
        ownerId: owner.id,
        code,
        slug,
        nameBn: nameBn.trim(),
        nameEn: nameEn.trim(),
        category: ["GENTS", "LADIES", "UNISEX"].includes(category) ? category : "GENTS",
        isAc: Boolean(isAc),
        acceptsDigitalPayment: Boolean(acceptsDigitalPayment),
        address: address.trim(),
        phone: cleanPhone,
        email: email ? String(email).trim() : null,
        latitude: Number(latitude) || 23.8103,
        longitude: Number(longitude) || 90.4125,
        totalChairs: chairsCount,
        busyChairs: 0,
        chairStates: JSON.stringify(initialChairStates),
        manualQueueCount: 0,
        currentServingToken: 0,
        status: "ACTIVE",
        trialEndsAt,
        coverImage:
          coverImage ||
          "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=60",
      },
    });

    // Create services if provided, or default common services
    const servicesToCreate =
      Array.isArray(services) && services.length > 0
        ? services
        : [
          { nameBn: "চুল কাটা", nameEn: "Hair Cutting", price: 200, durationMins: 25 },
          { nameBn: "দাড়ি শেভ ও ট্রিম", nameEn: "Beard Shave & Trim", price: 120, durationMins: 15 },
          { nameBn: "হেড ম্যাসাজ", nameEn: "Head Massage", price: 250, durationMins: 20 },
          { nameBn: "ফেসিয়াল ট্রিটমেন্ট", nameEn: "Facial Treatment", price: 500, durationMins: 35 },
        ];

    for (const s of servicesToCreate) {
      if (s.nameBn && s.price) {
        await prisma.salonService.create({
          data: {
            saloonId: salon.id,
            nameBn: String(s.nameBn).trim(),
            nameEn: s.nameEn ? String(s.nameEn).trim() : String(s.nameBn).trim(),
            price: Number(s.price),
            durationMins: Number(s.durationMins) || 25,
            details: s.details ? String(s.details).trim() : null,
            isActive: true,
          },
        });
      }
    }

    const createdSalon = await prisma.saloon.findUnique({
      where: { id: salon.id },
      include: {
        owner: { select: { id: true, name: true, phone: true } },
        services: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `সেলুন "${salon.nameBn}" (আইডি: #${salon.code}) ও ${servicesToCreate.length}টি সার্ভিস সফলভাবে তৈরি হয়েছে!`,
      salon: createdSalon,
    });
  } catch (error: any) {
    console.error("Admin salon creation error:", error);
    return NextResponse.json(
      { error: "সেলুন তৈরি করতে সমস্যা হয়েছে: " + (error?.message || "সার্ভার ত্রুটি") },
      { status: 500 }
    );
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
