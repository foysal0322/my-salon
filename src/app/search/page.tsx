"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Search as SearchIcon,
  MapPin,
  Wind,
  Armchair,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";

const DHAKA_AREAS = [
  "ধানমন্ডি (Dhanmondi)",
  "মিরপুর (Mirpur)",
  "গুলশান (Gulshan)",
  "বনানী (Banani)",
  "উত্তরা (Uttara)",
  "মোহাম্মদপুর (Mohammadpur)",
];

export default function SearchPage() {
  const { lang, t } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [isAc, setIsAc] = useState<string>("ALL");
  const [saloons, setSaloons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("search", query);
      if (category !== "ALL") params.append("category", category);
      if (isAc === "AC") params.append("isAc", "true");
      if (isAc === "NON_AC") params.append("isAc", "false");

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
    performSearch();
  }, [category, isAc]);

  const handleAreaClick = (areaName: string) => {
    const clean = areaName.split(" ")[0]; // e.g. ধানমন্ডি
    setQuery(clean);
    setTimeout(performSearch, 50);
  };

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.navSearch}</h1>
          <p className="text-xs text-slate-500">
            {lang === "bn"
              ? "এলাকা, সেলুন নাম বা পছন্দের সার্ভিস দিয়ে ফিল্টার করুন"
              : "Filter by location, salon name, or specific service"}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && performSearch()}
            placeholder={t.searchPlaceholder}
            className="w-full bg-white text-slate-900 text-sm pl-10 pr-20 py-3 rounded-2xl border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <button
            onClick={performSearch}
            className="absolute right-2 text-xs font-bold bg-[#0D9488] text-white px-3 py-1.5 rounded-xl hover:bg-[#115E59] transition cursor-pointer"
          >
            {lang === "bn" ? "খুঁজুন" : "Search"}
          </button>
        </div>

        {/* Popular Areas Chips */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 mb-2">
            {lang === "bn" ? "জনপ্রিয় এলাকা সমূহ:" : "Popular Areas:"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DHAKA_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => handleAreaClick(area)}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>{lang === "bn" ? "ফিল্টার অপশন" : "Filter Options"}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Category Dropdown */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {lang === "bn" ? "ক্যাটাগরি" : "Category"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">{lang === "bn" ? "সকল ধরন" : "All Types"}</option>
                <option value="GENTS">{t.gents}</option>
                <option value="LADIES">{t.ladies}</option>
                <option value="UNISEX">{t.unisex}</option>
              </select>
            </div>

            {/* AC Dropdown */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {lang === "bn" ? "পরিবেশ" : "Environment"}
              </label>
              <select
                value={isAc}
                onChange={(e) => setIsAc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">{lang === "bn" ? "সকল পরিবেশ" : "All"}</option>
                <option value="AC">{t.acOnly}</option>
                <option value="NON_AC">{t.nonAc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500">
            {lang === "bn" ? `ফলাফল (${saloons.length} টি সেলুন)` : `Results (${saloons.length} Salons)`}
          </p>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-24 bg-slate-200 rounded-2xl" />
              <div className="h-24 bg-slate-200 rounded-2xl" />
            </div>
          ) : saloons.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
              <p className="text-xs text-slate-500">{t.noSalonsFound}</p>
            </div>
          ) : (
            saloons.map((salon) => (
              <Link
                key={salon.id}
                href={`/s/${salon.slug}`}
                className="block bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {lang === "bn" ? salon.nameBn : salon.nameEn}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{salon.address}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                    {salon.category}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Armchair className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {salon.freeChairs} {t.chairsAvailable}
                    </span>
                  </span>

                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <span>{t.joinLiveQueue}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
