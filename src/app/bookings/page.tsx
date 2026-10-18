"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  RefreshCw,
  BellRing,
  Trash2,
  Calendar,
  Sparkles,
} from "lucide-react";

import { Suspense } from "react";

function BookingsContent() {
  const searchParams = useSearchParams();
  const activeBookingIdParam = searchParams.get("active");
  const { lang, t, user, playChime, triggerHaptic } = useApp();

  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<any | null>(null);
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [hasAlertedTurn, setHasAlertedTurn] = useState(false);

  // Fetch active booking tracker
  const fetchActiveBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/bookings?id=${id}`);
      const data = await res.json();
      if (data.booking) {
        setActiveBooking({ ...data.booking, saloon: data.saloon });
        setQueueMetrics(data.queueMetrics);

        // Turn arrived notification
        if (data.queueMetrics?.isCurrentTurn && !hasAlertedTurn) {
          playChime();
          triggerHaptic(80);
          setHasAlertedTurn(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch user bookings history
  const fetchUserBookings = async () => {
    let targetPhone = user?.phone || "";
    let targetId = user?.id || "";
    let fallbackBookingId: string | null = activeBookingIdParam;

    if (!targetId && !targetPhone) {
      try {
        targetPhone = localStorage.getItem("amarsaloon_guest_phone") || "";
        fallbackBookingId = fallbackBookingId || localStorage.getItem("amarsaloon_last_booking_id");
      } catch (e) {}
    }

    if (!targetId && !targetPhone && !fallbackBookingId) {
      setLoading(false);
      return;
    }

    if (fallbackBookingId && !activeBooking) {
      fetchActiveBooking(fallbackBookingId);
    }

    try {
      const query = targetId
        ? `userId=${targetId}`
        : targetPhone
        ? `phone=${targetPhone}`
        : "";

      if (!query) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/v1/bookings?${query}`);
      const data = await res.json();
      if (data.bookings) {
        setHistoryBookings(data.bookings);
        // If no explicit active param, find the latest WAITING or IN_SERVICE booking
        if (!activeBookingIdParam && !activeBooking) {
          const currentActive = data.bookings.find((b: any) =>
            ["WAITING", "IN_SERVICE"].includes(b.status)
          );
          if (currentActive) {
            fetchActiveBooking(currentActive.id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBookingIdParam) {
      fetchActiveBooking(activeBookingIdParam);
    }
    fetchUserBookings();

    // Auto refresh active tracker every 10 seconds
    const interval = setInterval(() => {
      if (activeBookingIdParam || activeBooking?.id) {
        fetchActiveBooking(activeBookingIdParam || activeBooking.id);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activeBookingIdParam, user]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    triggerHaptic(20);
    if (activeBooking?.id) {
      await fetchActiveBooking(activeBooking.id);
    }
    await fetchUserBookings();
    setRefreshing(false);
  };

  const handleCancelBooking = async () => {
    if (!activeBooking?.id) return;
    const confirmCancel = window.confirm(
      lang === "bn"
        ? "আপনি কি নিশ্চিত যে সিরিয়ালটি বাতিল করতে চান?"
        : "Are you sure you want to cancel this queue booking?"
    );
    if (!confirmCancel) return;

    setCancelling(true);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: activeBooking.id, action: "CANCEL" }),
      });
      if (res.ok) {
        setActiveBooking((prev: any) => ({ ...prev, status: "CANCELLED" }));
        fetchUserBookings();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.navBookings}</h1>
            <p className="text-xs text-slate-500">
              {lang === "bn" ? "লাইভ সিরিয়াল ট্র্যাকার ও হিস্ট্রি" : "Live Queue Tracker & History"}
            </p>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>

        {/* ACTIVE QUEUE TRACKER CARD */}
        {activeBooking && ["WAITING", "IN_SERVICE"].includes(activeBooking.status) ? (
          <div className="bg-gradient-to-br from-teal-900 via-[#115E59] to-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  {activeBooking.status === "IN_SERVICE"
                    ? lang === "bn"
                      ? "আপনার কাজ চলছে"
                      : "Currently in Service"
                    : lang === "bn"
                    ? "লাইভ সিরিয়ালে আছেন"
                    : "Live in Queue"}
                </span>
              </div>

              <span className="text-xs text-teal-200 font-medium">
                {activeBooking.bookingDate}
              </span>
            </div>

            {/* Salon Name */}
            <div className="mb-4">
              <Link
                href={`/s/${activeBooking.saloon?.slug}`}
                className="text-lg font-bold text-white hover:text-teal-200 transition flex items-center gap-1"
              >
                <span>{activeBooking.saloon?.nameBn}</span>
              </Link>
              <p className="text-xs text-teal-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{activeBooking.saloon?.address}</span>
              </p>
            </div>

            {/* Giant Token Display Card */}
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 text-center my-3">
              <p className="text-xs text-teal-200 font-medium">{t.yourToken}</p>
              <p className="text-5xl font-black text-amber-400 my-1 font-mono tracking-tight">
                #{String(activeBooking.tokenNumber).padStart(3, "0")}
              </p>
              <p className="text-xs text-teal-100 font-medium">
                {activeBooking.guestName} ({activeBooking.guestPhone})
              </p>
            </div>

            {/* Status Alert Banner if Turn is Ready */}
            {queueMetrics?.isCurrentTurn && (
              <div className="bg-emerald-500 text-slate-950 p-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg animate-bounce my-3">
                <BellRing className="w-5 h-5 shrink-0" />
                <span>{t.readyAlert}</span>
              </div>
            )}

            {/* Queue Counter Matrix */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-t border-white/10 mt-3">
              <div>
                <p className="text-teal-300 text-[10px]">{t.servingToken}</p>
                <p className="font-bold text-white text-base mt-0.5 font-mono">
                  #{String(activeBooking.saloon?.currentServingToken || 0).padStart(3, "0")}
                </p>
              </div>

              <div>
                <p className="text-teal-300 text-[10px]">{t.peopleAhead}</p>
                <p className="font-bold text-amber-300 text-base mt-0.5">
                  {queueMetrics?.totalQueueAhead || 0} {t.peopleUnit}
                </p>
              </div>

              <div>
                <p className="text-teal-300 text-[10px]">{t.estWaitTime}</p>
                <p className="font-bold text-white text-base mt-0.5">
                  ~{queueMetrics?.estWaitMins || 15} {t.minutes}
                </p>
              </div>
            </div>

            {/* Actions: Cancel Booking */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[11px] text-teal-300">
                {t.totalBill}: <strong className="text-white">৳{activeBooking.totalAmount}</strong>
              </span>

              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex items-center gap-1 text-rose-300 hover:text-rose-100 p-1.5 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{cancelling ? t.loading : t.cancelBooking}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* BOOKINGS HISTORY SECTION */}
        <section className="mt-6">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>{lang === "bn" ? "সকল সিরিয়াল ও বুকিং" : "Booking History"}</span>
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-20 bg-slate-200 rounded-2xl" />
              <div className="h-20 bg-slate-200 rounded-2xl" />
            </div>
          ) : historyBookings.length === 0 && !activeBooking ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                {lang === "bn" ? "কোন সক্রিয় সিরিয়াল নেই" : "No Active Bookings"}
              </h3>
              <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                {lang === "bn"
                  ? "কাছের সেলুন খুঁজে সার্ভিস বেছে নিন এবং ঘরে বসেই লাইভ সিরিয়াল নিন।"
                  : "Discover nearby salons and take live waiting tokens directly from your phone."}
              </p>
              <Link
                href="/"
                className="inline-block text-xs font-bold bg-[#0D9488] text-white px-5 py-2.5 rounded-full shadow-sm hover:bg-[#115E59] transition"
              >
                {lang === "bn" ? "সেলুন খুঁজুন" : "Browse Salons"}
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {historyBookings.map((b) => {
                const isWaiting = b.status === "WAITING";
                const isCompleted = b.status === "COMPLETED";
                const isCancelled = b.status === "CANCELLED";

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                          #{String(b.tokenNumber).padStart(3, "0")}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isWaiting
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {b.saloon?.nameBn || "সেলুন"}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {b.bookingDate} • ৳{b.totalAmount}
                      </p>
                    </div>

                    <div>
                      {isWaiting && (
                        <button
                          onClick={() => {
                            fetchActiveBooking(b.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition cursor-pointer"
                        >
                          {lang === "bn" ? "লাইভ ট্র্যাক" : "Track"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">লোড হচ্ছে...</div>}>
      <BookingsContent />
    </Suspense>
  );
}
