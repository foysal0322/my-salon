"use client";

import React from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Store,
  User,
  Moon,
  Sun,
  Globe,
  Bell,
  Download,
  LogOut,
  ChevronRight,
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
    isNativeApp,
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
              ? "অ্যাপ সেটিংস ও অন্যান্য সুবিধা"
              : "App settings and preferences"}
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

            {/* Native App Status Card or PWA Install Option */ }
          {isNativeApp ? (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-teal-200 dark:border-teal-800/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {lang === "bn" ? "অ্যান্ড্রয়েড অ্যাপ সংস্করণ ১.০" : "AmarSalon Android App v1.0"}
                  </span>
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold block">
                    {lang === "bn" ? "অফিসিয়াল অ্যাপ ইনস্টল করা আছে" : "Official native app installed"}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                PROD
              </span>
            </div>
          ) : !isPwaInstalled ? (
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
          ) : null}
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

        {/* Simple Salon Owner Action Button (Bottom of page) */}
        <div className="pt-2">
          {user?.role === "OWNER" ? (
            <Link
              href="/owner/dashboard"
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition active:scale-[0.99] shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">
                    {lang === "bn" ? "সেলুন মালিকের ড্যাশবোর্ড" : "Salon Owner Dashboard"}
                  </span>
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 block">
                    {lang === "bn" ? "সিরিয়াল ও কিউ কন্ট্রোল প্যানেল" : "Live queue & serial controller"}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-xs transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {lang === "bn" ? "সেলুন মালিক লগইন / সাইন-আপ" : "Salon Owner Login / Sign Up"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {lang === "bn" ? "আপনার সেলুন যুক্ত বা পরিচালনা করুন" : "Register or manage your salon"}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          )}
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
