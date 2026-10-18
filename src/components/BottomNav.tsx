"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Home,
  Search,
  Clock,
  Heart,
  Users,
  Receipt,
  Scissors,
  QrCode,
  ShieldAlert,
} from "lucide-react";

export default function BottomNav() {
  const { lang, t, user } = useApp();
  const pathname = usePathname();

  // If in admin route or salon detail page, hide the mobile customer/owner bottom nav
  if (pathname.startsWith("/admin") || pathname.startsWith("/s/")) {
    return null;
  }

  const isOwner = user?.role === "OWNER" && pathname.startsWith("/owner");

  const customerTabs = [
    { href: "/", label: t.navHome, icon: Home },
    { href: "/search", label: t.navSearch, icon: Search },
    { href: "/bookings", label: t.navBookings, icon: Clock },
    { href: "/my-saloons", label: t.navFavorites, icon: Heart },
  ];

  const ownerTabs = [
    { href: "/owner/dashboard", label: t.navQueue, icon: Users },
    { href: "/owner/ledger", label: t.navLedger, icon: Receipt },
    { href: "/owner/services", label: t.navServices, icon: Scissors },
    { href: "/owner/profile", label: t.navProfile, icon: QrCode },
  ];

  const tabs = isOwner ? ownerTabs : customerTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none no-print">
      <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around pointer-events-auto transition-all">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-[#0D9488] font-bold scale-105"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <div
                className={`w-9 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive ? "bg-teal-50" : "bg-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              </div>
              <span className="text-[11px] leading-tight tracking-tight mt-0.5 truncate max-w-[75px]">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
