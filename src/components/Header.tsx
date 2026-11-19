"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Scissors, Globe, User, LogOut, ChevronDown, Store, Shield, Bell, Sun, Moon } from "lucide-react";

interface SalonOption {
  id: string;
  nameBn: string;
  nameEn: string;
  slug: string;
}

export default function Header() {
  const {
    lang,
    setLang,
    t,
    user,
    logout,
    activeSalonId,
    setActiveSalonId,
    notificationsEnabled,
    requestNotifications,
    showNotificationToast,
    theme,
    toggleTheme,
  } = useApp();
  const pathname = usePathname();
  const [ownerSalons, setOwnerSalons] = useState<SalonOption[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  // If owner, fetch their salons for the branch switcher
  useEffect(() => {
    if (user?.role === "OWNER" && user.id) {
      fetch(`/api/v1/owner/saloons?ownerId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.saloons && data.saloons.length > 0) {
            setOwnerSalons(data.saloons);
            if (!activeSalonId) {
              setActiveSalonId(data.saloons[0].id);
            }
          }
        })
        .catch(() => { });
    }
  }, [user, activeSalonId, setActiveSalonId]);

  const activeSalon = ownerSalons.find((s) => s.id === activeSalonId) || ownerSalons[0];

  return (
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 safe-top-padding transition-colors">
        <div className="flex items-center justify-between gap-2 max-w-full">
          {/* Brand Logo */}
          <Link
            href={user?.role === "OWNER" ? "/owner/dashboard" : "/"}
            className="flex items-center gap-2 min-w-0 shrink group select-none"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform shrink-0 border border-teal-400/30">
              <Scissors className="w-4 h-4 text-amber-300 transform -rotate-45 drop-shadow-xs" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-[15px] sm:text-[17px] tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  {lang === "bn" ? t.appName : t.appNameEn}
                </span>
                {user?.role === "OWNER" && (
                  <span className="shrink-0 text-[9px] font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 uppercase tracking-wider">
                    {lang === "bn" ? "পার্টনার" : "Partner"}
                  </span>
                )}
                {user?.role === "ADMIN" && (
                  <span className="shrink-0 text-[9px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 flex items-center gap-0.5 uppercase tracking-wider">
                    <Shield className="w-2.5 h-2.5" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium leading-none mt-1 truncate whitespace-nowrap">
                {lang === "bn" ? "স্মার্ট সেলুন ও সিরিয়াল" : "Smart Salon Booking"}
              </p>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Dark Mode Switcher Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-full transition cursor-pointer border border-slate-200/90 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0 active:scale-95 shadow-2xs"
              title={
                theme === "dark"
                  ? lang === "bn"
                    ? "লাইট মোড চালু করুন"
                    : "Switch to Light Mode"
                  : lang === "bn"
                    ? "ডার্ক মোড চালু করুন"
                    : "Switch to Dark Mode"
              }
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in zoom-in-75 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 animate-in zoom-in-75 duration-200" />
              )}
            </button>

            {/* Notification Permission Bell */}
            <button
              onClick={async () => {
                const granted = await requestNotifications();
                if (granted) {
                  showNotificationToast({
                    title: lang === "bn" ? "🔔 লাইভ নোটিফিকেশন সক্রিয় হয়েছে" : "🔔 Live Alerts Enabled",
                    message:
                      lang === "bn"
                        ? "সিরিয়াল ও চেয়ারের লাইভ আপডেট এখন সরাসরি আপনার ডিভাইসে পাবেন।"
                        : "You will now receive live push alerts for queues and turns.",
                    type: "INFO",
                  });
                }
              }}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition cursor-pointer border shrink-0 active:scale-95 ${notificationsEnabled
                ? "bg-teal-50 dark:bg-teal-950/60 border-teal-200/80 dark:border-teal-800 text-teal-700 dark:text-teal-400 shadow-2xs"
                : "bg-slate-100/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                }`}
              title={
                notificationsEnabled
                  ? lang === "bn"
                    ? "লাইভ নোটিফিকেশন চালু আছে"
                    : "Live alerts are enabled"
                  : lang === "bn"
                    ? "নোটিফিকেশন চালু করুন"
                    : "Enable live alerts"
              }
              aria-label="Toggle notifications"
            >
              <Bell className={`w-3.5 h-3.5 ${notificationsEnabled ? "fill-teal-600 dark:fill-teal-400" : ""}`} />
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer border border-slate-200/80 dark:border-slate-700 shrink-0 whitespace-nowrap active:scale-95 shadow-2xs"
              title={lang === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
              aria-label="Toggle language"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="tracking-wide">{lang === "bn" ? "EN" : "বাং"}</span>
            </button>

            {/* User Account / Profile Menu (Only when logged in) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-teal-100 dark:ring-teal-900 hover:ring-teal-300 transition active:scale-95 shrink-0 cursor-pointer"
                  title={user.name || user.phone}
                  aria-label="User Profile"
                >
                  <User className="w-4.5 h-4.5" />
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-xs" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-700 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-2.5 border-b border-slate-100 dark:border-slate-700/80">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{user.name || "User"}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{user.phone}</p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                          {user.role}
                        </span>
                      </div>

                      <div className="py-1 space-y-0.5">
                        {user.role === "OWNER" && (
                          <Link
                            href="/owner/dashboard"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 transition active:scale-[0.98]"
                          >
                            <Store className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span className="font-medium">{lang === "bn" ? "মালিকের ড্যাশবোর্ড" : "Owner Dashboard"}</span>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer active:scale-[0.98]"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span className="font-medium">{t.logout}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Owner Branch Switcher (If owner has multiple salons and is on /owner/* routes) */}
        {user?.role === "OWNER" && ownerSalons.length > 0 && pathname.startsWith("/owner") && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Store className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="font-medium">{t.switchBranch}:</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800 px-3 py-1.5 rounded-xl transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <span className="truncate max-w-[160px] sm:max-w-[200px]">
                  {activeSalon ? (lang === "bn" ? activeSalon.nameBn : activeSalon.nameEn) : t.loading}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-teal-600 dark:text-teal-400 transition-transform duration-200 ${showBranchMenu ? "rotate-180" : ""}`} />
              </button>

              {showBranchMenu && (
                <>
                  <div className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-xs" onClick={() => setShowBranchMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 mb-1">
                      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                        {lang === "bn" ? "আপনার সকল শাখা" : "Your Branches"}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                        {ownerSalons.length}
                      </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                      {ownerSalons.map((salon) => (
                        <button
                          key={salon.id}
                          onClick={() => {
                            setActiveSalonId(salon.id);
                            setShowBranchMenu(false);
                          }}
                          className={`w-full text-left px-2.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition cursor-pointer active:scale-[0.98] ${salon.id === activeSalonId
                            ? "bg-teal-50 dark:bg-teal-950/80 text-teal-900 dark:text-teal-100 font-bold border border-teal-200 dark:border-teal-800 shadow-2xs"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-200"
                            }`}
                        >
                          <span className="truncate pr-2">{lang === "bn" ? salon.nameBn : salon.nameEn}</span>
                          {salon.id === activeSalonId && (
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-700/80">
                      <Link
                        href="/owner/new-salon"
                        onClick={() => setShowBranchMenu(false)}
                        className="flex items-center justify-center gap-1.5 text-center py-2 px-3 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/60 dark:border-teal-800/80 transition active:scale-95"
                      >
                        + {t.addNewSalon}
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      );
}
