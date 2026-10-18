"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Search,
  MapPin,
  Heart,
  Wind,
  Armchair,
  Clock,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Navigation,
} from "lucide-react";

interface SalonItem {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  category: "GENTS" | "LADIES" | "UNISEX";
  isAc: boolean;
  address: string;
  phone: string;
  totalChairs: number;
  busyChairs: number;
  freeChairs: number;
  currentServingToken: number;
  totalQueue: number;
  estWaitMins: number;
  distanceKm: number;
  coverImage?: string;
  services: Array<{ id: string; nameBn: string; price: number }>;
}

export default function HomePage() {
  const { lang, t, favorites, toggleFavorite, triggerHaptic } = useApp();

  const [saloons, setSaloons] = useState<SalonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [acFilter, setAcFilter] = useState<string>("ALL");
  const [freeChairsFilter, setFreeChairsFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Request GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    triggerHaptic(30);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        console.warn("Location error:", err);
        setLocating(false);
        // Fallback to Dhaka central coordinates
        setUserLocation({ lat: 23.7461, lng: 90.3742 });
      },
      { timeout: 7000 }
    );
  };

  const fetchSaloons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (acFilter === "AC") params.append("isAc", "true");
      if (acFilter === "NON_AC") params.append("isAc", "false");
      if (freeChairsFilter) params.append("freeChairs", "true");
      if (searchQuery) params.append("search", searchQuery);
      if (userLocation) {
        params.append("lat", userLocation.lat.toString());
        params.append("lng", userLocation.lng.toString());
      }

      const res = await fetch(`/api/v1/saloons?${params.toString()}`);
      const data = await res.json();
      if (data.saloons) {
        setSaloons(data.saloons);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaloons();
  }, [categoryFilter, acFilter, freeChairsFilter, userLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSaloons();
  };

  return (
    <AppShell>
      {/* Search Header Banner */}
      <section className="bg-gradient-to-b from-white to-slate-50 px-4 pt-3 pb-4 border-b border-slate-200/70">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              {lang === "bn" ? "কাছের সেলুন খুঁজুন" : "Find Salons Near You"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {lang === "bn" ? "চেয়ারের অবস্থা দেখে লাইভ সিরিয়াল নিন" : "Real-time chairs & online tokens"}
            </p>
          </div>

          <button
            onClick={handleGetLocation}
            disabled={locating}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Navigation className={`w-3.5 h-3.5 text-teal-600 ${locating ? "animate-spin" : ""}`} />
            <span>{locating ? (lang === "bn" ? "খোঁজা হচ্ছে..." : "Locating...") : t.nearMe}</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setTimeout(fetchSaloons, 50);
              }}
              className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </form>

        {/* Quick Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
          {/* Categories */}
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition cursor-pointer ${
              categoryFilter === "ALL"
                ? "bg-[#0D9488] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {lang === "bn" ? "সকল" : "All"}
          </button>
          <button
            onClick={() => setCategoryFilter("GENTS")}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition cursor-pointer ${
              categoryFilter === "GENTS"
                ? "bg-[#0D9488] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {t.gents}
          </button>
          <button
            onClick={() => setCategoryFilter("LADIES")}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition cursor-pointer ${
              categoryFilter === "LADIES"
                ? "bg-[#0D9488] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {t.ladies}
          </button>
          <button
            onClick={() => setCategoryFilter("UNISEX")}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition cursor-pointer ${
              categoryFilter === "UNISEX"
                ? "bg-[#0D9488] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {t.unisex}
          </button>

          {/* AC Toggle */}
          <button
            onClick={() => setAcFilter(acFilter === "AC" ? "ALL" : "AC")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold shrink-0 transition cursor-pointer ${
              acFilter === "AC"
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{t.acOnly}</span>
          </button>

          {/* Free Chairs Toggle */}
          <button
            onClick={() => setFreeChairsFilter(!freeChairsFilter)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold shrink-0 transition cursor-pointer ${
              freeChairsFilter
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>{t.freeChairsNow}</span>
          </button>
        </div>
      </section>

      {/* Salons Feed */}
      <section className="px-4 py-3 flex-1 flex flex-col gap-3">
        {loading ? (
          // Skeleton Loading
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs animate-pulse">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                  <div className="h-6 bg-slate-200 rounded-lg w-1/3 mt-2" />
                </div>
              </div>
            </div>
          ))
        ) : saloons.length === 0 ? (
          // Empty State
          <div className="py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">{t.noSalonsFound}</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
              {lang === "bn"
                ? "অন্য কোন এলাকা বা ফিল্টার নির্বাচন করে পুনরায় চেষ্টা করুন।"
                : "Try clearing filters or searching for another area or service."}
            </p>
            <button
              onClick={() => {
                setCategoryFilter("ALL");
                setAcFilter("ALL");
                setFreeChairsFilter(false);
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full border border-teal-200 transition"
            >
              {lang === "bn" ? "সব ফিল্টার মুছুন" : "Reset Filters"}
            </button>
          </div>
        ) : (
          // Salon Cards
          saloons.map((salon) => {
            const isFav = favorites.includes(salon.id);
            const hasFreeChairs = salon.freeChairs > 0;

            return (
              <div
                key={salon.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all group relative"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <Link href={`/s/${salon.slug}`} className="relative w-22 h-22 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={
                        salon.coverImage ||
                        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=60"
                      }
                      alt={salon.nameBn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {salon.isAc && (
                      <span className="absolute top-1 left-1 text-[9px] font-bold bg-teal-900/85 backdrop-blur-xs text-white px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Wind className="w-2.5 h-2.5" />
                        AC
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <Link href={`/s/${salon.slug}`} className="min-w-0">
                          <h3 className="font-bold text-[15px] leading-snug text-slate-900 group-hover:text-teal-700 transition truncate">
                            {lang === "bn" ? salon.nameBn : salon.nameEn}
                          </h3>
                        </Link>
                        {/* Favorite Button */}
                        <button
                          onClick={() => {
                            triggerHaptic(25);
                            toggleFavorite(salon.id);
                          }}
                          className={`p-1.5 rounded-full transition cursor-pointer shrink-0 ${
                            isFav ? "text-rose-500 bg-rose-50" : "text-slate-300 hover:text-slate-500"
                          }`}
                          title="Save to My Saloons"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500" : ""}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{salon.address}</span>
                      </div>
                    </div>

                    {/* Live Chair Status Pill & Wait Time */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {hasFreeChairs ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>
                            {salon.freeChairs} {t.chairsAvailable}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>{t.allChairsBusy}</span>
                        </span>
                      )}

                      {salon.totalQueue > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>
                            {salon.totalQueue} {t.queueWaiting} (~{salon.estWaitMins} {t.minutes})
                          </span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {lang === "bn" ? "কোন ওয়েটিং নেই" : "No queue"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Popular Services Snippet & CTA */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 truncate">
                    {salon.services.length > 0 ? (
                      <span>
                        {salon.services
                          .slice(0, 2)
                          .map((s) => `${s.nameBn} (৳${s.price})`)
                          .join(" • ")}
                      </span>
                    ) : (
                      <span>{t.tagline}</span>
                    )}
                  </div>

                  <Link
                    href={`/s/${salon.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-slate-950 px-3 py-1.5 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                  >
                    <span>{t.joinLiveQueue}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
