import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const services = await prisma.salonService.findMany({
      where: { saloonId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: "সার্ভিস লোড করা যায়নি।" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nameBn, nameEn, price, durationMins = 25, details } = body;

    if (!nameBn || !price) {
      return NextResponse.json(
        { error: "সার্ভিসের নাম ও মূল্য প্রদান করুন।" },
        { status: 400 }
      );
    }

    const service = await prisma.salonService.create({
      data: {
        saloonId: id,
        nameBn,
        nameEn: nameEn || nameBn,
        price: Number(price),
        durationMins: Number(durationMins),
        details,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "নতুন সার্ভিস সফলভাবে যুক্ত হয়েছে!",
      service,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "সার্ভিস তৈরি করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { serviceId, nameBn, nameEn, price, durationMins, details, isActive } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "সার্ভিস আইডি প্রয়োজন।" }, { status: 400 });
    }

    const updated = await prisma.salonService.update({
      where: { id: serviceId },
      data: {
        nameBn: nameBn !== undefined ? nameBn : undefined,
        nameEn: nameEn !== undefined ? nameEn : undefined,
        price: price !== undefined ? Number(price) : undefined,
        durationMins: durationMins !== undefined ? Number(durationMins) : undefined,
        details: details !== undefined ? details : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "সার্ভিস সফলভাবে আপডেট হয়েছে।",
      service: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "সার্ভিস আপডেট করা যায়নি।" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "সার্ভিস আইডি প্রয়োজন।" }, { status: 400 });
    }

    await prisma.salonService.delete({
      where: { id: serviceId },
    });

    return NextResponse.json({
      success: true,
      message: "সার্ভিস মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ error: "সার্ভিস মুছতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
