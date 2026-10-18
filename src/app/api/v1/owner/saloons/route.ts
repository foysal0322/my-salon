import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json(
        { error: "মালিকের আইডি প্রয়োজন।" },
        { status: 400 }
      );
    }

    const saloons = await prisma.saloon.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: {
            services: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ saloons });
  } catch (error: any) {
    console.error("Owner saloons fetch error:", error);
    return NextResponse.json(
      { error: "সেলুনের তালিকা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ownerId,
      nameBn,
      nameEn,
      category = "GENTS",
      isAc = false,
      address,
      phone,
      totalChairs = 3,
      latitude = 23.7461,
      longitude = 90.3742,
      coverImage,
    } = body;

    if (!ownerId || !nameBn || !nameEn || !address || !phone) {
      return NextResponse.json(
        { error: "সেলুনের নাম (বাংলা ও ইংরেজি), ঠিকানা এবং মোবাইল নম্বর দিন।" },
        { status: 400 }
      );
    }

    // Generate unique slug from English name
    const baseSlug = nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${randomSuffix}`;

    const now = new Date();
    // Rule FR-SUB-01: 30-Day Free Trial
    const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const initialChairStates = Array.from({ length: Number(totalChairs) }, (_, i) => ({
      chairNo: i + 1,
      isBusy: false,
    }));

    const salon = await prisma.saloon.create({
      data: {
        ownerId,
        slug,
        nameBn,
        nameEn,
        category,
        isAc: Boolean(isAc),
        address,
        phone,
        totalChairs: Number(totalChairs),
        busyChairs: 0,
        chairStates: JSON.stringify(initialChairStates),
        manualQueueCount: 0,
        currentServingToken: 0,
        status: "ACTIVE",
        trialEndsAt,
        latitude: Number(latitude),
        longitude: Number(longitude),
        coverImage:
          coverImage ||
          "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=60",
      },
    });

    // Seed default common services for rapid setup
    const defaultServices = [
      { nameBn: "চুল কাটা", nameEn: "Hair Cutting", price: 200, durationMins: 25 },
      { nameBn: "দাড়ি শেভ ও ট্রিম", nameEn: "Beard Shave & Trim", price: 120, durationMins: 15 },
      { nameBn: "হেড ম্যাসাজ", nameEn: "Head Massage", price: 250, durationMins: 20 },
    ];

    for (const s of defaultServices) {
      await prisma.salonService.create({
        data: {
          saloonId: salon.id,
          nameBn: s.nameBn,
          nameEn: s.nameEn,
          price: s.price,
          durationMins: s.durationMins,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "নতুন সেলুন শাখা সফলভাবে তৈরি হয়েছে!",
      salon,
    });
  } catch (error: any) {
    console.error("Owner salon creation error:", error);
    return NextResponse.json(
      { error: "সেলুন তৈরি করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      nameBn,
      nameEn,
      category,
      isAc,
      address,
      phone,
      totalChairs,
      latitude,
      longitude,
      coverImage,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "সেলুন আইডি প্রদান করুন।" },
        { status: 400 }
      );
    }

    const currentSalon = await prisma.saloon.findUnique({
      where: { id },
    });

    if (!currentSalon) {
      return NextResponse.json(
        { error: "সেলুন খুঁজে পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // If total chairs changed, re-sync chairStates array
    let updatedChairStates = currentSalon.chairStates;
    const newTotal = totalChairs ? Number(totalChairs) : currentSalon.totalChairs;
    if (newTotal !== currentSalon.totalChairs) {
      let currentStates: any[] = [];
      try {
        currentStates = JSON.parse(currentSalon.chairStates);
      } catch (e) {}

      const newStates = Array.from({ length: newTotal }, (_, i) => {
        const existing = currentStates.find((c) => c.chairNo === i + 1);
        return existing || { chairNo: i + 1, isBusy: false };
      });
      updatedChairStates = JSON.stringify(newStates);
    }

    const updated = await prisma.saloon.update({
      where: { id },
      data: {
        nameBn: nameBn ?? currentSalon.nameBn,
        nameEn: nameEn ?? currentSalon.nameEn,
        category: category ?? currentSalon.category,
        isAc: isAc !== undefined ? Boolean(isAc) : currentSalon.isAc,
        address: address ?? currentSalon.address,
        phone: phone ?? currentSalon.phone,
        totalChairs: newTotal,
        chairStates: updatedChairStates,
        latitude: latitude !== undefined ? Number(latitude) : currentSalon.latitude,
        longitude: longitude !== undefined ? Number(longitude) : currentSalon.longitude,
        coverImage: coverImage ?? currentSalon.coverImage,
      },
    });

    return NextResponse.json({
      success: true,
      message: "সেলুনের তথ্য সফলভাবে আপডেট হয়েছে।",
      salon: updated,
    });
  } catch (error: any) {
    console.error("Salon update error:", error);
    return NextResponse.json(
      { error: "সেলুন আপডেট করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
