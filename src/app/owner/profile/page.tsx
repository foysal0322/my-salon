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
  Scissors,
  MapPin,
  Navigation,
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

  // GPS Coordinates State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");

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
        setLatitude(qrData.salon.latitude ?? null);
        setLongitude(qrData.salon.longitude ?? null);
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
          setLatitude(found.latitude ?? null);
          setLongitude(found.longitude ?? null);
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

  // Geolocation Handler
  const handleGetCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert(lang === "bn" ? "আপনার ব্রাউজার বা ডিভাইসে GPS সাপোর্ট করে না।" : "Geolocation is not supported on this device.");
      return;
    }
    setLocatingGps(true);
    setGpsSuccessMsg("");
    triggerHaptic(30);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setLocatingGps(false);
        setGpsSuccessMsg(
          lang === "bn"
            ? `সফলভাবে লোকেশন পাওয়া গেছে (${lat}, ${lng})!`
            : `GPS location detected (${lat}, ${lng})!`
        );
        triggerHaptic(50);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocatingGps(false);
        alert(
          lang === "bn"
            ? "GPS লোকেশন পাওয়া যায়নি। ফোনের Location/GPS চালু আছে এবং ব্রাউজারে লোকেশন পারমিশন দেওয়া আছে কিনা চেক করুন।"
            : "Could not retrieve GPS location. Please ensure location is enabled and permission is granted."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon?.id) return;
    setUpdatingProfile(true);
    setProfileMsg("");
    triggerHaptic(40);

    try {
      const res = await fetch(`/api/v1/owner/saloons`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: salon.id,
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
          latitude,
          longitude,
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
          const maxH = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxW || h > maxH) {
            const ratio = Math.min(maxW / w, maxH / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, w, h);
          }
          const dataUrl = canvas.toDataURL("image/webp", 0.85);

          const res = await fetch("/api/v1/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl, image: dataUrl, folder: "salons" }),
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

  // Helper to draw scissors logo on canvas
  const drawSalonLogo = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    c.save();
    // Circular badge
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = "#FDE047"; // Golden Amber
    c.fill();
    c.lineWidth = 3.5;
    c.strokeStyle = "#FFFFFF";
    c.stroke();

    // Stylized Scissors Icon inside badge
    c.strokeStyle = "#0F172A"; // Dark slate
    c.fillStyle = "#0F172A";
    c.lineWidth = 4;
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
    c.arc(x, y - r * 0.05, 4, 0, Math.PI * 2);
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
      // Standard print poster size (12" x 18" standard commercial print ratio 2:3) in crisp 1200 x 1800 px
      const width = 1200;
      const height = 1800;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context");

      // 1. Poster Background: #0D9488
      ctx.fillStyle = "#0D9488";
      ctx.fillRect(0, 0, width, height);

      // 2. Poster border line with rounded corners (44px radius)
      ctx.beginPath();
      drawRoundRect(ctx, 40, 40, width - 80, height - 80, 44);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // 3. Top Heading: Large bold heading
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 66px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("অনলাইনে সিরিয়াল দিতে স্ক্যান করুন", width / 2, 135);

      ctx.fillStyle = "#FDE047"; // Golden Amber
      ctx.font = "bold 30px sans-serif";
      ctx.fillText("SCAN WITH PHONE CAMERA TO BOOK ONLINE", width / 2, 205);

      // 4. Central QR Code Box (Crisp white box with rounded corners for scanning contrast)
      const qrBoxSize = 580;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 260;

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
      ctx.fill();
      ctx.lineWidth = 2.5;
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

      // 5. Short URL & Salon ID Highlight (Bigger fonts)
      const idBadgeWidth = 460;
      const idBadgeY = qrBoxY + qrBoxSize + 35;
      ctx.fillStyle = "#0F172A"; // Dark slate pill
      ctx.beginPath();
      drawRoundRect(ctx, (width - idBadgeWidth) / 2, idBadgeY, idBadgeWidth, 70, 35);
      ctx.fill();

      const salonCode = salon?.customCode || salon?.code || (salon?.id ? salon.id.slice(0, 6).toUpperCase() : "1051");
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(`সেলুন কোড / ID: #${salonCode}`, width / 2, idBadgeY + 35);

      // Direct domain link in golden amber: amarsalon.xyz
      ctx.fillStyle = "#FDE047";
      ctx.font = "bold 44px monospace";
      ctx.fillText(`amarsalon.xyz/${salonCode}`, width / 2, idBadgeY + 120);

      // 6. 3 Steps Box (Increased font size & expanded container)
      const stepBoxY = idBadgeY + 175;
      const stepBoxWidth = width - 140;
      const stepBoxHeight = 360;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      drawRoundRect(ctx, 70, stepBoxY, stepBoxWidth, stepBoxHeight, 28);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 34px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText("সহজ ৩ ধাপে সিরিয়াল নেওয়ার নিয়ম:", 120, stepBoxY + 54);

      const steps = [
        `১. ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন (বা amarsalon.xyz/${salonCode} এ যান)`,
        "২. 'প্রিয় সেলুন' (My Saloons)-এ যুক্ত করুন দ্রুত সিরিয়াল পাওয়ার জন্য",
        "৩. ঘরে বসেই চেয়ার খালি আছে কিনা দেখুন ও সিরিয়াল নিন",
      ];

      steps.forEach((st, idx) => {
        const lineY = stepBoxY + 122 + idx * 75;
        // Step number circle (larger radius 22px)
        ctx.fillStyle = "#0D9488";
        ctx.beginPath();
        ctx.arc(142, lineY - 10, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(idx + 1), 142, lineY - 3);

        // Step text: Increased to 30px bold Bengali typography
        ctx.textAlign = "left";
        ctx.fillStyle = "#1E293B";
        ctx.font = "600 30px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
        ctx.fillText(st.slice(3), 178, lineY);
      });

      // 7. Footer: Zero extra space, balanced bottom padding, AmarSalon branding, logo & app download message
      const footerDividerY = stepBoxY + stepBoxHeight + 40;
      ctx.beginPath();
      ctx.moveTo(70, footerDividerY);
      ctx.lineTo(width - 70, footerDividerY);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Salon Logo Emblem & Brand Text
      const brandY = footerDividerY + 65;
      drawSalonLogo(ctx, width / 2 - 240, brandY, 34);

      ctx.textAlign = "left";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 50px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText("AmarSalon • আমার সেলুন", width / 2 - 185, brandY + 6);

      // App Download Message
      ctx.textAlign = "center";
      ctx.fillStyle = "#FDE047";
      ctx.font = "bold 30px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText("📱 সহজ ও দ্রুত সিরিয়ালের জন্য আমাদের অ্যাপটি ইন্সটল করুন", width / 2, brandY + 76);

      // Official URL
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px monospace";
      ctx.fillText("amarsalon.xyz", width / 2, brandY + 130);

      // Full Binary Blob download (prevents URL truncation on large images)
      const filename = `amarsalon-poster-${salonCode}.png`;

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
          title: salon?.nameBn || salon?.nameEn || "AmarSalon",
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

        {/* TAB 1: PRINTABLE QR POSTER ENGINE */}
        {activeTab === "qr" && (
          <div className="space-y-4">
            <div className="no-print">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.qrPosterTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.qrPosterSub}</p>
            </div>

            {/* Printable Standard Poster Container (Signature Teal & Amber Design) */}
            <div className="bg-[#0D9488] text-white rounded-3xl p-6 border-2 border-white/40 shadow-xl text-center a4-page relative overflow-hidden flex flex-col justify-between">
              {/* Top Header */}
              <div className="border-b border-white/20 pb-4 mb-3 text-center">
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  অনলাইনে সিরিয়াল দিতে স্ক্যান করুন
                </h1>
                <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-wider uppercase mt-1">
                  SCAN WITH PHONE CAMERA TO BOOK ONLINE
                </p>
              </div>

              {/* Central Hero QR Code Zone */}
              <div className="my-3">
                <div className="inline-block p-4 bg-white rounded-2xl shadow-md">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Salon QR Code"
                      className="w-56 h-56 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      QR কোড তৈরি হচ্ছে...
                    </div>
                  )}
                </div>
                <div className="mt-3 text-center space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs shadow-xs">
                    <span>{lang === "bn" ? "সেলুন কোড / ID" : "Salon ID"}:</span>
                    <span className="text-amber-300">#{salon?.customCode || salon?.code || (salon?.id ? salon.id.slice(0, 6).toUpperCase() : "1051")}</span>
                  </div>
                  <p className="text-base sm:text-lg font-mono font-black text-amber-300 drop-shadow-xs">
                    amarsalon.xyz/{salon?.customCode || salon?.code || (salon?.id ? salon.id.slice(0, 6).toUpperCase() : "1051")}
                  </p>
                </div>
              </div>

              {/* 3 Steps Visual Guide */}
              <div className="bg-white rounded-2xl p-5 border border-teal-100 text-left my-3 space-y-3 text-slate-800 shadow-sm">
                <p className="font-extrabold text-slate-900 text-sm sm:text-base mb-1">
                  সহজ ৩ ধাপে সিরিয়াল নেওয়ার নিয়ম:
                </p>
                <p className="text-slate-800 font-medium text-xs sm:text-sm flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs shrink-0">১</span>
                  <span>ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন (বা amarsalon.xyz/{salon?.customCode || salon?.code || "1051"} এ যান)</span>
                </p>
                <p className="text-slate-800 font-medium text-xs sm:text-sm flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs shrink-0">২</span>
                  <span>&apos;প্রিয় সেলুন&apos; (My Saloons)-এ যুক্ত করুন দ্রুত সিরিয়াল পাওয়ার জন্য</span>
                </p>
                <p className="text-slate-800 font-medium text-xs sm:text-sm flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs shrink-0">৩</span>
                  <span>ঘরে বসেই চেয়ার খালি আছে কিনা দেখুন ও সিরিয়াল নিন</span>
                </p>
              </div>

              {/* Footer Band with AmarSalon Branding, Icon & App Download Notice */}
              <div className="pt-3 border-t border-white/20 text-center space-y-1.5">
                <div className="inline-flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-300 text-teal-950 flex items-center justify-center shadow-xs">
                    <Scissors className="w-4.5 h-4.5" />
                  </div>
                  <p className="font-black text-lg sm:text-xl text-white tracking-wide">
                    AmarSalon <span className="text-amber-300 font-bold">•</span> আমার সেলুন
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-amber-200 font-semibold">
                  📱 সহজ ও দ্রুত সিরিয়ালের জন্য আমাদের অ্যাপটি ইন্সটল করুন
                </p>
                <p className="text-xs font-mono font-bold text-white/90">
                  amarsalon.xyz
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 no-print">
              <button
                type="button"
                onClick={handleDownloadPoster}
                disabled={downloadingPoster || !qrDataUrl}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 active:scale-95 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-5 h-5 shrink-0" />
                <span>
                  {downloadingPoster
                    ? (lang === "bn" ? "পোস্টার তৈরি হচ্ছে..." : "Generating Poster...")
                    : (lang === "bn" ? "পোস্টার ডাউনলোড করুন" : "Download Poster")}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <span>{lang === "bn" ? "প্রিন্ট প্রিভিউ" : "Print Preview"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <span>{t.sharePoster}</span>
                </button>
              </div>
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

            {/* GPS Location Field & Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{lang === "bn" ? "GPS লোকেশন (অক্ষাংশ ও দ্রাঘিমাংশ)" : "GPS Location (Lat, Lng)"}</span>
                </label>
                {latitude && longitude && (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    ✓ {lang === "bn" ? "সংরক্ষিত" : "Saved"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    value={
                      latitude && longitude
                        ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                        : ""
                    }
                    placeholder={lang === "bn" ? "যেমন: 23.746500, 90.376800" : "e.g. 23.746500, 90.376800"}
                    className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locatingGps}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
                  title={lang === "bn" ? "বর্তমান GPS লোকেশন নিন" : "Get Current Location"}
                >
                  <Navigation className={`w-3.5 h-3.5 ${locatingGps ? "animate-spin" : ""}`} />
                  <span>
                    {locatingGps
                      ? (lang === "bn" ? "লোকেশন খোঁজা হচ্ছে..." : "Locating...")
                      : (lang === "bn" ? "GPS লোকেশন নিন" : "Get GPS")}
                  </span>
                </button>
              </div>

              {gpsSuccessMsg && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  {gpsSuccessMsg}
                </p>
              )}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {lang === "bn"
                  ? "সেলুনে অবস্থানকালীন এই বাটনে চাপ দিন যাতে কাস্টমাররা ম্যাপে সেলুনের সঠিক দূরত্ব দেখতে পায়।"
                  : "Tap while at your salon so customers see accurate distance on search and maps."}
              </p>
            </div>

            {/* Category (Mobile-Friendly Touch Pills + Styled Dropdown) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.categoryLabel || (lang === "bn" ? "সেলুনের ধরন / ক্যাটাগরি" : "Salon Category")}
              </label>

              {/* Mobile-Friendly Touch Pills */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { id: "GENTS", labelBn: "জেন্টস", labelEn: "Gents", icon: "👨" },
                  { id: "LADIES", labelBn: "লেডিস", labelEn: "Ladies", icon: "👩" },
                  { id: "UNISEX", labelBn: "ইউনিসেক্স", labelEn: "Unisex", icon: "👥" },
                ].map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(15);
                        setCategory(cat.id);
                      }}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-800 dark:text-teal-200 shadow-xs ring-1 ring-teal-500/20"
                          : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600/60"
                      }`}
                    >
                      <span className="text-sm leading-none">{cat.icon}</span>
                      <span className="text-[11px]">{lang === "bn" ? cat.labelBn : cat.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* Enhanced Mobile-friendly Select Dropdown */}
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer dark:text-white pr-9 shadow-2xs"
                >
                  <option value="GENTS">👨 {t.gents}</option>
                  <option value="LADIES">👩 {t.ladies}</option>
                  <option value="UNISEX">👥 {t.unisex}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
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
