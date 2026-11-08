import { prisma } from "@/lib/prisma";

export interface SalonItem {
  id: string;
  code?: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  category: "GENTS" | "LADIES" | "UNISEX";
  isAc: boolean;
  address: string;
  phone: string;
  totalChairs: number;
  busyChairs: number;
  freeChairs: number;
  currentServingToken: number;
  totalQueue: number;
  estWaitMins: number;
  distanceKm: number;
  coverImage?: string;
  services: Array<{ id: string; nameBn: string; price: number }>;
}

export async function getInitialSaloons(): Promise<SalonItem[]> {
  try {
    const now = new Date();
    const saloons = await prisma.saloon.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { trialEndsAt: { gt: now } },
          { subscriptionEndsAt: { gt: now } },
        ],
      },
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

    return saloons.map((s) => {
      let chairs: Array<{ chairNo: number; isBusy: boolean }> = [];
      try {
        chairs = JSON.parse(s.chairStates);
      } catch (e) {
        chairs = Array.from({ length: s.totalChairs }, (_, i) => ({
          chairNo: i + 1,
          isBusy: false,
        }));
      }

      const busyChairs = chairs.filter((c) => c.isBusy).length;
      const freeChairs = Math.max(0, s.totalChairs - busyChairs);
      const onlineWaitingCount = s._count.bookings;
      const manualQueueCount = s.manualQueueCount || 0;
      const totalQueue = onlineWaitingCount + manualQueueCount;
      const estWaitMins = Math.ceil((totalQueue * 15) / Math.max(1, s.totalChairs));

      return {
        id: s.id,
        code: (s as any).code || undefined,
        slug: s.slug,
        nameBn: s.nameBn,
        nameEn: s.nameEn,
        category: s.category as "GENTS" | "LADIES" | "UNISEX",
        isAc: s.isAc,
        address: s.address,
        phone: s.phone,
        totalChairs: s.totalChairs,
        busyChairs,
        freeChairs,
        currentServingToken: s.currentServingToken,
        totalQueue,
        estWaitMins,
        distanceKm: 0,
        coverImage: s.coverImage || undefined,
        services: s.services.map((srv) => ({
          id: srv.id,
          nameBn: srv.nameBn,
          price: srv.price,
        })),
      };
    });
  } catch (error) {
    console.error("Failed to fetch initial saloons:", error);
    return [];
  }
}

