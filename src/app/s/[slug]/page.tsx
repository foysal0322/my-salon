"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  MapPin,
  Phone,
  Heart,
  Wind,
  Armchair,
  Clock,
  CheckCircle2,
  Share2,
  ChevronLeft,
  Sparkles,
  Ticket,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface ServiceItem {
  id: string;
  nameBn: string;
  nameEn: string;
  price: number;
  durationMins: number;
  details?: string;
}

interface SalonDetails {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  category: string;
  isAc: boolean;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  totalChairs: number;
  busyChairs: number;
  freeChairs: number;
  chairStates: Array<{ chairNo: number; isBusy: boolean }>;
  currentServingToken: number;
  onlineWaitingCount: number;
  manualQueueCount: number;
  totalQueue: number;
  estWaitMins: number;
  coverImage?: string;
  services: ServiceItem[];
}

export default function SalonProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { lang, t, user, favorites, toggleFavorite, playChime, triggerHaptic } = useApp();

  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Join Queue Modal state
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);
  const [existingBookingData, setExistingBookingData] = useState<{
    id: string;
    token: number;
    salonName: string;
  } | null>(null);

  // Sync user info or remembered phone for guest
  useEffect(() => {
    if (user) {
      if (user.name) setGuestName(user.name);
      if (user.phone) setGuestPhone(user.phone);
    } else {
      try {
        const savedPhone = localStorage.getItem("amarsaloon_guest_phone");
        const savedName = localStorage.getItem("amarsaloon_guest_name");
        if (savedPhone) setGuestPhone(savedPhone);
        if (savedName) setGuestName(savedName);
      } catch (e) {}
    }
  }, [user]);

  const fetchSalonDetails = async () => {
    try {
      const res = await fetch(`/api/v1/saloons/${slug}`);
      const data = await res.json();
      if (data.salon) {
        setSalon(data.salon);
        // Pre-select first service if nothing selected
        if (selectedServices.length === 0 && data.salon.services.length > 0) {
          setSelectedServices([data.salon.services[0].id]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalonDetails();
    // Auto refresh live queue every 12 seconds
    const interval = setInterval(fetchSalonDetails, 12000);
    return () => clearInterval(interval);
  }, [slug]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-4 space-y-4 animate-pulse">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="h-6 bg-slate-200 rounded-md w-3/4" />
          <div className="h-4 bg-slate-200 rounded-md w-1/2" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!salon) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-slate-600 mb-4">{t.error}</p>
          <Link href="/" className="text-sm font-semibold text-teal-600 hover:underline">
            {t.back}
          </Link>
        </div>
      </AppShell>
    );
  }

  const isFav = favorites.includes(salon.id);

  const toggleService = (id: string) => {
    triggerHaptic(20);
    if (selectedServices.includes(id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((sId) => sId !== id));
      }
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const selectedServiceObjects = salon.services.filter((s) =>
    selectedServices.includes(s.id)
  );

  const totalBill = selectedServiceObjects.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServiceObjects.reduce(
    (sum, s) => sum + s.durationMins,
    0
  );


  // Submit Queue Booking
  const handleConfirmBooking = async (e?: React.FormEvent, cancelExisting = false) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setExistingBookingData(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saloonId: salon.id,
          customerId: user?.id || null,
          guestName: guestName || (lang === "bn" ? "সম্মানিত গ্রাহক" : "Valued Customer"),
          guestPhone: guestPhone,
          serviceIds: selectedServices,
          bookingType: "LIVE_QUEUE",
          cancelExisting,
        }),
      });

      const data = await res.json();
      if (res.ok && data.booking) {
        playChime();
        triggerHaptic(70);

        try {
          localStorage.setItem("amarsaloon_last_booking_id", data.booking.id);
          localStorage.setItem("amarsaloon_guest_phone", guestPhone);
          if (guestName) localStorage.setItem("amarsaloon_guest_name", guestName);
        } catch (e) {}

        setCreatedBooking(data.booking);

        // Auto-navigate after showing success state
        setTimeout(() => {
          setShowQueueModal(false);
          router.push(`/bookings?active=${data.booking.id}`);
        }, 1600);
      } else {
        if (data.existingBookingId) {
          setExistingBookingData({
            id: data.existingBookingId,
            token: data.existingToken,
            salonName: data.existingSalonName,
          });
        }
        setErrorMessage(data.error || t.error);
      }
    } catch (e) {
      setErrorMessage(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Top Cover Hero */}
      <div className="relative h-48 bg-slate-900 overflow-hidden">
        <img
          src={
            salon.coverImage ||
            "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=60"
          }
          alt={salon.nameBn}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-black/20" />

        {/* Back and Favorite Floating Header */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic(30);
                toggleFavorite(salon.id);
              }}
              className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition cursor-pointer ${
                isFav
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                  : "bg-black/40 text-white hover:bg-black/60"
              }`}
              title="Save to My Saloons"
            >
              <Heart className={`w-5 h-5 ${isFav ? "fill-white" : ""}`} />
            </button>
          </div>
        </div>

        {/* Hero Title & Pill */}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
              {salon.category}
            </span>
            {salon.isAc && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-800/80 backdrop-blur-xs text-teal-200 border border-teal-500/40 flex items-center gap-1">
                <Wind className="w-2.5 h-2.5" />
                AC
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold leading-tight text-white drop-shadow-md">
            {lang === "bn" ? salon.nameBn : salon.nameEn}
          </h1>
        </div>
      </div>

      {/* Address & Quick Contact Strip */}
      <div className="bg-white px-4 py-3 border-b border-slate-200/80 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-1.5 text-slate-600 min-w-0">
          <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span className="truncate">{salon.address}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`tel:${salon.phone}`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-800 font-semibold border border-teal-200 hover:bg-teal-100 transition"
          >
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            <span>{salon.phone}</span>
          </a>
        </div>
      </div>

      {/* Live Floor & Queue Status Board */}
      <section className="px-4 py-3">
        <div className="bg-gradient-to-br from-teal-900 to-[#115E59] text-white rounded-3xl p-4 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-teal-200">
                {t.liveChairStatus}
              </h2>
            </div>
            <span className="text-[10px] text-teal-300 font-medium">
              {lang === "bn" ? "লাইভ আপডেট হচ্ছে" : "Live Sync"}
            </span>
          </div>

          {/* Metric Columns */}
          <div className="grid grid-cols-3 gap-2 text-center py-1 bg-white/10 rounded-2xl backdrop-blur-xs mb-3 border border-white/10">
            {/* Total Chairs */}
            <div className="p-2 border-r border-white/10">
              <p className="text-[10px] text-teal-200 font-medium">{t.chairs}</p>
              <p className="text-lg font-bold text-white leading-none mt-0.5">
                {salon.totalChairs - salon.busyChairs}/{salon.totalChairs}
              </p>
              <p className="text-[9px] text-emerald-300 font-medium mt-0.5">
                {salon.freeChairs > 0 ? (lang === "bn" ? "খালি আছে" : "Available") : (lang === "bn" ? "ব্যস্ত" : "Busy")}
              </p>
            </div>

            {/* Serving Token */}
            <div className="p-2 border-r border-white/10">
              <p className="text-[10px] text-teal-200 font-medium">{t.currentServing}</p>
              <p className="text-lg font-bold text-amber-300 leading-none mt-0.5">
                #{String(salon.currentServingToken || 0).padStart(3, "0")}
              </p>
              <p className="text-[9px] text-teal-300 font-medium mt-0.5">
                {lang === "bn" ? "চলমান" : "In Chair"}
              </p>
            </div>

            {/* Estimated Wait */}
            <div className="p-2">
              <p className="text-[10px] text-teal-200 font-medium">{t.estWaitTime}</p>
              <p className="text-lg font-bold text-white leading-none mt-0.5">
                ~{salon.estWaitMins}
              </p>
              <p className="text-[9px] text-teal-300 font-medium mt-0.5">{t.minutes}</p>
            </div>
          </div>

          {/* Interactive Chair State Grid */}
          <div>
            <p className="text-[11px] font-semibold text-teal-200 mb-1.5 flex items-center gap-1">
              <Armchair className="w-3.5 h-3.5" />
              <span>{lang === "bn" ? "চেয়ারের অবস্থা:" : "Chairs Layout:"}</span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {salon.chairStates.map((chair) => (
                <div
                  key={chair.chairNo}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    chair.isBusy
                      ? "bg-rose-500/20 border-rose-400/40 text-rose-200"
                      : "bg-emerald-500/25 border-emerald-400/50 text-emerald-100 shadow-xs"
                  }`}
                >
                  <p className="text-[10px] font-bold">
                    {lang === "bn" ? `চেয়ার ${chair.chairNo}` : `Chair ${chair.chairNo}`}
                  </p>
                  <span
                    className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      chair.isBusy ? "bg-rose-500/80 text-white" : "bg-emerald-500 text-slate-950"
                    }`}
                  >
                    {chair.isBusy ? (lang === "bn" ? "ব্যস্ত" : "Busy") : (lang === "bn" ? "খালি" : "Free")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Menu Section */}
      <section className="px-4 py-2 pb-24">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t.selectServices}</span>
          </h2>
          <span className="text-[11px] text-slate-500">
            {lang === "bn" ? "একাধিক নির্বাচন করুন" : "Multi-select"}
          </span>
        </div>

        <div className="space-y-2">
          {salon.services.map((service) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-teal-50/90 border-teal-500 shadow-xs ring-1 ring-teal-500/30"
                    : "bg-white border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${isSelected ? "text-teal-900" : "text-slate-800"}`}>
                      {lang === "bn" ? service.nameBn : service.nameEn}
                    </p>
                    {service.details && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{service.details}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        ~{service.durationMins} {t.minutes}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    ৳{service.price}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sticky Bottom Booking Action Bar */}
      <aside aria-label="Booking Action Bar" className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none no-print">
        <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-4 py-3 flex items-center justify-between gap-3 pointer-events-auto">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">
              {selectedServices.length} {lang === "bn" ? "টি সার্ভিস নির্বাচিত" : "services"}
            </p>
            <p className="text-base font-bold text-slate-900 font-mono flex items-center gap-1.5">
              <span>৳{totalBill}</span>
              <span className="text-xs font-normal text-slate-400 font-sans">
                • ~{totalDuration} {t.minutes}
              </span>
            </p>
          </div>

          <button
            onClick={() => {
              triggerHaptic(35);
              setShowQueueModal(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-slate-950 px-5 py-3 rounded-2xl shadow-md transition cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>{t.joinLiveQueue}</span>
          </button>
        </div>
      </aside>

      {/* Slide-Up Bottom Drawer: Join Live Queue Confirmation */}
      {showQueueModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => {
              if (!submitting) setShowQueueModal(false);
            }}
          />
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-5 shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-250 max-h-[90vh] overflow-y-auto pb-8">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{t.joinLiveQueue}</h3>
                  <p className="text-[11px] text-slate-500">{salon.nameBn}</p>
                </div>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SUCCESS CELEBRATION CARD */}
            {createdBooking ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {lang === "bn" ? "সিরিয়াল নিশ্চিত হয়েছে!" : "Token Issued!"}
                  </span>
                  <p className="text-4xl font-black font-mono text-slate-900 mt-2">
                    #{String(createdBooking.tokenNumber).padStart(3, "0")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === "bn"
                      ? "আপনার সিরিয়াল সফলভাবে নেওয়া হয়েছে। লাইভ ট্র্যাকারে আপনাকে নিয়ে যাওয়া হচ্ছে..."
                      : "Your queue token is confirmed. Redirecting to live tracker..."}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/bookings?active=${createdBooking.id}`}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#0D9488] hover:bg-[#115E59] text-white shadow-md transition"
                  >
                    <span>{lang === "bn" ? "লাইভ ট্র্যাকার দেখুন" : "View Live Tracker"}</span>
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Conflict Resolution Banner if Active Booking Exists */}
                {existingBookingData ? (
                  <div className="my-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                      <div>
                        <p className="font-bold">
                          {lang === "bn"
                            ? `আপনার ইতোমধ্যে একটি সক্রিয় সিরিয়াল রয়েছে!`
                            : `You already have an active queue token!`}
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          {lang === "bn"
                            ? `সেলুন: ${existingBookingData.salonName} (টোকেন #${existingBookingData.token})। আপনি কি করবেন?`
                            : `Salon: ${existingBookingData.salonName} (Token #${existingBookingData.token})`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href={`/bookings?active=${existingBookingData.id}`}
                        className="text-center py-2 px-3 rounded-xl font-bold bg-amber-500 text-slate-950 text-[11px] shadow-xs hover:bg-amber-600 transition"
                      >
                        {lang === "bn" ? `টোকেন #${existingBookingData.token} দেখুন` : `View Active Token`}
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleConfirmBooking(undefined, true)}
                        disabled={submitting}
                        className="py-2 px-3 rounded-xl font-bold bg-rose-600 text-white text-[11px] shadow-xs hover:bg-rose-700 transition cursor-pointer"
                      >
                        {lang === "bn" ? `পূর্বেরটি বাতিল করে নতুন নিন` : `Cancel & Book Here`}
                      </button>
                    </div>
                  </div>
                ) : errorMessage ? (
                  <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                {/* Selected Summary */}
                <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{t.selectedServices}:</span>
                    <span className="truncate max-w-[200px]">
                      {selectedServiceObjects.map((s) => s.nameBn).join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>{lang === "bn" ? "আনুমানিক সময়:" : "Estimated time:"}</span>
                    <span>~{totalDuration} {t.minutes}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm pt-1.5 border-t border-slate-200/60">
                    <span>{t.totalBill}:</span>
                    <span className="text-teal-700 font-mono text-base">৳{totalBill}</span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={(e) => handleConfirmBooking(e, false)} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.name}
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="আপনার নাম লিখুন"
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.phone} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t.guestNotice}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>
                        {submitting
                          ? t.loading
                          : lang === "bn"
                          ? "সিরিয়াল নিশ্চিত করুন"
                          : "Confirm Queue Token"}
                      </span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
