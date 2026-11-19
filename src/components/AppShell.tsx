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
  const {
    isInstallModalOpen,
    setIsInstallModalOpen,
    lang,
    promptPwaInstall,
    canInstallPwa,
    appUpdateAvailable,
    dismissAppUpdate,
  } = useApp();

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
        <div className="w-full max-w-[480px] min-h-dvh bg-[#FAF9F6] dark:bg-slate-900 shadow-2xl relative flex flex-col border-x border-slate-200/80 dark:border-slate-800 safe-shell-bottom overflow-x-hidden text-slate-900 dark:text-slate-100 transition-colors">
          {appUpdateAvailable && (
            <aside
              aria-label="App Update Notification"
              className="sticky top-0 z-50 bg-amber-400 dark:bg-amber-500 text-slate-950 px-3.5 py-2 flex items-center justify-between shadow-md text-xs font-bold"
            >
              <div className="flex items-center gap-2 min-w-0 mr-2">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping shrink-0" />
                <span className="truncate">
                  {lang === "bn"
                    ? `নতুন অ্যাপ সংস্করণ (${appUpdateAvailable.version}) উপলব্ধ!`
                    : `New version (${appUpdateAvailable.version}) available!`}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={appUpdateAvailable.downloadUrl || "/AmarSalon.apk"}
                  download="AmarSalon.apk"
                  className="bg-slate-950 hover:bg-slate-900 active:scale-95 text-amber-300 px-3 py-1 rounded-full text-[11px] font-extrabold transition shadow-xs"
                >
                  {lang === "bn" ? "ডাউনলোড" : "Download"}
                </a>
                <button
                  onClick={dismissAppUpdate}
                  className="text-slate-950 hover:text-slate-800 p-0.5 cursor-pointer font-bold"
                  aria-label="Dismiss update"
                >
                  ✕
                </button>
              </div>
            </aside>
          )}
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
