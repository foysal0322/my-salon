"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import { Heart, MapPin, ChevronRight, Wind, Armchair, Clock } from "lucide-react";

export default function MySaloonsPage() {
  const { lang, t, favorites, toggleFavorite, triggerHaptic } = useApp();
  const [saloons, setSaloons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/saloons");
        const data = await res.json();
        if (data.saloons) {
          // Filter to only favorite salons
          const favs = data.saloons.filter((s: any) => favorites.includes(s.id));
          setSaloons(favs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, [favorites]);

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span>{t.navFavorites}</span>
          </h1>
          <p className="text-xs text-slate-500">
            {lang === "bn"
              ? "আপনার নিয়মিত সেলুনগুলো ১-ট্যাপে রি-বুকিং করুন"
              : "Quick 1-tap rebooking for your frequent salons"}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-28 bg-slate-200 rounded-2xl" />
            <div className="h-28 bg-slate-200 rounded-2xl" />
          </div>
        ) : saloons.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center shadow-xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {lang === "bn" ? "কোন প্রিয় সেলুন যুক্ত নেই" : "No Favorite Salons Saved"}
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
              {lang === "bn"
                ? "যেকোন সেলুনের প্রোফাইলে থাকা হার্ট (Heart) আইকনে ক্লিক করে প্রিয় তালিকায় রাখুন।"
                : "Tap the Heart icon on any salon profile to save it here for instant access."}
            </p>
            <Link
              href="/"
              className="inline-block text-xs font-bold bg-[#0D9488] text-white px-5 py-2.5 rounded-full shadow-sm hover:bg-[#115E59] transition"
            >
              {lang === "bn" ? "সেলুন আবিষ্কার করুন" : "Discover Salons"}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {saloons.map((salon) => (
              <div
                key={salon.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative"
              >
                <div className="flex gap-3">
                  <Link
                    href={`/s/${salon.slug}`}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0"
                  >
                    <img
                      src={
                        salon.coverImage ||
                        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=60"
                      }
                      alt={salon.nameBn}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <Link href={`/s/${salon.slug}`} className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 truncate">
                            {lang === "bn" ? salon.nameBn : salon.nameEn}
                          </h3>
                        </Link>
                        <button
                          onClick={() => {
                            triggerHaptic(20);
                            toggleFavorite(salon.id);
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Heart className="w-4 h-4 fill-rose-500" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{salon.address}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <Armchair className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {salon.freeChairs} {t.chairsAvailable}
                        </span>
                      </span>

                      <Link
                        href={`/s/${salon.slug}`}
                        className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-200 transition"
                      >
                        {t.joinLiveQueue}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
