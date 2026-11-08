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
      select: {
        id: true,
        slug: true,
        nameBn: true,
        nameEn: true,
        code: true,
        address: true,
        phone: true,
        category: true,
        isAc: true,
        totalChairs: true,
        ownerId: true,
      } as any,
    });

    if (!salon) {
      return NextResponse.json({ error: "সেলুন পাওয়া যায়নি।" }, { status: 404 });
    }

    // Canonical domain for QR poster & customer booking
    const targetPath = (salon as any).code || `s/${salon.slug}`;
    const qrTargetUrl = `https://amarsalon.xyz/${targetPath}`;

    const { searchParams } = new URL(request.url);
    if (searchParams.get("download") === "1" || searchParams.get("download") === "true") {
      const pngBuffer = await QRCode.toBuffer(qrTargetUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 1500,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });

      return new Response(pngBuffer as any, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="amarsalon-qr-${(salon as any).code || salon.slug}.png"`,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Generate high error-correction (Level H) QR code Data URL (1200px for ultra high-res print posters)
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 1200,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      qrTargetUrl,
      qrDataUrl,
      slug: salon.slug,
      code: (salon as any).code || null,
      salon,
    });
  } catch (error: any) {
    console.error("QR generation error:", error);
    return NextResponse.json({ error: "QR কোড তৈরি করা যায়নি।" }, { status: 500 });
  }
}
