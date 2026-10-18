"use client";

import React from "react";
import { usePathname } from "next/navigation";
import InstallBanner from "@/components/InstallBanner";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    // Admin widescreen layout
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        {children}
      </div>
    );
  }

  // Mobile-First Shell
  return (
    <div className="min-h-dvh bg-slate-200/50 flex justify-center selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-[480px] min-h-dvh bg-[#FAF9F6] shadow-2xl relative flex flex-col border-x border-slate-200/80 pb-20 overflow-x-hidden">
        <InstallBanner />
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
