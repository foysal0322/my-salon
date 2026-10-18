import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const salon = await prisma.saloon.findUnique({
      where: { id },
      select: { slug: true, nameBn: true, nameEn: true },
    });

    if (!salon) {
      return NextResponse.json({ error: "সেলুন পাওয়া যায়নি।" }, { status: 404 });
    }

    // Origin or canonical domain
    const host = request.headers.get("host") || "amarsaloon.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const qrTargetUrl = `${protocol}://${host}/s/${salon.slug}?utm_source=qr_poster`;

    // Generate high error-correction (Level H) QR code Data URL
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 400,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      qrTargetUrl,
      qrDataUrl,
      slug: salon.slug,
    });
  } catch (error: any) {
    console.error("QR generation error:", error);
    return NextResponse.json({ error: "QR কোড তৈরি করা যায়নি।" }, { status: 500 });
  }
}
