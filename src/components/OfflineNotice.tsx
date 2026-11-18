"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function OfflineNotice() {
  const [isOnline, setIsOnline] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const { lang } = useApp();

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 bg-amber-600 text-white px-3.5 py-2 shadow-md flex items-center justify-between text-xs animate-in slide-in-from-top duration-300"
    >
      <div className="flex items-center gap-2 overflow-hidden mr-2">
        <WifiOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
        <p className="font-medium text-[11px] leading-tight truncate">
          {lang === "bn"
            ? "⚠️ আপনি অফলাইনে আছেন। সেলুন হিসাব খাতা অফলাইনে ব্যবহারযোগ্য; তবে লাইভ সিরিয়ালের জন্য ইন্টারনেট প্রয়োজন।"
            : "⚠️ You are offline. Ledger is available offline; live queue requires internet."}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => {
            if (navigator.onLine) {
              setIsOnline(true);
            } else {
              window.location.reload();
            }
          }}
          className="p-1 rounded-full hover:bg-amber-700 active:scale-95 transition cursor-pointer"
          title={lang === "bn" ? "পুনরায় চেষ্টা করুন" : "Retry"}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-[10px] bg-amber-700/80 hover:bg-amber-800 px-2 py-0.5 rounded-full font-bold transition cursor-pointer"
        >
          {lang === "bn" ? "ঠিক আছে" : "OK"}
        </button>
      </div>
    </div>
  );
}
