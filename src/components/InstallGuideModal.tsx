"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Monitor, Apple, Check, Share, PlusSquare, MoreVertical } from "lucide-react";

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
  onDirectInstall,
  canDirectInstall,
}: InstallGuideModalProps) {
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop">("android");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setPlatform("ios");
    } else if (/Android/i.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
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
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
            <Download className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
              {lang === "bn" ? "আমার সেলুন অ্যাপ ইনস্টল" : "Install AmarSalon App"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === "bn" ? "হোমস্ক্রিন থেকে সরাসরি বুকিং করুন" : "One-tap access from your home screen"}
            </p>
          </div>
        </div>

        {/* Direct Install Button if Browser Supported */}
        {canDirectInstall && onDirectInstall && (
          <div className="mb-4">
            <button
              onClick={() => {
                onDirectInstall();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === "bn" ? "সরাসরি ইনস্টল করুন (Install Now)" : "Install Now"}</span>
            </button>
          </div>
        )}

        {/* Platform Selection Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-4 text-xs font-bold">
          <button
            onClick={() => setPlatform("android")}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              platform === "android"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setPlatform("ios")}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              platform === "ios"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iOS</span>
          </button>

          <button
            onClick={() => setPlatform("desktop")}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              platform === "desktop"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC / Mac</span>
          </button>
        </div>

        {/* Step-by-step Guide */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
          {platform === "android" && (
            <>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ১
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span>{lang === "bn" ? "ব্রাউজারের ৩ ডট মেনু চাপুন" : "Tap browser menu"}</span>
                    <MoreVertical className="w-3.5 h-3.5 text-teal-600" />
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "bn" ? "Chrome বা অন্য ব্রাউজারের উপরে ডান কোণে থাকা ৩টি ডটে ক্লিক করুন।" : "Tap the three vertical dots in the top-right corner of Chrome."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ২
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span>{lang === "bn" ? "'Install app' বা 'Add to Home screen' বেছে নিন" : "Select 'Install app' or 'Add to Home screen'"}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "bn" ? "মেনু থেকে ইনস্টল অপশনটিতে ট্যাপ করুন।" : "Tap on 'Install app' from the dropdown menu."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ৩
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === "bn" ? "'Install' চাপলেই অ্যাপ প্রস্তুত!" : "Tap 'Install' to finish!"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "bn" ? "আপনার মোবাইলের হোমস্ক্রিনে অ্যাপ আইকন চলে আসবে।" : "The app icon will immediately appear on your mobile home screen."}
                  </p>
                </div>
              </div>
            </>
          )}

          {platform === "ios" && (
            <>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ১
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span>{lang === "bn" ? "সাফারির Share বাটনে চাপুন" : "Tap Safari Share button"}</span>
                    <Share className="w-3.5 h-3.5 text-blue-500" />
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "bn" ? "সাফারি ব্রাউজারের নিচে থাকা শেয়ার আইকনে ক্লিক করুন।" : "Tap the Share icon (square with upward arrow) at the bottom."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ২
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span>{lang === "bn" ? "'Add to Home Screen' বেছে নিন" : "Select 'Add to Home Screen'"}</span>
                    <PlusSquare className="w-3.5 h-3.5 text-teal-600" />
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "bn" ? "নিচে স্ক্রল করে 'Add to Home Screen' অপশনে ট্যাপ করুন।" : "Scroll down and select 'Add to Home Screen'."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ৩
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === "bn" ? "উপরে 'Add' এ ট্যাপ করুন" : "Tap 'Add' on top-right"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "bn" ? "আইফোনের স্ক্রিনে অ্যাপ হিসেবে যুক্ত হয়ে যাবে।" : "AmarSalon will appear as a native app on your iPhone screen."}
                  </p>
                </div>
              </div>
            </>
          )}

          {platform === "desktop" && (
            <>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ১
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === "bn" ? "অ্যাড্রেস বারের Install আইকন দেখুন" : "Look at the address bar install icon"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "bn" ? "Chrome/Edge এর অ্যাড্রেস বারের ডানে থাকা কম্পিউটার বা প্লাস (⊕) আইকনে ক্লিক করুন।" : "Click the computer or plus (⊕) install icon on the right side of the URL bar."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ২
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === "bn" ? "'Install' এ ক্লিক করলেই অ্যাপ ওপেন হবে" : "Click 'Install' to launch as standalone desktop app"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "bn" ? "উইন্ডোজ বা ম্যাক ডেস্কে সম্পূর্ণ আলাদা অ্যাপ হিসেবে চলবে।" : "Runs in its own window without browser tabs."}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dismiss Button */}
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            {lang === "bn" ? "বুঝেছি, বন্ধ করুন" : "Got It"}
          </button>
        </div>
      </div>
    </div>
  );
}
