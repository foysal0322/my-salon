"use client";

import React from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Store,
  User,
  Shield,
  Moon,
  Sun,
  Globe,
  Bell,
  Download,
  LogOut,
  ChevronRight,
  Receipt,
  Scissors,
  QrCode,
  Sparkles,
  HelpCircle,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

export default function MorePage() {
  const {
    lang,
    setLang,
    t,
    user,
    logout,
    theme,
    toggleTheme,
    notificationsEnabled,
    requestNotifications,
    showNotificationToast,
    canInstallPwa,
    promptPwaInstall,
    isPwaInstalled,
  } = useApp();

  return (
    <AppShell>
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Page Title */}
        <div className="pb-1">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {lang === "bn" ? "আরও অপশন" : "More Options"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === "bn"
              ? "সেলুন মালিকের পোর্টাল, সেটিংস ও অন্যান্য সুবিধা"
              : "Salon Owner Portal, settings and quick tools"}
          </p>
        </div>

        {/* User Card if Logged In */}
        {user ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {user.name ? user.name.slice(0, 1).toUpperCase() : <User className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user.name || (lang === "bn" ? "সম্মানিত ব্যবহারকারী" : "User")}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                  {user.phone}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer shrink-0"
              title={lang === "bn" ? "লগআউট" : "Log Out"}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : null}

        {/* ========================================================= */}
        {/* FEATURE: LOGIN AS SALON OWNER */}
        {/* ========================================================= */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden border border-teal-600/30">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-xl bg-teal-500/30 text-amber-300 border border-teal-400/40">
                <Store className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                {lang === "bn" ? "সেলুন মালিকদের জন্য" : "For Salon Owners"}
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-white tracking-tight leading-tight mb-1">
              {lang === "bn"
                ? "সেলুন মালিক হিসেবে লগইন ও কন্ট্রোল"
                : "Salon Owner Login & Controls"}
            </h3>
            <p className="text-xs text-teal-100/90 leading-relaxed mb-4">
              {lang === "bn"
                ? "আপনার সেলুনের লাইভ সিরিয়াল, চেয়ার খালি/ব্যস্ত অবস্থা, দৈনিক আয়-ব্যয়ের খাতা ও কিউআর পোস্টার পরিচালনা করুন।"
                : "Manage live queue, chair status, daily revenue ledger, and printable QR posters with ease."}
            </p>

            {user?.role === "OWNER" ? (
              <div className="space-y-2">
                <Link
                  href="/owner/dashboard"
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white text-teal-900 font-bold text-xs hover:bg-teal-50 shadow-md transition active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-teal-600" />
                    {lang === "bn" ? "মালিকের ড্যাশবোর্ডে প্রবেশ করুন" : "Open Owner Dashboard"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-teal-700" />
                </Link>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <Link
                    href="/owner/ledger"
                    className="p-2 rounded-xl bg-teal-900/60 hover:bg-teal-900/90 border border-teal-600/30 text-center transition"
                  >
                    <Receipt className="w-4 h-4 mx-auto text-teal-300 mb-1" />
                    <span className="text-[10px] font-semibold block truncate">
                      {lang === "bn" ? "হিসাব খাতা" : "Ledger"}
                    </span>
                  </Link>
                  <Link
                    href="/owner/services"
                    className="p-2 rounded-xl bg-teal-900/60 hover:bg-teal-900/90 border border-teal-600/30 text-center transition"
                  >
                    <Scissors className="w-4 h-4 mx-auto text-amber-300 mb-1" />
                    <span className="text-[10px] font-semibold block truncate">
                      {lang === "bn" ? "সার্ভিস" : "Services"}
                    </span>
                  </Link>
                  <Link
                    href="/owner/profile"
                    className="p-2 rounded-xl bg-teal-900/60 hover:bg-teal-900/90 border border-teal-600/30 text-center transition"
                  >
                    <QrCode className="w-4 h-4 mx-auto text-emerald-300 mb-1" />
                    <span className="text-[10px] font-semibold block truncate">
                      {lang === "bn" ? "QR পোস্টার" : "QR Poster"}
                    </span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/login"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg transition active:scale-[0.98]"
                >
                  <Store className="w-4 h-4" />
                  <span>
                    {lang === "bn"
                      ? "সেলুন মালিক লগইন / সাইন-আপ"
                      : "Login as Salon Owner"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* App Settings Section */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1 mb-2">
            {lang === "bn" ? "অ্যাপ সেটিংস" : "App Settings"}
          </h3>

          {/* Dark / Light Mode Switcher Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {lang === "bn" ? "থিম মোড (ডার্ক / লাইট)" : "Theme Mode (Dark / Light)"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {theme === "dark"
                    ? lang === "bn"
                      ? "বর্তমানে ডার্ক মোড সক্রিয়"
                      : "Dark mode active"
                    : lang === "bn"
                      ? "বর্তমানে লাইট মোড সক্রিয়"
                      : "Light mode active"}
                </span>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition cursor-pointer"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "bn" ? "লাইট" : "Light"}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>{lang === "bn" ? "ডার্ক" : "Dark"}</span>
                </>
              )}
            </button>
          </div>

          {/* Language Switcher Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {lang === "bn" ? "ভাষা পরিবর্তন" : "Language"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {lang === "bn" ? "বাংলা (বর্তমান)" : "English (Current)"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition cursor-pointer"
            >
              {lang === "bn" ? "Switch to English" : "বাংলা করুন"}
            </button>
          </div>

          {/* Push Notifications Toggle */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {lang === "bn" ? "লাইভ সিরিয়াল নোটিফিকেশন" : "Live Queue Alerts"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {notificationsEnabled
                      ? lang === "bn"
                        ? "নোটিফিকেশন সক্রিয় আছে"
                        : "Push alerts active"
                      : lang === "bn"
                        ? "সিরিয়াল এলে ফোনে বার্তা পান"
                        : "Get notified when your turn arrives"}
                  </span>
                </div>
              </div>
              {notificationsEnabled ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  {lang === "bn" ? "সক্রিয়" : "Active"}
                </span>
              ) : (
                <button
                  onClick={async () => {
                    const granted = await requestNotifications();
                    if (granted) {
                      showNotificationToast({
                        title: lang === "bn" ? "🔔 নোটিফিকেশন চালু হয়েছে" : "🔔 Alerts Enabled",
                        message: lang === "bn" ? "আপনার ডিভাইসে নোটিফিকেশন সফলভাবে যুক্ত হয়েছে।" : "Live notifications enabled.",
                        type: "INFO",
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition cursor-pointer"
                >
                  {lang === "bn" ? "চালু করুন" : "Enable"}
                </button>
              )}
            </div>

            {/* Install PWA Banner (If supported and not yet installed) */}
            {!isPwaInstalled && (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {lang === "bn" ? "অ্যাপ ইনস্টল করুন" : "Install App"}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {lang === "bn" ? "হোমস্ক্রিন থেকে এক ক্লিকে বুকিং" : "One-click access from home screen"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={promptPwaInstall}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                >
                  {lang === "bn" ? "ইনস্টল" : "Install"}
                </button>
              </div>
            )}
          </div>

          {/* Support Section */}
          <div className="space-y-1 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1 mb-2">
              {lang === "bn" ? "গ্রাহক সহায়তা" : "Customer Support"}
            </h3>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {lang === "bn" ? "গ্রাহক সেবা ও সহায়তা" : "Help & Support"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    +880 1711-223344 (২৪/৭ হেল্পলাইন)
                  </span>
                </div>
              </div>
              <a
                href="tel:+8801711223344"
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
              >
                {lang === "bn" ? "কল দিন" : "Call"}
              </a>
            </div>
          </div>

          {/* Footer info */}
          <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600 dark:text-slate-400">
              {lang === "bn" ? "আমার সেলুন (AmarSalon) v2.5" : "AmarSalon Platform v2.5"}
            </p>
            <p className="text-[11px]">
              {lang === "bn"
                ? "© ২০২৬ আমার সেলুন। সর্বস্বত্ব সংরক্ষিত।"
                : "© 2026 AmarSalon. All rights reserved."}
            </p>
          </div>
        </div>
    </AppShell>
  );
}
