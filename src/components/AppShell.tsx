"use client";

import React from "react";
import { usePathname } from "next/navigation";
import InstallBanner from "@/components/InstallBanner";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import GlobalNotificationToast from "@/components/GlobalNotificationToast";
import InstallGuideModal from "@/components/InstallGuideModal";
import OfflineNotice from "@/components/OfflineNotice";
import { useApp } from "@/context/AppContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const { isInstallModalOpen, setIsInstallModalOpen, lang, promptPwaInstall, canInstallPwa } = useApp();

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
  <div className="min-h-dvh bg-slate-200/50 dark:bg-slate-950 flex justify-center selection:bg-teal-500 selection:text-white transition-colors">
    <div className="w-full max-w-[480px] min-h-dvh bg-[#FAF9F6] dark:bg-slate-900 shadow-2xl relative flex flex-col border-x border-slate-200/80 dark:border-slate-800 pb-20 overflow-x-hidden text-slate-900 dark:text-slate-100 transition-colors">
      <OfflineNotice />
      <GlobalNotificationToast />
      <InstallBanner />
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <BottomNav />
      <InstallGuideModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        lang={lang}
        onDirectInstall={promptPwaInstall}
        canDirectInstall={canInstallPwa}
      />
    </div>
  </div>
  );
}
