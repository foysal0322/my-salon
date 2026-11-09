import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let buffer: Buffer;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "কোনো ফাইল নির্বাচন করা হয়নি।" }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      const body = await request.json();
        const rawImage = body.dataUrl || body.image;
        if (!rawImage) {
          return NextResponse.json({ error: "ছবির ডাটা পাওয়া যায়নি।" }, { status: 400 });
        }
        const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, "");
        buffer = Buffer.from(base64Data, "base64");
      }

      // Auto-compress and optimize image to WebP with sharp:
      // 1. Auto-rotate based on phone camera EXIF orientation
      // 2. Resize to max dimensions 1280x800 preserving aspect ratio
      // 3. High quality WebP output (82%) with effort 4 (drastically saves disk space without quality degradation)
      const optimizedBuffer = await sharp(buffer)
        .rotate()
        .resize({
          width: 1280,
          height: 800,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      const filename = `salon-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.webp`;
      const filePath = path.join(uploadsDir, filename);
      await writeFile(filePath, optimizedBuffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${filename}`,
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      return NextResponse.json(
        { error: "ছবি আপলোড করতে সমস্যা হয়েছে।" },
        { status: 500 }
      );
    }
  }
