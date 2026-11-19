"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Home,
  Clock,
  Heart,
  Users,
  Receipt,
  Scissors,
  QrCode,
  LayoutGrid,
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
    { href: "/bookings", label: t.navBookings, icon: Clock },
    { href: "/my-saloons", label: t.navFavorites, icon: Heart },
    { href: "/more", label: t.navMore, icon: LayoutGrid },
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
        <div className="w-full max-w-[480px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] px-2 pt-1 pb-1 safe-bottom-nav flex items-center justify-around pointer-events-auto transition-colors">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/" && pathname.startsWith(tab.href));

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-0.5 px-2.5 rounded-xl transition-all cursor-pointer ${isActive
                    ? "text-teal-600 dark:text-teal-400 font-bold scale-105"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div
                  className={`w-9 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? "bg-teal-50 dark:bg-teal-950/60" : "bg-transparent"
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
