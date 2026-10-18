import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Haversine formula in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category"); // GENTS, LADIES, UNISEX
    const isAcParam = searchParams.get("isAc");
    const freeChairsParam = searchParams.get("freeChairs");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    const now = new Date();

    // Query active and valid subscription / trial salons
    const whereClause: any = {
      status: "ACTIVE",
      OR: [
        { trialEndsAt: { gt: now } },
        { subscriptionEndsAt: { gt: now } },
      ],
    };

    if (category && ["GENTS", "LADIES", "UNISEX"].includes(category.toUpperCase())) {
      whereClause.category = category.toUpperCase();
    }

    if (isAcParam === "true") {
      whereClause.isAc = true;
    } else if (isAcParam === "false") {
      whereClause.isAc = false;
    }

    // Fetch matching salons
    let saloons = await prisma.saloon.findMany({
      where: whereClause,
      include: {
        services: {
          where: { isActive: true },
          take: 5,
        },
        _count: {
          select: {
            bookings: {
              where: { status: "WAITING" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Apply search filter in-memory for bilingual Bangla and English matching
    if (search) {
      saloons = saloons.filter((s) => {
        const matchName =
          s.nameBn.toLowerCase().includes(search) ||
          s.nameEn.toLowerCase().includes(search) ||
          s.address.toLowerCase().includes(search);
        const matchService = s.services.some(
          (srv) =>
            srv.nameBn.toLowerCase().includes(search) ||
            srv.nameEn.toLowerCase().includes(search)
        );
        return matchName || matchService;
      });
    }

    // Apply free chairs filter
    if (freeChairsParam === "true") {
      saloons = saloons.filter((s) => s.totalChairs > s.busyChairs);
    }

    // Map enriched stats and calculate distances if coordinates provided
    const userLat = latParam ? parseFloat(latParam) : null;
    const userLng = lngParam ? parseFloat(lngParam) : null;

    const enriched = saloons.map((s) => {
      const freeChairs = Math.max(0, s.totalChairs - s.busyChairs);
      const onlineWaitingCount = s._count.bookings;
      const totalQueue = s.manualQueueCount + onlineWaitingCount;
      const estWaitMins = Math.ceil((totalQueue * 25) / Math.max(s.totalChairs, 1));

      let distance = 0;
      if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
        distance = calculateDistance(userLat, userLng, s.latitude, s.longitude);
      }

      return {
        id: s.id,
        slug: s.slug,
        nameBn: s.nameBn,
        nameEn: s.nameEn,
        category: s.category,
        isAc: s.isAc,
        address: s.address,
        phone: s.phone,
        latitude: s.latitude,
        longitude: s.longitude,
        totalChairs: s.totalChairs,
        busyChairs: s.busyChairs,
        freeChairs,
        currentServingToken: s.currentServingToken,
        manualQueueCount: s.manualQueueCount,
        onlineWaitingCount,
        totalQueue,
        estWaitMins,
        distanceKm: distance,
        coverImage: s.coverImage,
        services: s.services,
      };
    });

    // Sort by distance if user location is available
    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      enriched.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return NextResponse.json({ saloons: enriched });
  } catch (error: any) {
    console.error("Salons fetch error:", error);
    return NextResponse.json(
      { error: "সেলুনের তথ্য লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
