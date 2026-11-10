"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import { SalonItem } from "@/lib/getInitialSaloons";
import {
  Search,
  MapPin,
  Heart,
  Wind,
  Clock,
  ChevronRight,
  Navigation,
  Check,
  CreditCard,
  Zap,
  SlidersHorizontal,
  RotateCcw,
  Store,
  Users,
} from "lucide-react";

export default function HomePageClient({
  initialSaloons = [],
}: {
  initialSaloons?: SalonItem[];
}) {
  const { lang, t, user, activeSalonId, favorites, toggleFavorite, triggerHaptic } = useApp();
  const isOwner = user?.role === "OWNER";

  const [saloons, setSaloons] = useState<SalonItem[]>(initialSaloons);
  const [loading, setLoading] = useState(initialSaloons.length === 0);

  // Multi-select filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isAcFilter, setIsAcFilter] = useState<boolean>(false);
  const [digitalPayFilter, setDigitalPayFilter] = useState<boolean>(false);
  const [zeroQueueFilter, setZeroQueueFilter] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

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

  const toggleCategory = (cat: "GENTS" | "LADIES" | "UNISEX") => {
    triggerHaptic(20);
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearAllFilters = () => {
    triggerHaptic(30);
    setSelectedCategories([]);
    setIsAcFilter(false);
    setDigitalPayFilter(false);
    setZeroQueueFilter(false);
    setSearchQuery("");
  };

  const activeFilterCount =
    selectedCategories.length +
    (isAcFilter ? 1 : 0) +
    (digitalPayFilter ? 1 : 0) +
    (zeroQueueFilter ? 1 : 0);

  const fetchSaloons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategories.length > 0) {
        params.append("category", selectedCategories.join(","));
      }
      if (isAcFilter) params.append("isAc", "true");
      if (digitalPayFilter) params.append("digitalPayment", "true");
      if (zeroQueueFilter) params.append("zeroQueue", "true");
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
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
    if (!hasMounted) {
      setHasMounted(true);
      // If we don't have initial data, fetch immediately
      if (initialSaloons.length === 0) {
        fetchSaloons();
      }
      return;
    }

    const timer = setTimeout(() => {
      fetchSaloons();
    }, 250);

    return () => clearTimeout(timer);
  }, [
    selectedCategories,
    isAcFilter,
    digitalPayFilter,
    zeroQueueFilter,
    searchQuery,
    userLocation,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSaloons();
  };

  return (
    <AppShell>
      {/* Search Header Banner */}
      <section className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/90 px-4 pt-3 pb-4 border-b border-slate-200/70 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
              {lang === "bn" ? "কাছের সেলুন খুঁজুন" : "Find Salons Near You"}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate whitespace-nowrap">
              {lang === "bn" ? "লাইভ সিরিয়াল ও অপেক্ষমাণ মানুষের সংখ্যা দেখে বুকিং নিন" : "Real-time serials & live queue count"}
            </p>
          </div>

          <button
            onClick={handleGetLocation}
            disabled={locating}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800 transition cursor-pointer shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
          >
            <Navigation className={`w-3.5 h-3.5 text-teal-600 dark:text-teal-400 ${locating ? "animate-spin" : ""}`} />
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
            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setTimeout(fetchSaloons, 50);
              }}
              className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              ✕
            </button>
          )}
        </form>

        {/* Quick Multi-Select Filter Section */}
        <div className="pt-2.5 space-y-2">
          {/* Active Filter Summary Bar (if any filter or search query is applied) */}
          {(activeFilterCount > 0 || searchQuery.trim().length > 0) && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 text-xs animate-in fade-in">
              <div className="flex items-center gap-1.5 text-teal-950 dark:text-teal-200 font-semibold text-[11px] truncate">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="truncate">
                  {lang === "bn"
                    ? `${activeFilterCount}টি ফিল্টার সক্রিয় • ${saloons.length}টি সেলুন পাওয়া গেছে`
                    : `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active • ${saloons.length} salon${saloons.length !== 1 ? "s" : ""}`}
                </span>
              </div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-lg shadow-2xs transition cursor-pointer shrink-0 active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === "bn" ? "রিসেট করুন" : "Reset all"}</span>
              </button>
            </div>
          )}

          {/* Row 1: Categories (Multi-select) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {/* All toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setSelectedCategories([]);
              }}
              className={`px-3 py-1.5 rounded-full font-bold shrink-0 transition flex items-center gap-1 cursor-pointer active:scale-95 ${selectedCategories.length === 0
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
            >
              {selectedCategories.length === 0 && <Check className="w-3 h-3" />}
              <span>{lang === "bn" ? "সকল ক্যাটাগরি" : "All"}</span>
            </button>

            {/* Gents */}
            <button
              type="button"
              onClick={() => toggleCategory("GENTS")}
              className={`px-3 py-1.5 rounded-full font-bold shrink-0 transition flex items-center gap-1 cursor-pointer active:scale-95 ${selectedCategories.includes("GENTS")
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
            >
              {selectedCategories.includes("GENTS") && <Check className="w-3 h-3" />}
              <span>👨 {t.gents}</span>
            </button>

            {/* Ladies */}
            <button
              type="button"
              onClick={() => toggleCategory("LADIES")}
              className={`px-3 py-1.5 rounded-full font-bold shrink-0 transition flex items-center gap-1 cursor-pointer active:scale-95 ${selectedCategories.includes("LADIES")
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
            >
              {selectedCategories.includes("LADIES") && <Check className="w-3 h-3" />}
              <span>👩 {t.ladies}</span>
            </button>

            {/* Unisex */}
            <button
              type="button"
              onClick={() => toggleCategory("UNISEX")}
              className={`px-3 py-1.5 rounded-full font-bold shrink-0 transition flex items-center gap-1 cursor-pointer active:scale-95 ${selectedCategories.includes("UNISEX")
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
            >
              {selectedCategories.includes("UNISEX") && <Check className="w-3 h-3" />}
              <span>👥 {t.unisex}</span>
            </button>
          </div>

          {/* Row 2: Feature Toggles (Multi-select) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {/* Zero Queue Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setZeroQueueFilter(!zeroQueueFilter);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold shrink-0 transition cursor-pointer active:scale-95 ${zeroQueueFilter
                ? "bg-emerald-600 text-white shadow-xs border border-emerald-600"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
            >
              {
                zeroQueueFilter ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                )}
              <span>{lang === "bn" ? "সিরিয়াল খালি (০ অপেক্ষমাণ)" : "No Waiting (0 in queue)"}</span>
            </button>

            {/* AC Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setIsAcFilter(!isAcFilter);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold shrink-0 transition cursor-pointer active:scale-95 ${isAcFilter
                ? "bg-teal-700 text-white shadow-xs border border-teal-700"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
            >
              {isAcFilter ? (
                <Check className="w-3 h-3" />
              ) : (
                <Wind className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              )}
              <span>{t.acOnly}</span>
            </button>

            {/* Digital Payment Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setDigitalPayFilter(!digitalPayFilter);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold shrink-0 transition cursor-pointer active:scale-95 ${digitalPayFilter
                ? "bg-indigo-600 text-white shadow-xs border border-indigo-600"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
            >
              {digitalPayFilter ? (
                <Check className="w-3 h-3" />
              ) : (
                <CreditCard className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              )}
              <span>{lang === "bn" ? "ডিজিটাল পে" : "Digital Pay"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Salons Feed */}
      <section className="px-4 py-3 flex-1 flex flex-col gap-3">
        {isOwner && (
          <div className="bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-teal-900 dark:text-teal-200 truncate">
                  {lang === "bn" ? "আপনি সেলুন মালিক হিসেবে লগইন আছেন" : "Logged in as Salon Owner"}
                </p>
                <p className="text-[10px] text-teal-700 dark:text-teal-400 truncate">
                  {lang === "bn" ? "লাইভ সিরিয়াল ও কিউ পরিচালনা করতে মালিক প্যানেলে যান" : "Manage live queue in Owner Console"}
                </p>
              </div>
            </div>
            <Link
              href="/owner/dashboard"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {lang === "bn" ? "মালিক কনসোল" : "Owner Console"}
            </Link>
          </div>
        )}
        {loading ? (
          // Skeleton Loading
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs animate-pulse">
              <div className="flex gap-3">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3 mt-2" />
                </div>
              </div>
            </div>
          ))
        ) : saloons.length === 0 ? (
          // Empty State
          <div className="py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{t.noSalonsFound}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
              {lang === "bn"
                ? "অন্য কোন এলাকা বা ফিল্টার নির্বাচন করে পুনরায় চেষ্টা করুন।"
                : "Try clearing filters or searching for another area or service."}
            </p>
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-4 py-2 rounded-full border border-teal-200 dark:border-teal-800 transition cursor-pointer"
            >
              {lang === "bn" ? "সব ফিল্টার মুছুন" : "Reset Filters"}
            </button>
          </div>
        ) : (
          // Salon Cards
          saloons.map((salon) => {
            const isFav = favorites.includes(salon.id);

            return (
              <div
                key={salon.id}
                className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all group relative"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <Link href={`/s/${salon.slug}`} className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 shadow-xs">
                    <img
                      src={
                        salon.coverImage ||
                        "/images/salon-placeholder.svg"
                      }
                      alt={salon.nameBn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/salon-placeholder.svg";
                      }}
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <Link href={`/s/${salon.slug}`} className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-[15px] leading-snug text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition truncate">
                              {lang === "bn" ? salon.nameBn : salon.nameEn}
                            </h3>
                          </div>
                        </Link>
                        {/* Favorite Button */}
                        <button
                          onClick={() => {
                            triggerHaptic(25);
                            toggleFavorite(salon.id);
                          }}
                          className={`p-1.5 rounded-full transition cursor-pointer shrink-0 ${isFav
                            ? "text-rose-500 bg-rose-50 dark:bg-rose-950/60"
                            : "text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400"
                            }`}
                          title="Save to My Saloons"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500" : ""}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{salon.address}</span>
                      </div>
                    </div>

                    {/* Live Queue Status */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {salon.totalQueue === 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>
                              {lang === "bn" ? "সিরিয়াল খালি (০ জন অপেক্ষায়)" : "0 in Queue (Walk-in Ready)"}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                            <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>
                              {lang === "bn"
                                ? `সিরিয়ালে ${salon.totalQueue} জন অপেক্ষায়`
                                : `${salon.totalQueue} people in queue`}
                            </span>
                          </span>
                        )}

                      {salon.totalQueue > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                            <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            <span>~{salon.estWaitMins} {t.minutes}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                {/* Bottom Row: Facility Tags (Left) & CTA Button (Right) */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
                  {/* Left side: AC and Digital Pay tags with 80% opacity */}
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0 opacity-80">
                    {salon.isAc && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800">
                        <Wind className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" />
                        <span>AC</span>
                      </span>
                    )}
                    {salon.acceptsDigitalPayment !== false && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                        <CreditCard className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
                        <span>{lang === "bn" ? "ডিজিটাল পে" : "Digital Pay"}</span>
                      </span>
                    )}
                  </div>

                  {/* Right side: Action CTA */}
                  <div className="shrink-0">
                    {isOwner ? (
                      activeSalonId === salon.id || (user?.id && (salon as any).ownerId === user.id) ? (
                        <Link
                          href="/owner/dashboard"
                          className="inline-flex items-center gap-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 active:scale-95 text-white px-3 py-1.5 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>{lang === "bn" ? "ম্যানেজ সেলুন" : "Manage Salon"}</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/s/${salon.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                        >
                          <span>{lang === "bn" ? "বিস্তারিত দেখুন" : "View Details"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )
                    ) : (
                      <Link
                        href={`/s/${salon.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-slate-950 px-3 py-1.5 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                      >
                        <span>{t.joinLiveQueue}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </AppShell>
  );
}

