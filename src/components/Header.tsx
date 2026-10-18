"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Scissors, Globe, User, LogOut, ChevronDown, Store, Shield } from "lucide-react";

interface SalonOption {
  id: string;
  nameBn: string;
  nameEn: string;
  slug: string;
}

export default function Header() {
  const { lang, setLang, t, user, logout, activeSalonId, setActiveSalonId } = useApp();
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
        .catch(() => {});
    }
  }, [user, activeSalonId, setActiveSalonId]);

  const activeSalon = ownerSalons.find((s) => s.id === activeSalonId) || ownerSalons[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 transition-all">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={user?.role === "OWNER" ? "/owner/dashboard" : "/"} className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#115E59] flex items-center justify-center text-white shadow-sm shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 text-amber-300 transform -rotate-45" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-[#0F172A] flex items-center gap-1.5">
              <span>{lang === "bn" ? t.appName : t.appNameEn}</span>
              {user?.role === "OWNER" && (
                <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full border border-purple-200">
                  {lang === "bn" ? "পার্টনার" : "Partner"}
                </span>
              )}
              {user?.role === "ADMIN" && (
                <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" />
                  Admin
                </span>
              )}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium leading-none">
              {lang === "bn" ? "স্মার্ট সেলুন ও সিরিয়াল" : "Smart Salon Booking"}
            </p>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>{t.languageToggle}</span>
          </button>

          {/* User Account / Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs flex items-center justify-center hover:bg-teal-100 transition cursor-pointer"
                title={user.name || user.phone}
              >
                {user.name ? user.name.slice(0, 1).toUpperCase() : <User className="w-4 h-4" />}
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{user.name || "User"}</p>
                      <p className="text-slate-500 text-[11px] font-mono">{user.phone}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md font-semibold bg-teal-50 text-teal-700">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      {user.role === "OWNER" && (
                        <Link
                          href="/owner/dashboard"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-slate-700"
                        >
                          <Store className="w-3.5 h-3.5 text-teal-600" />
                          <span>{lang === "bn" ? "মালিকের ড্যাশবোর্ড" : "Owner Dashboard"}</span>
                        </Link>
                      )}
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-slate-700"
                        >
                          <Shield className="w-3.5 h-3.5 text-rose-600" />
                          <span>{lang === "bn" ? "এডমিন প্যানেল" : "Admin Panel"}</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.logout}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold bg-[#0D9488] hover:bg-[#115E59] active:scale-95 text-white px-3 py-1.5 rounded-full shadow-sm transition"
            >
              {t.login}
            </Link>
          )}
        </div>
      </div>

      {/* Owner Branch Switcher (If owner has multiple salons and is on /owner/* routes) */}
      {user?.role === "OWNER" && ownerSalons.length > 0 && pathname.startsWith("/owner") && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Store className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-medium">{t.switchBranch}:</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-1.5 font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              <span className="truncate max-w-[170px]">
                {activeSalon ? (lang === "bn" ? activeSalon.nameBn : activeSalon.nameEn) : t.loading}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
            </button>

            {showBranchMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBranchMenu(false)} />
                <div className="absolute right-0 mt-1 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50">
                  <p className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {lang === "bn" ? "আপনার সকল শাখা" : "Your Branches"}
                  </p>
                  {ownerSalons.map((salon) => (
                    <button
                      key={salon.id}
                      onClick={() => {
                        setActiveSalonId(salon.id);
                        setShowBranchMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                        salon.id === activeSalonId
                          ? "bg-teal-50 text-teal-900 font-bold border border-teal-200"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="truncate">{lang === "bn" ? salon.nameBn : salon.nameEn}</span>
                      {salon.id === activeSalonId && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                    </button>
                  ))}
                  <div className="mt-1 pt-1 border-t border-slate-100">
                    <Link
                      href="/owner/profile?tab=new"
                      onClick={() => setShowBranchMenu(false)}
                      className="block text-center p-1.5 rounded-lg text-xs font-semibold text-teal-600 hover:bg-teal-50"
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
