"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Scissors,
  Phone,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Clock,
  Store,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  UserPlus,
  LogIn,
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode"); // "signup" or "login"
  const { lang, t, setUser, triggerHaptic } = useApp();

  // Mode: "LOGIN" (number + password) or "SIGNUP" (first time OTP verification + password set)
  const [ownerMode, setOwnerMode] = useState<"LOGIN" | "SIGNUP">(
      modeParam?.toUpperCase() === "SIGNUP" ? "SIGNUP" : "LOGIN"
    );

  // Form fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");

  // OTP flow state for first-time Owner Signup
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(180);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [demoCode, setDemoCode] = useState("");

  // Countdown timer for OTP expiry
  useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const resetFormState = () => {
    setOtpSent(false);
    setOtpCode("");
    setErrorMessage("");
    setSuccessMessage("");
    setDemoCode("");
  };

  // 1. OWNER PASSWORD LOGIN
  const handleOwnerPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);
    triggerHaptic(30);

    try {
      const res = await fetch("/api/v1/auth/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        router.push("/owner/dashboard");
      } else {
        setErrorMessage(data.error || t.error);
      }
    } catch {
      setErrorMessage(t.error);
    } finally {
      setLoading(false);
    }
  };

  // 2. SEND OTP FOR FIRST-TIME OWNER SIGNUP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

      if (!name.trim()) {
        setErrorMessage(lang === "bn" ? "মালিকের নাম আবশ্যক।" : "Owner name is required.");
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage(
          lang === "bn"
            ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"
            : "Password must be at least 6 characters."
        );
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(
          lang === "bn" ? "উভয় পাসওয়ার্ড হুবহু এক হতে হবে।" : "Passwords do not match."
        );
        return;
      }

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
          setSuccessMessage(
            lang === "bn"
              ? "আপনার মোবাইলে এসএমএস-এর মাধ্যমে ওটিপি পাঠানো হয়েছে।"
              : "OTP code has been sent to your mobile via SMS."
          );
          if (data.demoOtp) {
            setDemoCode(data.demoOtp);
            setOtpCode(data.demoOtp); // Auto-fill demo helper
          }
        } else {
          setErrorMessage(data.error || t.error);
        }
      } catch {
        setErrorMessage(t.error);
      } finally {
        setLoading(false);
      }
    };

    // 3. VERIFY OTP & CREATE OWNER ACCOUNT
    const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");
      setLoading(true);
      triggerHaptic(40);

      try {
        const payload: any = {
          phone,
          code: otpCode,
          role: "OWNER",
          name: name.trim() || undefined,
          password,
        };

        const res = await fetch("/api/v1/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          router.push("/owner/dashboard");
        } else {
          setErrorMessage(data.error || t.error);
        }
      } catch {
        setErrorMessage(t.error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <AppShell>
            <div className="px-4 sm:px-5 py-6 sm:py-8 max-w-sm mx-auto w-full flex-1 flex flex-col justify-center">
              {/* Logo & Intro */}
              <div className="text-center mb-5">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md shadow-teal-700/20">
                  <Scissors className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 transform -rotate-45" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {lang === "bn" ? "সেলুন মালিক পোর্টাল" : "Salon Owner Portal"}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === "bn"
                    ? "লগইন করুন অথবা নতুন সেলুন একাউন্ট খুলুন"
                    : "Login or register your salon account"}
                </p>
              </div>

                {/* OWNER MODE SWITCHER: LOGIN vs SIGNUP */}
                <div className="flex items-center justify-center gap-1.5 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerMode("LOGIN");
                      resetFormState();
                    }}
                    className={`flex-1 py-2 font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${ownerMode === "LOGIN"
                        ? "bg-teal-700 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{lang === "bn" ? "পাসওয়ার্ড লগইন" : "Password Login"}</span>
                  </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOwnerMode("SIGNUP");
                        resetFormState();
                      }}
                      className={`flex-1 py-2 font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${ownerMode === "SIGNUP"
                          ? "bg-teal-700 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{lang === "bn" ? "নতুন সাইন আপ (OTP)" : "Sign Up (OTP)"}</span>
                    </button>
                </div>

                {/* Error Alert */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Success Alert */}
                {successMessage && (
                  <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{successMessage}</span>
                  </div>
                )}

                  {/* ======================================================== */ }
        {/* CASE 1: OWNER PASSWORD LOGIN (Direct password login)     */}
                {/* ======================================================== */}
                {ownerMode === "LOGIN" && (
                  <form onSubmit={handleOwnerPasswordLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === "bn" ? "মালিকের মোবাইল নম্বর" : "Owner Mobile Number"}
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition"
                        />
                        <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === "bn" ? "পাসওয়ার্ড" : "Password"}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition"
                        />
                        <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Quick Demo Fill Buttons for Owners */}
                    <div className="pt-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        {lang === "bn" ? "ডেমো সেলুন মালিক (১-ক্লিক পূরণ):" : "Demo Accounts (1-Click Fill):"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setPhone("01711223344");
                            setPassword("owner123");
                          }}
                          className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition font-medium cursor-pointer"
                        >
                          রফিকুল (ধানমন্ডি) • pass: owner123
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhone("01822334455");
                            setPassword("owner123");
                          }}
                          className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition font-medium cursor-pointer"
                        >
                          নুসরাত (বনানী) • pass: owner123
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 sm:py-3.5 px-4 rounded-2xl font-bold text-sm bg-teal-700 hover:bg-teal-800 active:scale-95 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{loading ? t.loading : lang === "bn" ? "পাসওয়ার্ড দিয়ে লগইন করুন" : "Login with Password"}</span>
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOwnerMode("SIGNUP");
                          resetFormState();
                        }}
                        className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                      >
                        {lang === "bn"
                          ? "নতুন সেলুন মালিক? ওটিপি যাচাই করে একাউন্ট খুলুন →"
                          : "New Salon Owner? Sign up with OTP →"}
                      </button>
                    </div>
                  </form>
                )}

                {/* ======================================================== */}
                {/* CASE 2: OWNER SIGNUP (First time with OTP + Set Password) */}
                {/* ======================================================== */}
                  { ownerMode === "SIGNUP" && (
                    <div>
                      {!otpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-3.5">
                            <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-2xl border border-teal-200/80 dark:border-teal-800 text-[11px] text-teal-900 dark:text-teal-200 leading-relaxed">
                              💡 {lang === "bn"
                                ? "প্রথমবার রেজিস্ট্রেশনকালে মোবাইল নম্বরে এসএমএস ওটিপি যাবে। একবার ওটিপি যাচাই সম্পন্ন হলে পরবর্তীতে প্রতিবার শুধু মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে সরাসরি লগইন করতে পারবেন।"
                                : "For the very first time, an OTP is sent via SMS. Once verified, you will always login directly with your phone number and password."}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  {lang === "bn" ? "মালিকের পূর্ণ নাম *" : "Owner Full Name *"}
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder={lang === "bn" ? "যেমন: মোঃ রফিকুল ইসলাম" : "e.g. Rafiqul Islam"}
                                  className="w-full text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  {lang === "bn" ? "১১ ডিজিটের মোবাইল নম্বর *" : "Mobile Number *"}
                                </label>
                                <div className="relative">
                                  <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="017XXXXXXXX"
                                    className="w-full text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition"
                                  />
                                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  {lang === "bn" ? "নতুন পাসওয়ার্ড সেট করুন (কমপক্ষে ৬ অক্ষর) *" : "Set Password (min 6 chars) *"}
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition"
                                  />
                                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  {lang === "bn" ? "পাসওয়ার্ড নিশ্চিত করুন *" : "Confirm Password *"}
                                </label>
                                <div className="relative">
                                  <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition"
                                  />
                                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-teal-700 hover:bg-teal-800 active:scale-95 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              <span>{loading ? t.loading : lang === "bn" ? "ওটিপি পাঠান ও ভেরিফাই করুন" : "Send OTP & Verify"}</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>

                            <div className="text-center pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setOwnerMode("LOGIN");
                                  resetFormState();
                                }}
                                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 cursor-pointer"
                              >
                                ← {lang === "bn" ? "ইতিমধ্যে একাউন্ট আছে? পাসওয়ার্ড দিয়ে লগইন করুন" : "Already have account? Login with Password"}
                              </button>
                            </div>
                        </form>
                      ) : (
                        /* OWNER SIGNUP STEP 2: OTP Verification */
                        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                            <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-2xl">
                              <p className="text-xs text-teal-900 dark:text-teal-200 font-semibold">{t.otpSentTo}</p>
                              <p className="font-mono font-bold text-teal-800 dark:text-teal-300 text-sm">{phone}</p>
                              {demoCode && (
                    <div className="mt-1.5 inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-700 text-white">
                      Demo Code: {demoCode}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                      className="w-full text-center tracking-[0.4em] text-xl font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition"
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
                      className="text-teal-700 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
                    >
                      {t.resendOtp}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-teal-700 hover:bg-teal-800 active:scale-95 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? t.loading : lang === "bn" ? "ওটিপি যাচাই ও একাউন্ট তৈরি করুন" : "Verify OTP & Create Account"}</span>
                </button>
              </form>
            )}
                          </div>
        )}
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
