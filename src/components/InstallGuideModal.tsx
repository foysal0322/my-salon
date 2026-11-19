"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Apple, Share, PlusSquare, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "bn" | "en";
  onDirectInstall?: () => void;
  canDirectInstall?: boolean;
}

export default function InstallGuideModal({
  isOpen,
  onClose,
  lang,
}: InstallGuideModalProps) {
  const [platform, setPlatform] = useState<"android" | "ios">("android");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setPlatform("ios");
    } else {
      setPlatform("android");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-700/20">
              <Download className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                {lang === "bn" ? "AmarSalon অ্যাপ ইনস্টল" : "Install AmarSalon App"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === "bn" ? "অ্যান্ড্রয়েড ও আইফোন এর জন্য আলাদা ব্যবস্থা" : "Choose your device platform"}
              </p>
            </div>
          </div>

        {/* 2 Platform Options: Android vs iOS */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-4 text-xs font-bold">
          <button
            onClick={() => setPlatform("android")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              platform === "android"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android (APK)</span>
          </button>

          <button
            onClick={() => setPlatform("ios")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              platform === "ios"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Apple className="w-4 h-4 text-slate-900 dark:text-white" />
            <span>iPhone / iOS</span>
          </button>
        </div>

                {/* Tab Content */}
                {platform === "android" && (
                  <div className="space-y-3.5">
                    {/* 1-Click APK Download Button */}
                    <a
                      href="/AmarSalon.apk"
                      download="AmarSalon.apk"
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white font-bold text-sm shadow-lg shadow-teal-700/25 transition flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>
                        {lang === "bn"
                          ? "সরাসরি APK ডাউনলোড করুন (৪.৯ এমবি)"
                          : "Download Android APK (4.9 MB)"}
                      </span>
                    </a>

                      {/* Feature Highlights */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            {lang === "bn"
                              ? "এক ক্লিকেই ডাউনলোড ও সরাসরি ইনস্টল"
                              : "Single-click download and instant installation"}
                          </span>
                        </div>
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>
                              {lang === "bn"
                                ? "নতুন আপডেট আসলে স্বয়ংক্রিয় নোটিফিকেশন"
                                : "Automatic notification when new version is uploaded"}
                            </span>
                          </div>
                              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                                <span>
                                  {lang === "bn"
                                    ? "অফলাইনেও হিসাব খাতা ও প্রি-লোড সেলুন দর্শন"
                                    : "Offline ledger & preloaded salon browsing"}
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-400 dark:text-slate-400 text-center">
                              {lang === "bn"
                                ? "ডাউনলোড শেষে ফাইলে ট্যাপ করে 'Install' চাপুন।"
                                : "After download completes, tap the file and press Install."}
                            </p>
                          </div>
        )}

                          {platform === "ios" && (
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                              <div className="flex items-start gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  ১
                                </div>
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <span>{lang === "bn" ? "Safari ব্রাউজারে খুলুন" : "Open in Safari browser"}</span>
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {lang === "bn"
                                    ? "iPhone এ AmarSalon চালানোর জন্য Safari ব্রাউজার ব্যবহার করুন।"
                                    : "Use Safari browser on your iPhone or iPad."}
                                </p>
                              </div>
                            </div>

                                <div className="flex items-start gap-2.5">
                                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                    ২
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                      <span>{lang === "bn" ? "Share (শেয়ার) আইকনে চাপুন" : "Tap the Share icon"}</span>
                                      <Share className="w-3.5 h-3.5 text-blue-500" />
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {lang === "bn"
                                        ? "সাফারির নিচে থাকা শেয়ার বাটনটিতে ট্যাপ করুন।"
                                        : "Tap the square icon with an upward arrow at the bottom of Safari."}
                                    </p>
                                  </div>
                                </div>

                                  <div className="flex items-start gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                      ৩
                                    </div>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                    <span>{lang === "bn" ? "'Add to Home Screen' বেছে নিন" : "Select 'Add to Home Screen'"}</span>
                                    <PlusSquare className="w-3.5 h-3.5 text-teal-600" />
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {lang === "bn"
                                      ? "মেনু থেকে 'Add to Home Screen' ট্যাপ করে উপরে 'Add' চাপলেই অ্যাপ প্রস্তুত!"
                                      : "Scroll down, select 'Add to Home Screen', and tap 'Add'."}
                                  </p>
                                </div>
                              </div>
                            </div>
        )}

                          {/* Dismiss Button */}
                          <div className="mt-4">
                            <button
                              onClick={onClose}
                              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                            >
                              {lang === "bn" ? "বন্ধ করুন" : "Close"}
                            </button>
                          </div>
                        </div>
                      </div>
                      );
}
