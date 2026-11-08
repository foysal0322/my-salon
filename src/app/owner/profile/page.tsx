"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  QrCode,
  Download,
  Share2,
  Printer,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  Clock,
  Scissors,
} from "lucide-react";

import { Suspense } from "react";

function OwnerProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "qr"; // "qr", "profile", "sub"
  const { lang, t, user, activeSalonId, setActiveSalonId, triggerHaptic } = useApp();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [salon, setSalon] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrTargetUrl, setQrTargetUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloadingPoster, setDownloadingPoster] = useState(false);

  // Profile Form State
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("GENTS");
  const [isAc, setIsAc] = useState(false);
  const [totalChairs, setTotalChairs] = useState(3);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Subscription State
  const [subStatus, setSubStatus] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState<"BKASH" | "NAGAD" | "ROCKET" | "BANK">("BKASH");
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const fetchSalonAndQr = async () => {
    let currentSalonId = activeSalonId;

    if (!currentSalonId && typeof window !== "undefined") {
      const saved = localStorage.getItem("amarsaloon_active_salon");
      if (saved) {
        currentSalonId = saved;
        setActiveSalonId?.(saved);
      }
    }

    if (!currentSalonId && user?.id) {
      try {
        const res = await fetch(`/api/v1/owner/saloons?ownerId=${user.id}`);
        const data = await res.json();
        if (data.saloons && data.saloons.length > 0) {
          currentSalonId = data.saloons[0].id;
          setActiveSalonId?.(currentSalonId);
        }
      } catch (e) { }
    }

    if (!currentSalonId) {
      try {
        const saloonsRes = await fetch(`/api/v1/saloons`);
        const saloonsData = await saloonsRes.json();
        if (saloonsData.saloons && saloonsData.saloons.length > 0) {
          currentSalonId = saloonsData.saloons[0].id;
          setActiveSalonId?.(currentSalonId);
        }
      } catch (e) { }
    }

    if (!currentSalonId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch QR Code & Salon details
      const qrRes = await fetch(`/api/v1/owner/saloons/${currentSalonId}/qr`);
      const qrData = await qrRes.json();
      if (qrData.qrDataUrl) {
        setQrDataUrl(qrData.qrDataUrl);
        setQrTargetUrl(qrData.qrTargetUrl || "");
      }

      if (qrData.salon) {
        setSalon(qrData.salon);
        setNameBn(qrData.salon.nameBn || "");
        setNameEn(qrData.salon.nameEn || "");
        setAddress(qrData.salon.address || "");
        setPhone(qrData.salon.phone || "");
        setCategory(qrData.salon.category || "GENTS");
        setIsAc(Boolean(qrData.salon.isAc));
        setTotalChairs(qrData.salon.totalChairs || 3);
      } else {
        const saloonsRes = await fetch(`/api/v1/owner/saloons?saloonId=${currentSalonId}`);
        const saloonsData = await saloonsRes.json();
        const found = saloonsData.salon || (saloonsData.saloons && saloonsData.saloons[0]);
        if (found) {
          setSalon(found);
          setNameBn(found.nameBn || "");
          setNameEn(found.nameEn || "");
          setAddress(found.address || "");
          setPhone(found.phone || "");
          setCategory(found.category || "GENTS");
          setIsAc(Boolean(found.isAc));
          setTotalChairs(found.totalChairs || 3);
        }
      }

      // 2. Fetch Subscription
      const subRes = await fetch(`/api/v1/owner/subscriptions?saloonId=${currentSalonId}`);
      const subData = await subRes.json();
      setSubStatus(subData);
    } catch (e) {
      console.error("fetchSalonAndQr error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalonAndQr();
  }, [activeSalonId, user?.id]);

  // Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/v1/owner/saloons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSalonId,
          nameBn,
          nameEn,
          address,
          phone,
          category,
          isAc,
          totalChairs: Number(totalChairs),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg(t.success);
        fetchSalonAndQr();
      }
    } catch (e) {
      setProfileMsg(t.error);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Submit Subscription Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId && paymentMethod !== "BANK") return;
    setSubmittingPayment(true);
    setPaymentError("");
    setPaymentMsg("");
    triggerHaptic(40);

    try {
      const res = await fetch("/api/v1/owner/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saloonId: activeSalonId,
          planType: selectedPlan,
          paymentMethod,
          senderNumber,
          trxId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentMsg(data.message || t.success);
        setTrxId("");
        fetchSalonAndQr();
      } else {
        setPaymentError(data.error || t.error);
      }
    } catch (e) {
      setPaymentError(t.error);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const drawRoundRect = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
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
  };

  const drawSalonLogo = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    c.save();
    // Circular badge
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = "#FDE047"; // Golden Amber
    c.fill();
    c.lineWidth = Math.max(3, r * 0.1);
    c.strokeStyle = "#FFFFFF";
    c.stroke();

    // Stylized Scissors Icon inside badge
    c.strokeStyle = "#0F172A"; // Dark slate
    c.fillStyle = "#0F172A";
    c.lineWidth = Math.max(3.5, r * 0.11);
    c.lineCap = "round";

    // Left blade to right handle
    c.beginPath();
    c.moveTo(x - r * 0.42, y - r * 0.45);
    c.lineTo(x + r * 0.28, y + r * 0.35);
    c.stroke();

    // Right blade to left handle
    c.beginPath();
    c.moveTo(x + r * 0.42, y - r * 0.45);
    c.lineTo(x - r * 0.28, y + r * 0.35);
    c.stroke();

    // Center screw
    c.beginPath();
    c.arc(x, y - r * 0.05, Math.max(3, r * 0.1), 0, Math.PI * 2);
    c.fillStyle = "#FFFFFF";
    c.fill();

    // Handle ring 1
    c.beginPath();
    c.arc(x - r * 0.35, y + r * 0.42, r * 0.2, 0, Math.PI * 2);
    c.stroke();

    // Handle ring 2
    c.beginPath();
    c.arc(x + r * 0.35, y + r * 0.42, r * 0.2, 0, Math.PI * 2);
    c.stroke();

    c.restore();
  };

  const handleDownloadPoster = async () => {
    if (!qrDataUrl) {
      alert(lang === "bn" ? "QR কোড লোড হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন..." : "QR code is still loading, please wait a moment...");
      return;
    }
    setDownloadingPoster(true);
    triggerHaptic(50);

    try {
      const canvas = document.createElement("canvas");
      // Standard 8.5" x 5.5" (Half-Letter portrait: 5.5" W x 8.5" H) in ultra-crisp 300 DPI (1650 x 2550 px)
      const width = 1650;
      const height = 2550;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context");

      // 1. Poster Background: #0D9488
      ctx.fillStyle = "#0D9488";
      ctx.fillRect(0, 0, width, height);

      // 2. Poster border line with rounded corners (48px radius)
      ctx.beginPath();
      drawRoundRect(ctx, 40, 40, width - 80, height - 80, 48);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 4.5;
      ctx.stroke();

      // 3. Top Heading: Large bold heading
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 104px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("অনলাইনে সিরিয়াল দিতে স্ক্যান করুন", width / 2, 160);

      ctx.fillStyle = "#FDE047"; // Golden Amber
      ctx.font = "bold 42px sans-serif";
      ctx.fillText("SCAN WITH PHONE CAMERA TO BOOK ONLINE", width / 2, 250);

      // Top subtle divider line
      ctx.beginPath();
      ctx.moveTo(80, 295);
      ctx.lineTo(width - 80, 295);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 4. Central QR Code Box (Significantly enlarged QR code with generous breathing space)
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

      // Ensure QR image is fully decoded into memory before drawing
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = qrDataUrl;
      try {
        if (typeof qrImg.decode === "function") {
          await qrImg.decode();
        } else {
          await new Promise<void>((resolve) => {
            qrImg.onload = () => resolve();
            qrImg.onerror = () => resolve();
            if (qrImg.complete) resolve();
          });
        }
      } catch {
        await new Promise<void>((resolve) => {
          qrImg.onload = () => resolve();
          qrImg.onerror = () => resolve();
          if (qrImg.complete) resolve();
        });
      }

      const qrPadding = 28;
      ctx.drawImage(
        qrImg,
        qrBoxX + qrPadding,
        qrBoxY + qrPadding,
        qrBoxSize - qrPadding * 2,
        qrBoxSize - qrPadding * 2
      );

      // 5. Short URL & Salon ID Highlight (Comfortable space below QR code)
      const idBadgeWidth = 660;
      const idBadgeHeight = 90;
      const idBadgeY = 1410;
      ctx.fillStyle = "#0F172A"; // Dark slate pill
      ctx.beginPath();
      drawRoundRect(ctx, (width - idBadgeWidth) / 2, idBadgeY, idBadgeWidth, idBadgeHeight, 45);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText(lang === "bn" ? `সেলুন কোড / ID: #${salon?.code || "1001"}` : `Salon ID: #${salon?.code || "1001"}`, width / 2, idBadgeY + 45);

      // Direct domain link in golden amber: amarsalon.xyz
      ctx.fillStyle = "#FDE047";
      ctx.font = "bold 64px monospace";
      ctx.fillText(`amarsalon.xyz/${salon?.code || salon?.slug || ""}`, width / 2, idBadgeY + 140);

      // 6. 3 Steps Box (Increased font size, placed lower from current position, compact white space)
      const stepBoxY = 1665;
      const stepBoxWidth = width - 150;
      const stepBoxHeight = 440;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      drawRoundRect(ctx, 75, stepBoxY, stepBoxWidth, stepBoxHeight, 32);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 50px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText("সহজ ৩ ধাপে সিরিয়াল নেওয়ার নিয়ম:", 135, stepBoxY + 65);

      const salonCode = salon?.code || "1001";
      const steps = [
        `১. ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন (বা amarsalon.xyz/${salonCode} এ যান)`,
        "২. 'প্রিয় সেলুন' (My Salons)-এ যুক্ত করুন দ্রুত সিরিয়াল পাওয়ার জন্য",
        "৩. ঘরে বসেই চেয়ার খালি আছে কিনা দেখুন ও সিরিয়াল নিন",
      ];

      steps.forEach((st, idx) => {
        const lineY = stepBoxY + 155 + idx * 110;
        // Step number circle (radius 28px)
        ctx.fillStyle = "#0D9488";
        ctx.beginPath();
        ctx.arc(160, lineY - 14, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(idx + 1), 160, lineY - 4);

        // Step text: Significantly increased font size to 44px bold Bengali typography
        ctx.textAlign = "left";
        ctx.fillStyle = "#1E293B";
        ctx.font = "600 44px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
        ctx.fillText(st.slice(3), 205, lineY);
      });

      // 7. Footer: All footer text at the absolute bottom-most position without any below spaces
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
      ctx.fillText("AmarSalon • আমার সেলুন", width / 2 - 225, brandY + 8);

      // App Download Message (Increased font size & golden amber)
      ctx.textAlign = "center";
      ctx.fillStyle = "#FDE047";
      ctx.font = "bold 50px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText("📱 সহজ ও দ্রুত সিরিয়ালের জন্য আমাদের অ্যাপটি ইন্সটল করুন", width / 2, 2395);

      // Official URL: Resting right at the bottom edge above the border line (zero space below)
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 60px monospace";
      ctx.fillText("amarsalon.xyz", width / 2, 2478);

      // Full Binary Blob download (prevents URL truncation on large images)
      const filename = `amarsalon-poster-${salon?.code || salon?.slug || "salon"}.png`;

      await new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Canvas blob generation failed"));
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = filename;
          link.href = blobUrl;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();

          // Retain blob URL for 60 seconds so browser download manager finishes completely
          setTimeout(() => {
            try {
              document.body.removeChild(link);
              URL.revokeObjectURL(blobUrl);
            } catch (e) { }
          }, 60000);
          resolve();
        }, "image/png");
      });
    } catch (err) {
      console.error("Poster generation failed:", err);
      alert(lang === "bn" ? "পোস্টার ডাউনলোড করতে সমস্যা হয়েছে।" : "Failed to generate poster.");
    } finally {
      setDownloadingPoster(false);
    }
  };

  const handlePrint = () => {
    triggerHaptic(25);
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share && qrTargetUrl) {
      try {
        await navigator.share({
          title: salon?.nameBn || "AmarSaloon",
          text: "আমার সেলুনে ঘরে বসেই সিরিয়াল নিন বা লাইভ চেয়ারের অবস্থা দেখুন:",
          url: qrTargetUrl,
        });
      } catch (e) { }
    } else {
      navigator.clipboard.writeText(qrTargetUrl);
      alert(lang === "bn" ? "লিংক কপি করা হয়েছে!" : "Link copied to clipboard!");
    }
  };

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold border border-slate-200 no-print">
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "qr" ? "bg-white text-teal-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR পোস্টার</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "profile" ? "bg-white text-teal-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>প্রোফাইল সেটিংস</span>
          </button>

          <button
            onClick={() => setActiveTab("sub")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "sub" ? "bg-white text-purple-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>সাবস্ক্রিপশন</span>
          </button>
        </div>

        {/* TAB 1: A4 PRINTABLE QR POSTER ENGINE */}
        {activeTab === "qr" && (
          <div className="space-y-4">
            <div className="no-print">
              <h2 className="text-base font-bold text-slate-900">{t.qrPosterTitle}</h2>
              <p className="text-xs text-slate-500">{t.qrPosterSub}</p>
            </div>

            {/* Printable Standard Poster Container (Always fully visible & scrollable) */}
            <div className="w-full max-w-[440px] mx-auto overflow-visible">
              <div className="bg-[#0D9488] text-white rounded-3xl p-4 sm:p-5 border-2 border-white/40 shadow-xl text-center a4-page relative flex flex-col justify-between gap-2.5">
                {/* Top Header */}
                <div className="border-b border-white/20 pb-2.5 text-center">
                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                      অনলাইনে সিরিয়াল দিতে স্ক্যান করুন
                    </h1>
                      <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-wider uppercase mt-1">
                        SCAN WITH PHONE CAMERA TO BOOK ONLINE
                      </p>
                    </div>

                    {/* Central Hero QR Code Zone (With generous breathing space top & bottom) */}
                    <div className="my-3.5 sm:my-4 flex flex-col items-center">
                      <div className="inline-block p-3.5 sm:p-4 bg-white rounded-3xl shadow-md">
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt="Salon QR Code"
                            className="w-56 h-56 sm:w-64 sm:h-64 mx-auto object-contain"
                          />
                        ) : (
                          <div className="w-56 h-56 sm:w-64 sm:h-64 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                            QR কোড তৈরি হচ্ছে...
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-center space-y-1.5">
                        {salon?.code && (
                          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs sm:text-sm shadow-xs">
                            <span>{lang === "bn" ? "সেলুন কোড / ID" : "Salon ID"}:</span>
                            <span className="text-amber-300">#{salon.code}</span>
                          </div>
                        )}
                        <p className="text-lg sm:text-xl font-mono font-black text-amber-300 drop-shadow-xs">
                          amarsalon.xyz/{salon?.code || salon?.slug || ""}
                        </p>
                      </div>
                    </div>

                    {/* 3 Steps Visual Guide (Increased font size, placed lower, compact white space) */}
                    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-teal-100 text-left space-y-2 text-slate-800 shadow-sm mt-3.5 mb-2">
                      <p className="font-black text-slate-900 text-sm sm:text-base mb-1">
                        সহজ ৩ ধাপে সিরিয়াল নেওয়ার নিয়ম:
                      </p>
                      <p className="text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-black text-xs shrink-0">১</span>
                        <span>ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন (বা amarsalon.xyz/{salon?.code || "1001"} এ যান)</span>
                      </p>
                      <p className="text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-black text-xs shrink-0">২</span>
                        <span>&apos;প্রিয় সেলুন&apos; (My Salons)-এ যুক্ত করুন দ্রুত সিরিয়াল পাওয়ার জন্য</span>
                      </p>
                      <p className="text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-black text-xs shrink-0">৩</span>
                        <span>ঘরে বসেই চেয়ার খালি আছে কিনা দেখুন ও সিরিয়াল নিন</span>
                      </p>
                    </div>

                      {/* Footer Band with AmarSalon Branding, Icon & App Download Notice (At bottom-most position, zero below spaces) */}
                      <div className="mt-auto pt-2.5 border-t border-white/20 text-center space-y-1.5 pb-0 mb-0">
                        <div className="inline-flex items-center justify-center gap-2">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-300 text-teal-950 flex items-center justify-center shadow-xs">
                            <Scissors className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                          </div>
                          <p className="font-black text-xl sm:text-2xl text-white tracking-wide">
                            AmarSalon <span className="text-amber-300 font-bold">•</span> আমার সেলুন
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-300 font-bold leading-tight">
                          📱 সহজ ও দ্রুত সিরিয়ালের জন্য আমাদের অ্যাপটি ইন্সটল করুন
                        </p>
                        <p className="text-sm sm:text-base font-mono font-black text-white/90 leading-none pb-0 mb-0">
                          amarsalon.xyz
                        </p>
                      </div>
                    </div>
                </div>

                {/* Download Poster & Action Buttons */}
                <div className="space-y-2.5 no-print">
                  <button
                    type="button"
                    onClick={handleDownloadPoster}
                    disabled={downloadingPoster || !qrDataUrl}
                    className="w-full flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#0D9488] hover:bg-[#115E59] active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-teal-900/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-5 h-5 shrink-0" />
                    <span>
                      {downloadingPoster
                        ? t.downloadingPoster
                        : lang === "bn"
                          ? "পোস্টার ডাউনলোড করুন"
                          : "Download Poster"}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-800 font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-teal-700" />
                      <span>{t.printPoster}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-800 font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-teal-700" />
                      <span>{t.sharePoster}</span>
                    </button>
                  </div>
                </div>
              </div>
        )}

              {/* TAB 2: PROFILE SETTINGS */}
              {activeTab === "profile" && (
                <form onSubmit={handleUpdateProfile} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
                  <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    {lang === "bn" ? "সেলুনের তথ্য সম্পাদনা" : "Salon Profile Settings"}
                  </h2>

                  {profileMsg && (
                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs">
                      {profileMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === "bn" ? "সেলুনের নাম (বাংলা)" : "Salon Name (Bangla)"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameBn}
                      onChange={(e) => setNameBn(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === "bn" ? "সেলুনের নাম (English)" : "Salon Name (English)"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.address} *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.phone} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.chairs}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={totalChairs}
                        onChange={(e) => setTotalChairs(Number(e.target.value))}
                        className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === "bn" ? "ক্যাটাগরি" : "Category"}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                      >
                        <option value="GENTS">{t.gents}</option>
                        <option value="LADIES">{t.ladies}</option>
                        <option value="UNISEX">{t.unisex}</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="acCheckbox"
                        checked={isAc}
                        onChange={(e) => setIsAc(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <label htmlFor="acCheckbox" className="text-xs font-semibold text-slate-700">
                        {lang === "bn" ? "এসি (AC) সুবিধা আছে" : "Air Conditioned"}
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-[#0D9488] hover:bg-[#115E59] text-white shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{updatingProfile ? t.loading : t.save}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: SUBSCRIPTIONS & MONETIZATION */}
              {activeTab === "sub" && (
                <div className="space-y-4">
                  {/* Status Card */}
                  <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-5 rounded-3xl shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                        {t.subscriptionStatus}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${subStatus?.status === "ACTIVE"
                          ? "bg-emerald-400 text-slate-950"
                          : subStatus?.status === "TRIAL"
                            ? "bg-amber-400 text-slate-950"
                            : "bg-rose-500 text-white"
                          }`}
                      >
                        {subStatus?.status}
                      </span>
                    </div>

                    <div className="my-2">
                      {subStatus?.status === "TRIAL" ? (
                        <div>
                          <p className="text-xl font-black text-amber-300">
                            {subStatus?.trialDaysLeft} {t.trialDaysLeft}
                          </p>
                          <p className="text-xs text-purple-200 mt-0.5">
                            {lang === "bn"
                              ? "ফ্রি ট্রায়াল শেষ হওয়ার পর সেবা সচল রাখতে সাবস্ক্রিপশন নিন।"
                              : "Renew subscription to keep your salon active after trial."}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-purple-200">
                            {lang === "bn" ? "মেয়াদ উত্তীর্ণের তারিখ:" : "Valid Until:"}
                          </p>
                          <p className="text-lg font-mono font-bold text-emerald-300">
                            {subStatus?.subscriptionEndsAt
                              ? new Date(subStatus.subscriptionEndsAt).toISOString().split("T")[0]
                              : "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Options Selector */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan("MONTHLY")}
                      className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${selectedPlan === "MONTHLY"
                        ? "bg-teal-50 border-teal-600 shadow-xs ring-1 ring-teal-600/30"
                        : "bg-white border-slate-200"
                        }`}
                    >
                      <p className="font-bold text-xs text-slate-900">মাসিক প্যাকেজ</p>
                      <p className="text-base font-black text-teal-800 font-mono mt-1">৳৪৯৯</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">৩০ দিন আনলিমিটেড</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan("YEARLY")}
                      className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer relative ${selectedPlan === "YEARLY"
                        ? "bg-purple-50 border-purple-600 shadow-xs ring-1 ring-purple-600/30"
                        : "bg-white border-slate-200"
                        }`}
                    >
                      <span className="absolute top-2 right-2 text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md">
                        ১৫% ছাড়
                      </span>
                      <p className="font-bold text-xs text-slate-900">বার্ষিক প্যাকেজ</p>
                      <p className="text-base font-black text-purple-900 font-mono mt-1">৳৪,৯৯৯</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">৩৬৫ দিন সাশ্রয়ী</p>
                    </button>
                  </div>

                  {/* Payment Method & Submission */}
                  <form onSubmit={handleSubmitPayment} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {lang === "bn" ? "পেমেন্ট মাধ্যম বেছে নিন" : "Payment Method"}
                    </h3>

                    {paymentMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                        {paymentMsg}
                      </div>
                    )}
                    {paymentError && (
                      <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
                        {paymentError}
                      </div>
                    )}

                    {/* Methods */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-bold">
                      {(["BKASH", "NAGAD", "ROCKET", "BANK"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-2 px-1 rounded-xl border transition cursor-pointer text-[11px] ${paymentMethod === m
                            ? "bg-teal-50 border-teal-600 text-teal-900 font-extrabold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {/* Instructions */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                      <p className="font-semibold text-slate-900">{t.mfsInstructions}</p>
                      <p className="font-mono font-bold text-teal-800 text-sm">
                        01700000000 (মার্চেন্ট / পারসোনাল)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        টাকা পাঠানোর পর প্রাপ্ত Transaction ID (TrxID) নিচে লিখে জমা দিন।
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.senderPhone}
                      </label>
                      <input
                        type="tel"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন"
                        className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.trxIdLabel} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        placeholder="যেমন: BKASH9928371X"
                        className="w-full text-sm font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPayment}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-purple-700 hover:bg-purple-800 text-white shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {submittingPayment ? t.loading : t.submit}
                    </button>
                  </form>
                </div >
              )
              }
            </div >
          </AppShell >
        );
}

        export default function OwnerProfilePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">লোড হচ্ছে...</div>}>
          <OwnerProfileContent />
        </Suspense>
        );
}
