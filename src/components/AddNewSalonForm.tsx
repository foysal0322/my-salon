"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Store,
  Scissors,
  MapPin,
  Phone,
  Mail,
  Wind,
  Armchair,
  CreditCard,
  Sparkles,
  Navigation,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
  ShieldCheck,
  QrCode,
  Upload,
  Camera,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface AddNewSalonFormProps {
  onSuccess?: (createdSalon: any) => void;
  onCancel?: () => void;
}

const DHAKA_AREAS = [
  { name: "ধানমন্ডি", lat: 23.7461, lng: 90.3742 },
  { name: "গুলশান", lat: 23.7785, lng: 90.4172 },
  { name: "বনানী", lat: 23.7937, lng: 90.4046 },
  { name: "উত্তরা", lat: 23.8759, lng: 90.3795 },
  { name: "মিরপুর", lat: 23.8067, lng: 90.3644 },
  { name: "মোহাম্মদপুর", lat: 23.7658, lng: 90.3584 },
];

export default function AddNewSalonForm({ onSuccess, onCancel }: AddNewSalonFormProps) {
  const router = useRouter();
  const { lang, t, user, setActiveSalonId, triggerHaptic, showNotificationToast } = useApp();

  // Form Fields
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [category, setCategory] = useState<"GENTS" | "LADIES" | "UNISEX">("GENTS");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [totalChairs, setTotalChairs] = useState<number>(3);
  const [isAc, setIsAc] = useState<boolean>(true);
  const [acceptsDigitalPayment, setAcceptsDigitalPayment] = useState<boolean>(true);
  const [coverImage, setCoverImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geospatial
  const [latitude, setLatitude] = useState<number>(23.7461);
  const [longitude, setLongitude] = useState<number>(90.3742);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationSuccess, setLocationSuccess] = useState<boolean>(false);

  // Status
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Handle Salon Photo Upload with Client-Side Canvas Compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert(lang === "bn" ? "ছবির সাইজ ১২ মেগাবাইটের কম হতে হবে।" : "Image must be under 12MB.");
      return;
    }

    setUploadingImage(true);
    triggerHaptic(30);

    try {
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

          try {
            const res = await fetch("/api/v1/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: compressedDataUrl }),
            });
            const data = await res.json();
            if (data.url) {
              setCoverImage(data.url);
            } else {
              setCoverImage(compressedDataUrl);
            }
          } catch (uploadErr) {
            setCoverImage(compressedDataUrl);
          } finally {
            setUploadingImage(false);
          }
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingImage(false);
    }
  };

  // GPS Current Location Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert(lang === "bn" ? "আপনার ব্রাউজারে লোকেশন সার্ভিস সমর্থিত নয়।" : "Geolocation not supported.");
      return;
    }
    setLocating(true);
    triggerHaptic(30);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
        setLocationSuccess(true);
      },
      (err) => {
        console.warn("GPS detection error:", err);
        setLocating(false);
        alert(
          lang === "bn"
            ? "লোকেশন চিহ্নিত করা যায়নি। অনুগ্রহ করে নিচের এলাকা নির্বাচন করুন।"
            : "Could not fetch GPS. Please pick an area below."
        );
      },
      { timeout: 8000 }
    );
  };

  const handleSelectArea = (area: { name: string; lat: number; lng: number }) => {
    triggerHaptic(20);
    setLatitude(area.lat);
    setLongitude(area.lng);
    setLocationSuccess(true);
    if (!address.includes(area.name)) {
      setAddress((prev) => (prev ? `${prev}, ${area.name}` : area.name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!user?.id) {
      setErrorMessage(
        lang === "bn"
          ? "সেলুন তৈরি করতে প্রথমে মালিক হিসেবে লগইন করুন।"
          : "Please login as owner to create a salon."
      );
      return;
    }

    if (!nameBn.trim() || !nameEn.trim() || !address.trim() || !phone.trim()) {
      setErrorMessage(
        lang === "bn"
          ? "সেলুনের বাংলা ও ইংরেজি নাম, ঠিকানা এবং মোবাইল নম্বর আবশ্যক।"
          : "Salon names (Bangla & English), address, and phone number are required."
      );
      return;
    }

    setLoading(true);
    triggerHaptic(40);

    try {
      const payload: any = {
        ownerId: user.id,
        nameBn: nameBn.trim(),
        nameEn: nameEn.trim(),
        category,
        isAc,
        acceptsDigitalPayment,
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        totalChairs: Number(totalChairs),
        latitude,
        longitude,
        coverImage,
      };

      const res = await fetch("/api/v1/owner/saloons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.salon) {
        setSuccessMessage(
          lang === "bn"
            ? `অভিনন্দন! সেলুন "${data.salon.nameBn}" সফলভাবে তৈরি হয়েছে।`
            : `Success! Salon "${data.salon.nameEn}" has been created.`
        );

        // Set as active salon immediately
        setActiveSalonId(data.salon.id);

        showNotificationToast({
          title: lang === "bn" ? "🎉 নতুন সেলুন তৈরি সম্পন্ন" : "🎉 New Salon Created",
          message: lang === "bn" ? "আপনার সেলুনের জন্য ৩০ দিনের ফ্রি ট্রায়াল চালু হয়েছে।" : "30-Day Free Trial activated.",
          type: "INFO",
        });

        if (onSuccess) {
          onSuccess(data.salon);
        } else {
          // Direct to QR poster page so owner can print poster immediately
          setTimeout(() => {
            router.push(`/owner/profile?tab=qr`);
          }, 1000);
        }
      } else {
        setErrorMessage(data.error || t.error);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto w-full animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white shadow-lg border border-teal-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-amber-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "৩০ দিন সম্পূর্ণ ফ্রি ট্রায়াল" : "30-Day Free Trial Included"}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {lang === "bn" ? "নতুন সেলুন শাখা যোগ করুন" : "Add New Salon Branch"}
          </h2>
          <p className="text-xs text-teal-100/90 mt-1 leading-relaxed">
            {lang === "bn"
              ? "আপনার নতুন সেলুন বা ব্রাঞ্চের বিবরণ দিন। স্বয়ংক্রিয়ভাবে লাইভ সিরিয়াল সিস্টেম ও প্রিন্টযোগ্য QR পোস্টার তৈরি হবে।"
              : "Register your new salon or branch to enable live queuing, chair management, and printable QR posters."}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: Basic Information */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-700">
            <Store className="w-4 h-4" />
            <span>{lang === "bn" ? "১. সেলুনের প্রাথমিক তথ্য" : "1. Basic Salon Details"}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === "bn" ? "সেলুনের নাম (বাংলা) *" : "Salon Name (Bangla) *"}
              </label>
              <input
                type="text"
                required
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder={lang === "bn" ? "যেমন: রয়্যাল কাট সেলুন" : "e.g. Royal Cut Salon"}
                className="w-full text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === "bn" ? "সেলুনের নাম (ইংরেজি) *" : "Salon Name (English) *"}
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Royal Cut Salon"
                className="w-full text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === "bn" ? "সেলুন ক্যাটাগরি *" : "Salon Category *"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory("GENTS")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${category === "GENTS"
                  ? "bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border-teal-600 shadow-2xs"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
              >
              <span className="text-base">👨</span>
              <span>{lang === "bn" ? "জেন্টস সেলুন" : "Gents"}</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory("LADIES")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${category === "LADIES"
                ? "bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border-teal-600 shadow-2xs"
                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
              >
            <span className="text-base">👩</span>
            <span>{lang === "bn" ? "লেডিস পার্লার" : "Ladies"}</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory("UNISEX")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${category === "UNISEX"
              ? "bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border-teal-600 shadow-2xs"
              : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
              >
          <span className="text-base">👥</span>
          <span>{lang === "bn" ? "ইউনিসেক্স" : "Unisex"}</span>
        </button>
    </div>
          </div >
        </div >

    {/* SECTION 2: Contact & Location */ }
    < div className = "p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5" >
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-700">
            <MapPin className="w-4 h-4" />
            <span>{lang === "bn" ? "২. যোগাযোগ ও অবস্থান" : "2. Location & Contact"}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === "bn" ? "শাখার মোবাইল নম্বর *" : "Branch Mobile Number *"}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full text-sm font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === "bn" ? "ইমেইল (ঐচ্ছিক)" : "Email Address (Optional)"}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="salon@example.com"
                  className="w-full text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === "bn" ? "পূর্ণ ঠিকানা ও এলাকা *" : "Full Street Address *"}
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={lang === "bn" ? "যেমন: বাড়ি ১২, রোড ৭, ধানমন্ডি, ঢাকা" : "e.g. House 12, Road 7, Dhanmondi, Dhaka"}
              className="w-full text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>

  {/* GPS Coordinates Helper */ }
  <div className="pt-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
        {lang === "bn" ? "কাছের গ্রাহকদের ম্যাপে দেখাতে লোকেশন সেট করুন:" : "Set location for customer discovery:"}
      </span>
      <button
        type="button"
        onClick={handleDetectLocation}
        disabled={locating}
        className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
      >
        <Navigation className={`w-3 h-3 ${locating ? "animate-spin" : ""}`} />
        <span>{locating ? "খোঁজা হচ্ছে..." : "📍 বর্তমান জিপিএস নিন"}</span>
      </button>
    </div>

    {/* Quick Area Buttons */}
    <div className="flex flex-wrap gap-1.5 pt-1">
      {DHAKA_AREAS.map((a) => (
        <button
          key={a.name}
          type="button"
          onClick={() => handleSelectArea(a)}
          className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-700 transition cursor-pointer"
        >
          {a.name}
        </button>
      ))}
    </div>

    {locationSuccess && (
      <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
        <Check className="w-3 h-3" />
        <span>GPS Set: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
      </p>
    )}
  </div>
        </div >

    {/* SECTION 3: Facilities & Chairs */ }
    < div className = "p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5" >
      <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-700">
        <Armchair className="w-4 h-4" />
        <span>{lang === "bn" ? "৩. চেয়ার ও সুবিধাসমূহ" : "3. Chairs & Amenities"}</span>
      </h3>

  {/* Chair Counter */ }
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {lang === "bn" ? "মোট কর্মরত চেয়ারের সংখ্যা *" : "Total Active Chairs *"}
      </label>
      <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300">
        {totalChairs} {lang === "bn" ? "টি চেয়ার" : "chairs"}
      </span>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setTotalChairs((prev) => Math.max(1, prev - 1))}
        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-base flex items-center justify-center transition cursor-pointer active:scale-95"
      >
        -
      </button>
      <input
        type="number"
        min={1}
        max={30}
        required
        value={totalChairs}
        onChange={(e) => setTotalChairs(Math.max(1, parseInt(e.target.value) || 1))}
        className="flex-1 text-center font-mono font-bold text-base bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
      />
      <button
        type="button"
        onClick={() => setTotalChairs((prev) => Math.min(30, prev + 1))}
        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-base flex items-center justify-center transition cursor-pointer active:scale-95"
      >
        +
      </button>
    </div>
    <p className="text-[10px] text-slate-400 mt-1">
      {lang === "bn"
        ? "ড্যাশবোর্ড থেকে প্রতিটি চেয়ারের ব্যস্ত/খালি অবস্থা সরাসরি নিয়ন্ত্রণ করতে পারবেন।"
        : "You can toggle each chair's live busy/free status from the dashboard."}
    </p>
  </div>

  {/* Toggles */ }
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
    {/* AC Toggle */}
    <div
      onClick={() => setIsAc(!isAc)}
              className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${isAc
        ? "bg-teal-50/80 dark:bg-teal-950/60 border-teal-500"
        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                }`}
            >
    <div className="flex items-center gap-2">
      <Wind className={`w-4 h-4 ${isAc ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
      <div>
        <p className="text-xs font-bold text-slate-900 dark:text-white">
          {lang === "bn" ? "শীতাতপ নিয়ন্ত্রিত (AC)" : "Air Conditioned (AC)"}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          {isAc ? (lang === "bn" ? "সক্রিয় আছে" : "Active") : (lang === "bn" ? "নন-এসি" : "Non-AC")}
        </p>
      </div>
    </div>
    <input
      type="checkbox"
      checked={isAc}
      onChange={() => { }}
      className="w-4 h-4 accent-teal-600 rounded cursor-pointer pointer-events-none"
    />
  </div>

  {/* Digital Payment Toggle */ }
  <div
    onClick={() => setAcceptsDigitalPayment(!acceptsDigitalPayment)}
              className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${acceptsDigitalPayment
      ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500"
      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                } `}
            >
              <div className="flex items-center gap-2">
                <CreditCard
                  className={`w - 4 h - 4 ${ acceptsDigitalPayment ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400" } `}
                />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === "bn" ? "ডিজিটাল পেমেন্ট" : "Digital Payment"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">bKash, Nagad, Card</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={acceptsDigitalPayment}
                onChange={() => { }}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Salon Photo Upload (Own Salon Photo) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              <span>{lang === "bn" ? "৪. সেলুনের নিজস্ব ছবি (কভার ফটো)" : "4. Salon Cover Photo"}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              {lang === "bn" ? "ঐচ্ছিক" : "Optional"}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === "bn"
              ? "আপনার সেলুন বা পার্লারের আসল ছবি ক্যামেরা দিয়ে তুলুন অথবা মোবাইল গ্যালারি থেকে আপলোড করুন।"
              : "Upload an authentic photo of your salon floor or storefront from your phone camera or gallery."}
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/*"
            className="hidden"
          />

          {coverImage ? (
            <div className="space-y-2.5">
              <div className="relative rounded-2xl overflow-hidden border border-teal-500/40 shadow-sm bg-slate-900">
                <img
                  src={coverImage}
                  alt="Salon Cover Preview"
                  className="w-full h-44 sm:h-52 object-cover"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className={`w - 3.5 h - 3.5 ${ uploadingImage ? "animate-spin" : "" } `} />
                    <span>{lang === "bn" ? "পরিবর্তন" : "Change"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(20);
                      setCoverImage("");
                    }}
                    className="p-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm transition active:scale-95 cursor-pointer"
                    title={lang === "bn" ? "ছবি মুছুন" : "Remove Photo"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-700/80 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/70 dark:hover:bg-teal-950/40 transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                {uploadingImage ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-600 dark:text-teal-400" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {uploadingImage
                    ? lang === "bn"
                      ? "ছবি প্রসেস ও আপলোড হচ্ছে..."
                      : "Processing & uploading..."
                    : lang === "bn"
                      ? "ক্লিক করে সেলুনের ছবি আপলোড করুন"
                      : "Tap to upload salon photo"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === "bn"
                    ? "ক্যামেরা দিয়ে সরাসরি ছবি তুলুন বা গ্যালারি থেকে সিলেক্ট করুন (JPG, PNG, WEBP)"
                    : "Take a photo directly with camera or select from gallery"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="py-3 px-4 rounded-2xl font-bold text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition cursor-pointer"
            >
              {lang === "bn" ? "বাতিল করুন" : "Cancel"}
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3.5 px-5 rounded-2xl font-bold text-sm bg-teal-700 hover:bg-teal-800 active:scale-95 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>
              {loading
                ? t.loading
                : lang === "bn"
                  ? "নতুন সেলুন শাখা তৈরি করুন"
                  : "Create Salon Branch"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
