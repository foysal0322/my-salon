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
  Sparkles,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  Clock,
  Wind,
} from "lucide-react";

import { Suspense } from "react";

function OwnerProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "qr"; // "qr", "profile", "sub"
  const { lang, t, activeSalonId, triggerHaptic } = useApp();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [salon, setSalon] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrTargetUrl, setQrTargetUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
    if (!activeSalonId) return;
    setLoading(true);
    try {
      // 1. Fetch salon profile
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/state`);
      // Or fetch from /api/v1/owner/saloons
      const saloonsRes = await fetch(`/api/v1/owner/saloons?ownerId=${salon?.ownerId || ""}`);
      const saloonsData = await saloonsRes.json();
      if (saloonsData.saloons) {
        const found = saloonsData.saloons.find((s: any) => s.id === activeSalonId);
        if (found) {
          setSalon(found);
          setNameBn(found.nameBn);
          setNameEn(found.nameEn);
          setAddress(found.address);
          setPhone(found.phone);
          setCategory(found.category);
          setIsAc(found.isAc);
          setTotalChairs(found.totalChairs);
        }
      }

      // 2. Fetch QR Code
      const qrRes = await fetch(`/api/v1/owner/saloons/${activeSalonId}/qr`);
      const qrData = await qrRes.json();
      if (qrData.qrDataUrl) {
        setQrDataUrl(qrData.qrDataUrl);
        setQrTargetUrl(qrData.qrTargetUrl);
      }

      // 3. Fetch Subscription
      const subRes = await fetch(`/api/v1/owner/subscriptions?saloonId=${activeSalonId}`);
      const subData = await subRes.json();
      setSubStatus(subData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalonAndQr();
  }, [activeSalonId]);

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
      } catch (e) {}
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
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "qr" ? "bg-white text-teal-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>A4 QR পোস্টার</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "profile" ? "bg-white text-teal-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>প্রোফাইল সেটিংস</span>
          </button>

          <button
            onClick={() => setActiveTab("sub")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "sub" ? "bg-white text-purple-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
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

            {/* A4 POSTER FRAME CONTAINER (Designed for crisp A4 Vector Print) */}
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-300 shadow-lg text-center a4-page relative overflow-hidden">
              {/* Top Header Band */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-slate-900 text-amber-300 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>আমার সেলুন (AMARSALOON)</span>
                </div>
                <h1 className="text-2xl font-black text-slate-950 leading-tight">
                  {salon?.nameBn || "সেলুনের নাম"}
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">
                  {salon?.nameEn}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900">
                    {salon?.category}
                  </span>
                  {salon?.isAc && (
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 flex items-center gap-1">
                      <Wind className="w-3 h-3" /> AC
                    </span>
                  )}
                  <span className="text-slate-600">চেয়ার: {salon?.totalChairs}টি</span>
                </div>
              </div>

              {/* Central Hero QR Code Zone */}
              <div className="my-6">
                <p className="text-xs font-black uppercase tracking-widest text-teal-800 mb-2">
                  {lang === "bn" ? "★ স্ক্যান করে সিরিয়াল নিন ★" : "★ SCAN TO BOOK ONLINE ★"}
                </p>
                <div className="inline-block p-4 bg-white rounded-3xl border-4 border-slate-900 shadow-xl">
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
                <p className="text-[11px] font-mono font-bold text-slate-500 mt-2">
                  amarsaloon.com/s/{salon?.slug}
                </p>
              </div>

              {/* 3 Steps Visual Guide */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left my-4 space-y-2 text-xs">
                <p className="font-bold text-slate-900 mb-1">
                  {lang === "bn" ? "কিভাবে ব্যবহার করবেন:" : "How to use:"}
                </p>
                <p className="text-slate-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-[10px]">১</span>
                  <span>{t.step1}</span>
                </p>
                <p className="text-slate-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-[10px]">২</span>
                  <span>{t.step2}</span>
                </p>
                <p className="text-slate-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-[10px]">৩</span>
                  <span>{t.step3}</span>
                </p>
              </div>

              {/* Footer Band */}
              <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                <p className="font-semibold text-slate-800">{salon?.address}</p>
                <p className="font-mono mt-0.5">মোবাইল: {salon?.phone}</p>
              </div>
            </div>

            {/* Print & Share Action Buttons */}
            <div className="grid grid-cols-2 gap-3 no-print">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#0D9488] hover:bg-[#115E59] active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t.printPoster}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-teal-600" />
                <span>{t.sharePoster}</span>
              </button>
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
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    subStatus?.status === "ACTIVE"
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
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                  selectedPlan === "MONTHLY"
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
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer relative ${
                  selectedPlan === "YEARLY"
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
                    className={`py-2 px-1 rounded-xl border transition cursor-pointer text-[11px] ${
                      paymentMethod === m
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
