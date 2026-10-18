"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Scissors,
  Phone,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  Store,
  User,
} from "lucide-react";

import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role"); // "owner" or "customer"
  const { lang, t, setUser, triggerHaptic } = useApp();

  const [activeTab, setActiveTab] = useState<"CUSTOMER" | "OWNER">(
    roleParam?.toUpperCase() === "OWNER" ? "OWNER" : "CUSTOMER"
  );
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(180);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [demoCode, setDemoCode] = useState("");

  // Countdown timer for OTP expiry
  useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    triggerHaptic(30);

    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setCountdown(180);
        if (data.demoOtp) {
          setDemoCode(data.demoOtp);
          setOtpCode(data.demoOtp); // Auto-fill for convenience
        }
      } else {
        setErrorMessage(data.error || t.error);
      }
    } catch (e) {
      setErrorMessage(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    triggerHaptic(40);

    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: otpCode,
          role: activeTab,
          name: name || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        if (data.user.role === "OWNER") {
          router.push("/owner/dashboard");
        } else {
          router.push("/");
        }
      } else {
        setErrorMessage(data.error || t.error);
      }
    } catch (e) {
      setErrorMessage(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="px-5 py-8 max-w-sm mx-auto w-full flex-1 flex flex-col justify-center">
        {/* Logo & Intro */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#115E59] text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/20">
            <Scissors className="w-8 h-8 text-amber-300 transform -rotate-45" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">{t.appName}</h1>
          <p className="text-xs text-slate-500 mt-1">{t.tagline}</p>
        </div>

        {/* Dual Login Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center mb-5 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab("CUSTOMER");
              setOtpSent(false);
              setErrorMessage("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "CUSTOMER"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.customerTab}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("OWNER");
              setOtpSent(false);
              setErrorMessage("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "OWNER"
                ? "bg-white text-purple-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>{t.ownerTab}</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Phone Entry */}
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.enterPhone}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full text-base font-mono bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.name} ({lang === "bn" ? "ঐচ্ছিক" : "Optional"})
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="আপনার পূর্ণ নাম"
                className="w-full text-sm bg-white border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition"
              />
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-1">
              <p className="text-[10px] font-semibold text-slate-400 mb-1">
                {lang === "bn" ? "টেস্ট নম্বর (১-ক্লিক পূরণ):" : "Demo Accounts (1-Click Fill):"}
              </p>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {activeTab === "OWNER" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPhone("01711223344");
                        setName("রফিকুল ইসলাম");
                      }}
                      className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                    >
                      মালিক: রফিকুল (ধানমন্ডি)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhone("01822334455");
                        setName("নুসরাত জাহান");
                      }}
                      className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                    >
                      মালিক: নুসরাত (বনানী)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPhone("01712345678");
                        setName("তানভীর আহমেদ");
                      }}
                      className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
                    >
                      কাস্টমার: তানভীর
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhone("01898765432");
                        setName("ফারহানা রহমান");
                      }}
                      className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
                    >
                      কাস্টমার: ফারহানা
                    </button>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-[#0D9488] hover:bg-[#115E59] active:scale-95 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? t.loading : t.sendOtp}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* STEP 2: OTP Entry */
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
            <div className="text-center p-3 bg-teal-50/70 border border-teal-100 rounded-2xl">
              <p className="text-xs text-teal-900 font-semibold">{t.otpSentTo}</p>
              <p className="font-mono font-bold text-teal-800 text-sm">{phone}</p>
              {demoCode && (
                <div className="mt-1.5 inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-600 text-white">
                  Demo Code: {demoCode}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.enterOtp}
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.4em] text-xl font-mono font-bold bg-white border border-slate-200 rounded-2xl py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition"
                />
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {Math.floor(countdown / 60)}:
                    {String(countdown % 60).padStart(2, "0")} {lang === "bn" ? "বাকি" : "left"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode("");
                  }}
                  className="text-teal-700 hover:underline font-semibold cursor-pointer"
                >
                  {t.resendOtp}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? t.loading : t.verifyOtp}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Admin Link */}
        <div className="mt-8 text-center pt-4 border-t border-slate-200/60">
          <Link
            href="/admin"
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition"
          >
            {t.adminLogin} →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">লোড হচ্ছে...</div>}>
      <LoginContent />
    </Suspense>
  );
}
