import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ favorites: [] });
    }

    const favs = await prisma.favoriteSalon.findMany({
      where: { userId },
      select: { saloonId: true },
    });

    return NextResponse.json({
      favorites: favs.map((f) => f.saloonId),
    });
  } catch (error: any) {
    return NextResponse.json({ error: "প্রিয় সেলুন লোড করা যায়নি।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, saloonId, action } = body;

    if (!userId || !saloonId) {
      return NextResponse.json({ error: "ইউজার আইডি ও সেলুন আইডি প্রয়োজন।" }, { status: 400 });
    }

    if (action === "remove") {
      await prisma.favoriteSalon.deleteMany({
        where: { userId, saloonId },
      });
      return NextResponse.json({ success: true, isFavorite: false });
    } else {
      await prisma.favoriteSalon.upsert({
        where: {
          userId_saloonId: { userId, saloonId },
        },
        create: { userId, saloonId },
        update: {},
      });
      return NextResponse.json({ success: true, isFavorite: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "প্রিয় সেলুন আপডেট করা যায়নি।" }, { status: 500 });
  }
}
