"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Bell, CheckCircle2, ChevronRight, X, Sparkles } from "lucide-react";

export default function GlobalNotificationToast() {
  const { notificationToast, dismissNotificationToast, lang } = useApp();

  if (!notificationToast) return null;

  const isUserTurn = notificationToast.type === "USER_TURN_READY";
  const isOwnerAlert = notificationToast.type === "OWNER_NEW_BOOKING";

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[440px] animate-in slide-in-from-top-4 fade-in duration-200">
      <div
        className={`rounded-2xl p-3.5 shadow-2xl border backdrop-blur-md flex items-start gap-3 relative transition-all ${
          isUserTurn
            ? "bg-gradient-to-r from-emerald-900 to-teal-900 text-white border-emerald-400/50 shadow-emerald-900/30 ring-2 ring-emerald-400/30"
            : isOwnerAlert
            ? "bg-gradient-to-r from-amber-950 to-slate-900 text-white border-amber-400/50 shadow-amber-950/30 ring-2 ring-amber-400/30"
            : "bg-slate-900/95 text-white border-slate-700 shadow-slate-900/40"
        }`}
      >
        {/* Pulsing Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isUserTurn
              ? "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/50 animate-bounce"
              : isOwnerAlert
              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50 animate-pulse"
              : "bg-teal-500 text-white"
          }`}
        >
          {isUserTurn ? (
            <Sparkles className="w-5 h-5 fill-slate-950" />
          ) : (
            <Bell className="w-5 h-5 fill-slate-950" />
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-5">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-sm leading-tight text-white drop-shadow-xs">
              {notificationToast.title}
            </h4>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          </div>

          <p className="text-xs text-slate-200 mt-1 leading-snug">
            {notificationToast.message}
          </p>

          {notificationToast.url && (
            <div className="mt-2.5">
              <Link
                href={notificationToast.url}
                onClick={dismissNotificationToast}
                className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer ${
                  isUserTurn
                    ? "bg-emerald-400 hover:bg-emerald-300 text-slate-950"
                    : isOwnerAlert
                    ? "bg-amber-400 hover:bg-amber-300 text-slate-950"
                    : "bg-white hover:bg-slate-100 text-slate-900"
                }`}
              >
                <span>
                  {isUserTurn
                    ? lang === "bn"
                      ? "সিরিয়াল দেখুন"
                      : "View Your Turn"
                    : lang === "bn"
                    ? "ড্যাশবোর্ডে দেখুন"
                    : "View Dashboard"}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={dismissNotificationToast}
          className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
