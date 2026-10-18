"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Download, X } from "lucide-react";

export default function InstallBanner() {
  const { showInstallBanner, promptPwaInstall, dismissInstallBanner, t, lang } = useApp();

  if (!showInstallBanner) return null;

  return (
    <aside aria-label="PWA Installation" className="sticky top-0 z-50 bg-[#0F534F] text-white px-3 py-2 flex items-center justify-between shadow-md transition-all">
      <div className="flex items-center gap-2 overflow-hidden mr-2">
        <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0 border border-teal-400/30">
          <Download className="w-4 h-4 text-amber-300 animate-bounce" />
        </div>
        <div className="text-xs truncate">
          <p className="font-semibold text-white tracking-wide">{t.installBanner}</p>
          <p className="text-[10px] text-teal-200/90 truncate">{t.installBannerSub}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={promptPwaInstall}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-full shadow transition cursor-pointer"
        >
          {t.installBtn}
        </button>
        <button
          onClick={dismissInstallBanner}
          className="text-teal-300 hover:text-white p-1 rounded-full cursor-pointer transition"
          aria-label={lang === "bn" ? "ব্যানার বন্ধ করুন" : "Dismiss install banner"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
