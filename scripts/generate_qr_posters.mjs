import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import puppeteer from "puppeteer-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUTPUT_DIR = path.resolve(process.cwd(), "qr-poster");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log("==================================================");
  console.log("Generating 80 High-Res Print-Ready QR Posters...");
  console.log("IDs: 1001 - 1040 (2 posters each)");
  console.log("Size: 8.5\" x 5.5\" (1650 x 2550 px @ 300 DPI)");
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log("==================================================\n");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1650, height: 2550 });

  // Navigate to localhost:3000 to inherit authentic Hind Siliguri font and web styles
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);

  // Preload and verify fonts in browser context
  await page.evaluate(async () => {
    await document.fonts.load("bold 98px 'Hind Siliguri'");
    await document.fonts.load("bold 40px sans-serif");
    await document.fonts.load("bold 44px sans-serif");
    await document.fonts.load("bold 48px 'Hind Siliguri'");
    await document.fonts.load("600 42px 'Hind Siliguri'");
    await document.fonts.load("bold 72px 'Hind Siliguri'");
    await document.fonts.load("bold 50px 'Hind Siliguri'");
    await document.fonts.load("bold 60px monospace");
  });

  console.log("Fonts preloaded. Starting canvas rendering...\n");

  const startTime = Date.now();

  for (let id = 1001; id <= 1040; id++) {
    const code = String(id);
    const qrTargetUrl = `https://amarsalon.xyz/${code}`;

    // Generate Level H QR code Data URL (1200px)
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 1200,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });

    const dataUrl = await page.evaluate(
      async (qrUrl, salonCode) => {
        const canvas = document.createElement("canvas");
        const width = 1650;
        const height = 2550;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        function drawRoundRect(c, x, y, w, h, r) {
          if (typeof c.roundRect === "function") {
            c.roundRect(x, y, w, h, r);
          } else {
            c.beginPath();
            c.moveTo(x + r, y);
            c.arcTo(x + w, y, x + w, y + h, r);
            c.arcTo(x + w, y + h, x, y + h, r);
            c.arcTo(x, y + h, x, y, r);
            c.arcTo(x, y, x + w, y, r);
            c.closePath();
          }
        }

        function drawSalonLogo(c, x, y, r) {
          c.save();
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.fillStyle = "#FDE047"; // Golden Amber
          c.fill();
          c.lineWidth = Math.max(3, r * 0.1);
          c.strokeStyle = "#FFFFFF";
          c.stroke();

          // Stylized Scissors Icon inside badge
          c.strokeStyle = "#0F172A";
          c.fillStyle = "#0F172A";
          c.lineWidth = Math.max(3.5, r * 0.11);
          c.lineCap = "round";

          c.beginPath();
          c.moveTo(x - r * 0.42, y - r * 0.45);
          c.lineTo(x + r * 0.28, y + r * 0.35);
          c.stroke();

          c.beginPath();
          c.moveTo(x + r * 0.42, y - r * 0.45);
          c.lineTo(x - r * 0.28, y + r * 0.35);
          c.stroke();

          c.beginPath();
          c.arc(x, y - r * 0.05, Math.max(3, r * 0.1), 0, Math.PI * 2);
          c.fillStyle = "#FFFFFF";
          c.fill();

          c.beginPath();
          c.arc(x - r * 0.35, y + r * 0.42, r * 0.2, 0, Math.PI * 2);
          c.stroke();

          c.beginPath();
          c.arc(x + r * 0.35, y + r * 0.42, r * 0.2, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }

        // 1. Poster Background: #0D9488
        ctx.fillStyle = "#0D9488";
        ctx.fillRect(0, 0, width, height);

        // 2. Poster border line with rounded corners (48px radius)
        ctx.beginPath();
        drawRoundRect(ctx, 40, 40, width - 80, height - 80, 48);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // 3. Top Heading: Large bold heading with maxWidth guard
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 98px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("অনলাইনে সিরিয়াল দিতে স্ক্যান করুন", width / 2, 160, width - 180);

        ctx.fillStyle = "#FDE047"; // Golden Amber
        ctx.font = "bold 40px sans-serif";
        ctx.fillText("SCAN WITH PHONE CAMERA TO BOOK ONLINE", width / 2, 250, width - 180);

        // Top subtle divider line
        ctx.beginPath();
        ctx.moveTo(80, 295);
        ctx.lineTo(width - 80, 295);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 4. Central QR Code Box (980x980 px)
        const qrBoxSize = 980;
        const qrBoxX = (width - qrBoxSize) / 2;
        const qrBoxY = 365;

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 36);
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.stroke();

        // Draw QR Code
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = qrUrl;
        await new Promise((resolve) => {
          if (qrImg.complete) {
            resolve();
          } else {
            qrImg.onload = () => resolve();
            qrImg.onerror = () => resolve();
          }
        });

        const qrPadding = 28;
        ctx.drawImage(
          qrImg,
          qrBoxX + qrPadding,
          qrBoxY + qrPadding,
          qrBoxSize - qrPadding * 2,
          qrBoxSize - qrPadding * 2
        );

        // 5. Short URL & Salon ID Highlight
        const idBadgeWidth = 660;
        const idBadgeHeight = 90;
        const idBadgeY = 1410;
        ctx.fillStyle = "#0F172A"; // Dark slate pill
        ctx.beginPath();
        drawRoundRect(ctx, (width - idBadgeWidth) / 2, idBadgeY, idBadgeWidth, idBadgeHeight, 45);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 44px sans-serif";
        ctx.fillText(`সেলুন কোড / ID: #${salonCode}`, width / 2, idBadgeY + 45, idBadgeWidth - 40);

        // Direct domain link in golden amber: amarsalon.xyz
        ctx.fillStyle = "#FDE047";
        ctx.font = "bold 64px monospace";
        ctx.fillText(`amarsalon.xyz/${salonCode}`, width / 2, idBadgeY + 140, width - 200);

        // 6. 3 Steps Box (1520px wide, perfect padding)
        const stepBoxX = 65;
        const stepBoxY = 1665;
        const stepBoxWidth = width - 130;
        const stepBoxHeight = 440;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        drawRoundRect(ctx, stepBoxX, stepBoxY, stepBoxWidth, stepBoxHeight, 32);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#0F172A";
        ctx.font = "bold 48px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
        ctx.fillText("সহজ ৩ ধাপে সিরিয়াল নেওয়ার নিয়ম:", 135, stepBoxY + 65, stepBoxWidth - 120);

        const steps = [
          `১. ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন (বা amarsalon.xyz/${salonCode} এ যান)`,
          "২. 'প্রিয় সেলুন' (My Salons)-এ যুক্ত করুন দ্রুত সিরিয়াল পাওয়ার জন্য",
          "৩. ঘরে বসেই চেয়ার খালি আছে কিনা দেখুন ও সিরিয়াল নিন",
        ];

        steps.forEach((st, idx) => {
          const lineY = stepBoxY + 155 + idx * 110;
          ctx.fillStyle = "#0D9488";
          ctx.beginPath();
          ctx.arc(160, lineY - 14, 28, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 28px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(String(idx + 1), 160, lineY - 4);

          ctx.textAlign = "left";
          ctx.fillStyle = "#1E293B";
          ctx.font = "600 42px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
          ctx.fillText(st.slice(3), 205, lineY, stepBoxWidth - 160);
        });

        // 7. Footer: All footer text at the absolute bottom-most position
        const footerDividerY = 2215;
        ctx.beginPath();
        ctx.moveTo(80, footerDividerY);
        ctx.lineTo(width - 80, footerDividerY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Salon Logo Emblem & Brand Text
        const brandY = 2300;
        drawSalonLogo(ctx, width / 2 - 295, brandY, 48);

        ctx.textAlign = "left";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 72px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
        ctx.fillText("AmarSalon • আমার সেলুন", width / 2 - 225, brandY + 8, width - 400);

        // App Download Message
        ctx.textAlign = "center";
        ctx.fillStyle = "#FDE047";
        ctx.font = "bold 50px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
        ctx.fillText("📱 সহজ ও দ্রুত সিরিয়ালের জন্য আমাদের অ্যাপটি ইন্সটল করুন", width / 2, 2395, width - 160);

        // Official URL: Resting right at the bottom edge above border line (zero space below)
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 60px monospace";
        ctx.fillText("amarsalon.xyz", width / 2, 2478, width - 160);

        return canvas.toDataURL("image/png");
      },
      qrDataUrl,
      code
    );

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const file1 = path.join(OUTPUT_DIR, `poster-${code}-1.png`);
    const file2 = path.join(OUTPUT_DIR, `poster-${code}-2.png`);

    fs.writeFileSync(file1, buffer);
    fs.copyFileSync(file1, file2);

    const idx = id - 1000;
    console.log(`[${idx}/40] Generated: poster-${code}-1.png & poster-${code}-2.png (${(buffer.length / 1024).toFixed(0)} KB)`);
  }

  await browser.close();

  // Clean up any test file if present
  const testFile = path.join(OUTPUT_DIR, "poster-1001-test.png");
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n==================================================`);
  console.log(`Successfully generated all 80 posters in ${durationSec}s!`);
  console.log(`Folder: ${OUTPUT_DIR}`);
  console.log(`==================================================`);
}

main().catch((err) => {
  console.error("Poster generation failed:", err);
  process.exit(1);
});
