"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Save,
  Clock,
  Camera,
  Trash2,
  RefreshCw,
  Smartphone,
  ChevronDown,
} from "lucide-react";
import { Suspense } from "react";

function OwnerProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "qr";
  const { lang, t, user, activeSalonId, setActiveSalonId, triggerHaptic } = useApp();

  const [activeTab, setActiveTab] = useState(initialTab === "new" ? "qr" : initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "new") {
      router.replace("/owner/new-salon");
    } else if (tabParam && ["qr", "profile", "sub"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, router]);

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
  const [acceptsDigitalPayment, setAcceptsDigitalPayment] = useState(false);
  const [totalChairs, setTotalChairs] = useState(3);
  const [coverImage, setCoverImage] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscription State
  const [subStatus, setSubStatus] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState<"BKASH" | "NAGAD" | "ROCKET" | "BANK">("BKASH");
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
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
        setAcceptsDigitalPayment(Boolean(qrData.salon.acceptsDigitalPayment));
        setTotalChairs(qrData.salon.totalChairs || 3);
        setCoverImage(qrData.salon.coverImage || "");
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
          setAcceptsDigitalPayment(Boolean(found.acceptsDigitalPayment));
          setTotalChairs(found.totalChairs || 3);
          setCoverImage(found.coverImage || "");
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
    if (!salon?.id) return;
    setUpdatingProfile(true);
    setProfileMsg("");
    triggerHaptic(40);

    try {
      const res = await fetch(`/api/v1/owner/saloons`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saloonId: salon.id,
          nameBn,
          nameEn,
          address,
          phone,
          category,
          isAc,
          acceptsDigitalPayment,
          totalChairs,
          coverImage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg(t.success);
        fetchSalonAndQr();
      } else {
        setProfileMsg(data.error || "Update failed");
      }
    } catch (err: any) {
      setProfileMsg("Error updating profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Image Upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert(lang === "bn" ? "ছবির সাইজ ১২ মেগাবাইটের কম হতে হবে।" : "Image must be under 12MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingCover(true);
    triggerHaptic(30);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const maxW = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

          const res = await fetch("/api/v1/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl, folder: "salons" }),
          });
          const data = await res.json();
          if (data.url) {
            setCoverImage(data.url);
          }
          setUploadingCover(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Cover upload failed", err);
      setUploadingCover(false);
    }
  };

  // Submit Subscription Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "BANK") {
      if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
        setPaymentError(
          lang === "bn"
            ? "ব্যাংকের নাম, অ্যাকাউন্টের নাম এবং অ্যাকাউন্ট নম্বর আবশ্যক।"
            : "Bank name, account name, and account number are required."
        );
        return;
      }
    } else {
      if (!trxId.trim()) {
        setPaymentError(
          lang === "bn"
            ? "Transaction ID (TrxID) প্রদান করুন।"
            : "Transaction ID (TrxID) is required."
        );
        return;
      }
    }

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
          senderNumber: paymentMethod === "BANK" ? accountNumber.trim() : senderNumber.trim(),
          trxId: trxId.trim() || null,
          bankName: bankName.trim(),
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentMsg(data.message || t.success);
        setTrxId("");
        setSenderNumber("");
        setBankName("");
        setAccountName("");
        setAccountNumber("");
        fetchSalonAndQr();
      } else {
        setPaymentError(data.error || "Payment submission failed");
      }
    } catch (err) {
      setPaymentError("Network error. Please try again.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Helper function to draw rounded rectangle on canvas
  const drawRoundRect = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  };

  // Helper to draw scissors icon in center of QR
  const drawScissorsIcon = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    c.save();
    c.fillStyle = "#0D9488";
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = "#FFFFFF";
    c.lineWidth = Math.max(3, r * 0.12);
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
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.stroke();

      // 3. Top Brand Pill: "AmarSalon.com"
      const pillW = 440;
      const pillH = 72;
      const pillX = (width - pillW) / 2;
      const pillY = 110;
      drawRoundRect(ctx, pillX, pillY, pillW, pillH, 36);
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 32px 'Hind Siliguri', 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AmarSalon.com", width / 2, pillY + pillH / 2);

      // 4. Bengali Headline: "সিরিয়ালের ঝামেলা শেষ"
      ctx.font = "900 68px 'Hind Siliguri', sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("সিরিয়ালের ঝামেলা শেষ!", width / 2, 280);

      // 5. English Subtitle: "Scan & Reserve Your Salon Seat"
      ctx.font = "bold 32px 'Inter', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
      ctx.fillText("Scan & Reserve Your Salon Seat", width / 2, 345);

      // 6. Central White QR Card with shadow
      const cardW = 1250;
      const cardH = 1420;
      const cardX = (width - cardW) / 2;
      const cardY = 410;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      ctx.shadowBlur = 45;
      ctx.shadowOffsetY = 22;
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, 56);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.restore();

      // Card Header: Salon Name (Bengali & English)
      const displayName = salon?.nameBn || salon?.nameEn || (lang === "bn" ? "আমাদের সেলুন" : "Our Salon");
      ctx.font = "bold 64px 'Hind Siliguri', sans-serif";
      ctx.fillStyle = "#111827";
      ctx.fillText(displayName, width / 2, cardY + 115);

      if (salon?.nameEn && salon?.nameBn) {
        ctx.font = "500 32px 'Inter', sans-serif";
        ctx.fillStyle = "#6B7280";
        ctx.fillText(salon.nameEn, width / 2, cardY + 175);
      }

      // Draw QR Code Image
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      const qrSize = 780;
      const qrX = (width - qrSize) / 2;
      const qrY = cardY + 230;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Center Scissors Accent in QR Code
      drawScissorsIcon(ctx, width / 2, qrY + qrSize / 2, 54);

      // Instruction Box inside Card
      const instBoxW = cardW - 120;
      const instBoxH = 150;
      const instBoxX = (width - instBoxW) / 2;
      const instBoxY = cardY + 1070;

      drawRoundRect(ctx, instBoxX, instBoxY, instBoxW, instBoxH, 28);
      ctx.fillStyle = "#F8FAFC";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#E2E8F0";
      ctx.stroke();

      ctx.font = "bold 34px 'Hind Siliguri', sans-serif";
      ctx.fillStyle = "#0F766E";
      ctx.fillText("মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন", width / 2, instBoxY + 54);

      ctx.font = "500 24px 'Hind Siliguri', sans-serif";
      ctx.fillStyle = "#64748B";
      ctx.fillText("কোনো অ্যাপ নামানো লাগবে না • সরাসরি ব্রাউজারে খুলবে", width / 2, instBoxY + 104);

      // Salon Code Badge
      const salonCode = salon?.customCode || salon?.code || (salon?.id ? salon.id.slice(0, 6).toUpperCase() : "1051");
      const badgeW = 420;
      const badgeH = 80;
      const badgeX = (width - badgeW) / 2;
      const badgeY = cardY + cardH - 110;

      drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 40);
      ctx.fillStyle = "#F0FDFA";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#99F6E4";
      ctx.stroke();

      ctx.font = "bold 30px 'Inter', sans-serif";
      ctx.fillStyle = "#0F766E";
      ctx.fillText(`SALON CODE: ${salonCode}`, width / 2, badgeY + badgeH / 2);

      // 7. 3-Step Guide Below Card
      const stepY = cardY + cardH + 70;
      const steps = [
        { num: "১", title: "স্ক্যান করুন", sub: "ক্যামেরা ওপেন করে" },
        { num: "২", title: "টোকেন নিন", sub: "নাম ও সেবা বেছে" },
        { num: "৩", title: "সিরিয়াল ট্র্যাক", sub: "লাইভ নোটিফিকেশন" },
      ];

      const stepSpacing = width / 3;
      steps.forEach((st, idx) => {
        const stepCenterX = stepSpacing * idx + stepSpacing / 2;

        ctx.beginPath();
        ctx.arc(stepCenterX, stepY, 36, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.stroke();

        ctx.font = "bold 32px 'Hind Siliguri', sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(st.num, stepCenterX, stepY + 2);

        ctx.font = "bold 28px 'Hind Siliguri', sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(st.title, stepCenterX, stepY + 70);

        ctx.font = "normal 22px 'Hind Siliguri', sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
        ctx.fillText(st.sub, stepCenterX, stepY + 104);
      });

      // 8. Footer Bar: Help info & Website URL
      const footerY = height - 120;
      ctx.font = "bold 30px 'Inter', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillText("www.amarsalon.com", width / 2, footerY);

      ctx.font = "normal 22px 'Hind Siliguri', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText("স্মার্ট সেলুন ম্যানেজমেন্ট প্ল্যাটফর্ম", width / 2, footerY + 40);

      // Download triggered via blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanName = (salon?.nameEn || salon?.nameBn || "amarsalon").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        a.download = `${cleanName}-poster.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error("Poster generation error:", err);
      alert(lang === "bn" ? "পোস্টার জেনারেট করতে সমস্যা হয়েছে।" : "Failed to generate poster.");
    } finally {
      setDownloadingPoster(false);
    }
  };

  const handleShareLink = () => {
    if (!qrTargetUrl) return;
    if (navigator.share) {
      try {
        navigator.share({
          title: salon?.nameBn || salon?.nameEn || "AmarSalon",
          text: `${salon?.nameBn || salon?.nameEn || (lang === "bn" ? "আমাদের সেলুন" : "Our Salon")} এ সিরিয়াল দিন:`,
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
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center text-xs font-bold border border-slate-200 dark:border-slate-700 no-print">
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "qr"
              ? "bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR পোস্টার</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "profile"
              ? "bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>প্রোফাইল সেটিংস</span>
          </button>

          <button
            onClick={() => setActiveTab("sub")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "sub"
              ? "bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>সাবস্ক্রিপশন</span>
          </button>
        </div>

        {/* TAB 1: QR POSTER */}
        {activeTab === "qr" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs text-center">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                {salon?.nameBn || salon?.nameEn || (lang === "bn" ? "আমাদের সেলুন" : "Our Salon")} - QR কোড
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                গ্রাহকরা এই QR স্ক্যান করে সরাসরি সিরিয়াল বুক করতে পারবেন
              </p>

              {loading ? (
                <div className="w-48 h-48 mx-auto bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center animate-pulse">
                  <span className="text-xs text-slate-400">{t.loading}</span>
                </div>
              ) : qrDataUrl ? (
                <div className="inline-block p-4 bg-white rounded-3xl border-2 border-teal-500/30 shadow-md">
                  <img
                    src={qrDataUrl}
                    alt="Salon QR Code"
                    className="w-52 h-52 object-contain rounded-xl"
                  />
                  <div className="mt-3 flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-teal-800 bg-teal-50 py-1 px-3 rounded-full">
                    <span>কোড: {salon?.customCode || salon?.code || (salon?.id ? salon.id.slice(0, 6).toUpperCase() : "1051")}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-rose-500">QR কোড লোড করা যায়নি</p>
              )}

              {/* Action Buttons */}
              <div className="mt-5 grid grid-cols-2 gap-2 max-w-xs mx-auto">
                <button
                  onClick={handleDownloadPoster}
                  disabled={downloadingPoster || !qrDataUrl}
                  className="w-full py-2.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingPoster ? "জেনারেট হচ্ছে..." : "পোস্টার ডাউনলোড"}</span>
                </button>

                <button
                  onClick={handleShareLink}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t.sharePoster}</span>
                </button>
              </div>

              {/* Target Link Preview */}
              {qrTargetUrl && (
                <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left text-xs max-w-sm mx-auto">
                  <span className="font-mono text-slate-600 dark:text-slate-300 truncate text-[11px] mr-2">
                    {qrTargetUrl}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(qrTargetUrl);
                      alert(lang === "bn" ? "লিংক কপি হয়েছে!" : "Link copied!");
                    }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-500 cursor-pointer"
                    title="Copy Link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Print & Display Instructions */}
            <div className="bg-teal-50/60 dark:bg-teal-950/20 p-4 rounded-3xl border border-teal-200/60 dark:border-teal-900/40 text-xs text-teal-900 dark:text-teal-200 space-y-1.5">
              <h4 className="font-bold flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-teal-700" />
                <span>প্রিন্ট ও প্রদর্শনের পরামর্শ</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                ডাউনলোড করা পোস্টারটি (Half-Letter 8.5" x 5.5") রঙিন প্রিন্ট করে সেলুনের প্রবেশদ্বারে বা ক্যাশ কাউন্টারে টাঙিয়ে রাখুন। গ্রাহকরা ক্যামেরা দিয়ে স্ক্যান করলেই সরাসরি সিরিয়াল কার্ড দেখতে পাবেন।
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE SETTINGS */}
        {activeTab === "profile" && (
          <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">
              {lang === "bn" ? "সেলুন সেটিংস" : "Salon Settings"}
            </h3>

            {profileMsg && (
              <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs border border-teal-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{profileMsg}</span>
              </div>
            )}

            {/* Cover Photo Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === "bn" ? "সেলুনের কভার ছবি" : "Salon Cover Photo"}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {coverImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                  <img
                    src={coverImage}
                    alt="Salon Cover Preview"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{lang === "bn" ? "পরিবর্তন" : "Change"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === "bn" ? "মুছুন" : "Remove"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-teal-300 dark:border-teal-700/60 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition flex flex-col items-center justify-center gap-2 cursor-pointer p-4 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      {lang === "bn" ? "সেলুনের ছবি আপলোড করুন" : "Upload Salon Photo"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === "bn" ? "ক্যামেরা দিয়ে তুলুন বা গ্যালারি থেকে বেছে নিন" : "Take a photo or choose from gallery"}
                    </p>
                  </div>
                </div>
              )}

              {uploadingCover && (
                <p className="text-xs text-teal-600 dark:text-teal-400 animate-pulse font-medium">
                  {lang === "bn" ? "ছবি আপলোড হচ্ছে..." : "Uploading cover image..."}
                </p>
              )}
            </div>

            {/* Name Bn */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === "bn" ? "সেলুনের নাম" : "Salon Name"} (বাংলা) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="যেমন: ইউনিক জেন্টস পার্লার"
                className="w-full text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
              />
            </div>

            {/* Name En */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === "bn" ? "সেলুনের নাম" : "Salon Name"} (English)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Unique Gents Parlour"
                className="w-full text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.phone} <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.address} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="যেমন: বাড়ি ১২, রোড ৪, ধানমন্ডি, ঢাকা"
                className="w-full text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.categoryLabel || (lang === "bn" ? "ক্যাটাগরি" : "Category")}
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none appearance-none cursor-pointer dark:text-white pr-8"
                >
                  <option value="GENTS">{t.gents}</option>
                  <option value="LADIES">{t.ladies}</option>
                  <option value="UNISEX">{t.unisex}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Total Chairs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === "bn" ? "মোট চেয়ার সংখ্যা" : "Total Chairs"}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={totalChairs}
                  onChange={(e) => setTotalChairs(Number(e.target.value))}
                  className="w-24 text-sm font-bold text-center bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
                />
                <span className="text-xs text-slate-500">টি চেয়ার প্রস্তুত রয়েছে</span>
              </div>
            </div>

            {/* AC / Non-AC & Digital Payment Options */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-600 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">
                    এয়ার কন্ডিশনড (AC) সেলুন
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    সেলুনে এসি সুবিধা থাকলে এটি চালু রাখুন
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isAc}
                  onChange={(e) => setIsAc(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800/40 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200 block">
                      {lang === "bn" ? "ডিজিটাল পেমেন্ট গ্রহণ করা হয়" : "Digital Payment Accepted"}
                    </span>
                    <span className="text-[10px] text-teal-700 dark:text-teal-300">
                      {lang === "bn" ? "বিকাশ, নগদ বা কার্ড পেমেন্ট সুবিধা" : "bKash, Nagad or Card payments available"}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={acceptsDigitalPayment}
                  onChange={(e) => setAcceptsDigitalPayment(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-3 rounded-xl font-bold text-sm bg-teal-700 hover:bg-teal-800 text-white shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updatingProfile ? t.loading : t.save}</span>
            </button>
          </form>
        )}

        {/* TAB 3: SUBSCRIPTION */}
        {activeTab === "sub" && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {t.subscriptionStatus}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {subStatus?.status === "ACTIVE" ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>সক্রিয় (Active)</span>
                      </span>
                    ) : subStatus?.status === "PENDING" ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>অনুমোদনের অপেক্ষায় (Pending Verification)</span>
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>মেয়াদোত্তীর্ণ (Expired / Inactive)</span>
                      </span>
                    )}
                  </h3>
                </div>

                {subStatus?.daysRemaining !== undefined && (
                  <div className="text-right">
                    <span className="text-xl font-black text-teal-800 dark:text-teal-300">
                      {subStatus.daysRemaining}
                    </span>
                    <span className="text-[11px] text-slate-500 block">দিন বাকি</span>
                  </div>
                )}
              </div>

              {subStatus?.expiresAt && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  মেয়াদ শেষ: {new Date(subStatus.expiresAt).toLocaleDateString("bn-BD")}
                </p>
              )}
            </div>

            {/* Plan Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan("MONTHLY")}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer relative ${selectedPlan === "MONTHLY"
                  ? "bg-teal-50/70 border-teal-600 shadow-xs"
                  : "bg-white border-slate-200/80 hover:bg-slate-50"
                  }`}
              >
                <span className="text-xs font-bold text-slate-700 block">মাসিক প্ল্যান</span>
                <p className="text-lg font-black text-teal-900 mt-1">৳৯৯</p>
                <p className="text-[10px] text-slate-400 mt-0.5">প্রতি মাস (৩০ দিন)</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("YEARLY")}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer relative ${selectedPlan === "YEARLY"
                  ? "bg-teal-50/70 border-teal-600 shadow-xs"
                  : "bg-white border-slate-200/80 hover:bg-slate-50"
                  }`}
              >
                <div className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  ১৫% ছাড়
                </div>
                <span className="text-xs font-bold text-slate-700 block">বার্ষিক প্ল্যান</span>
                <p className="text-lg font-black text-teal-900 mt-1">৳১,০১০</p>
                <p className="text-[10px] text-slate-400 mt-0.5">৩৬৫ দিন সাশ্রয়ী</p>
              </button>
            </div>

            {/* Payment Method & Submission */}
            <form onSubmit={handleSubmitPayment} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
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
                    onClick={() => {
                      setPaymentMethod(m);
                      setPaymentError("");
                    }}
                    className={`py-2 px-1 rounded-xl border transition cursor-pointer text-[11px] ${paymentMethod === m
                      ? "bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-900 dark:text-teal-200 font-extrabold"
                      : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Instructions */}
              {paymentMethod === "BANK" ? (
                <div className="bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                  <p className="font-semibold text-slate-900 dark:text-white">ব্যাংক ডিপোজিট / ট্রান্সফার নির্দেশিকা:</p>
                  <div className="font-mono text-[11px] space-y-0.5 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    <p><span className="text-slate-400">ব্যাংক:</span> Dutch Bangla Bank / BRAC Bank</p>
                    <p><span className="text-slate-400">হিসাবের নাম:</span> AmarSalon Technologies Ltd</p>
                    <p><span className="text-slate-400">হিসাব নম্বর:</span> 151.120.482910</p>
                    <p><span className="text-slate-400">শাখা / রাউটিং:</span> Dhanmondi Branch (090271829)</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ব্যাংক ট্রান্সফারের পর নিচে ব্যাংকের নাম, অ্যাকাউন্টের নাম ও নম্বর প্রদান করুন।
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{t.mfsInstructions}</p>
                  <p className="font-mono font-bold text-teal-800 dark:text-teal-300 text-sm">
                    01700000000 (মার্চেন্ট / পারসোনাল)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    টাকা পাঠানোর পর প্রাপ্ত Transaction ID (TrxID) নিচে লিখে জমা দিন।
                  </p>
                </div>
              )}

              {/* Conditional Bank Fields */}
              {paymentMethod === "BANK" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === "bn" ? "ব্যাংকের নাম" : "Bank Name"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="যেমন: Dutch Bangla Bank / City Bank"
                      className="w-full text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === "bn" ? "অ্যাকাউন্টের নাম" : "Account Name"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="যেমন: Rahim Uddin / Salon Name"
                      className="w-full text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === "bn" ? "অ্যাকাউন্ট নম্বর" : "Account Number"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="যে অ্যাকাউন্ট থেকে টাকা পাঠিয়েছেন"
                      className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Transaction ID / ডিপোজিট স্লিপ রেফারেন্স (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="যদি থাকে (যেমন: TXN18293)"
                      className="w-full text-sm font-mono uppercase bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.senderPhone}
                    </label>
                    <input
                      type="tel"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন"
                      className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.trxIdLabel} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="যেমন: BKASH9928371X"
                      className="w-full text-sm font-mono font-bold uppercase bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submittingPayment}
                className="w-full py-3 rounded-xl font-bold text-sm bg-teal-700 hover:bg-teal-800 text-white shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {submittingPayment ? t.loading : t.submit}
              </button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function OwnerProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">লোড হচ্ছে...</div>}>
      <OwnerProfileContent />
    </Suspense>
  );
}
