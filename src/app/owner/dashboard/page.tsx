"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Users,
  Plus,
  Minus,
  Megaphone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  SkipForward,
  UserX,
  RefreshCw,
  CreditCard,
  Phone,
  Ticket,
  BellRing,
  Play,
  Store,
} from "lucide-react";
import { sendBrowserNotification } from "@/lib/notifications";

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { lang, t, user, activeSalonId, setActiveSalonId, playChime, triggerHaptic } = useApp();

  const [salon, setSalon] = useState<any | null>(null);
  const [waitingBookings, setWaitingBookings] = useState<any[]>([]);
  const [inServiceBooking, setInServiceBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [subStatus, setSubStatus] = useState<any | null>(null);
  const [newBookingAlert, setNewBookingAlert] = useState<string | null>(null);

  const prevWaitingCount = useRef<number | null>(null);

  // Redirect if not owner or not logged in
  useEffect(() => {
    if (user && user.role !== "OWNER") {
      router.push("/");
    }
  }, [user, router]);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      // 1. Fetch salon data
      const res = await fetch(`/api/v1/owner/saloons?ownerId=${user.id}`);
      const data = await res.json();
      if (data.saloons && data.saloons.length > 0) {
        const current =
          data.saloons.find((s: any) => s.id === activeSalonId) || data.saloons[0];

        setSalon(current);

        if (current.id !== activeSalonId) {
          setActiveSalonId(current.id);
        }

        const effectiveSalonId = current.id;

        // 2. Fetch subscription status
        const subRes = await fetch(`/api/v1/owner/subscriptions?saloonId=${effectiveSalonId}`);
        const subData = await subRes.json();
        setSubStatus(subData);

        // 3. Fetch today's live online queue bookings
        const bookRes = await fetch(`/api/v1/bookings?saloonId=${effectiveSalonId}`);
        const bookData = await bookRes.json();
        if (bookData.bookings) {
          const waiting = bookData.waiting || [];
          const inService = bookData.inService?.[0] || null;

          // Check if a new customer joined the queue (real-time notification)
          if (
            prevWaitingCount.current !== null &&
            waiting.length > prevWaitingCount.current
          ) {
            playChime();
            triggerHaptic(90);
            const latest = waiting[waiting.length - 1];
            const alertMsg =
              lang === "bn"
                ? `🔔 নতুন সিরিয়াল যুক্ত হয়েছে: #${String(latest.tokenNumber).padStart(3, "0")} (${latest.guestName})`
                : `🔔 New Queue Booking: #${String(latest.tokenNumber).padStart(3, "0")} (${latest.guestName})`;
            setNewBookingAlert(alertMsg);
            sendBrowserNotification(
              lang === "bn" ? "🔔 নতুন কাস্টমার সিরিয়াল নিয়েছেন!" : "🔔 New Live Queue Booking!",
              {
                body: alertMsg,
                url: "/owner/dashboard",
              }
            );
            setTimeout(() => setNewBookingAlert(null), 6000);
          }
          prevWaitingCount.current = waiting.length;

          setWaitingBookings(waiting);
          setInServiceBooking(inService);
        }
      } else {
        setSalon(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Fast 4-second polling for real-time queue updates
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, [activeSalonId, user]);

  // ADJUST WALK-IN QUEUE (+1 / -1)
  const handleAdjustWalkIn = async (delta: number) => {
    if (!activeSalonId) return;
    triggerHaptic(30);
    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADJUST_WALK_IN", delta }),
      });
      const data = await res.json();
      if (data.success && salon) {
        setSalon({
          ...salon,
          manualQueueCount: data.manualQueueCount,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CALL NEXT CUSTOMER
  const handleCallNext = async () => {
    if (!activeSalonId) return;
    setCallingNext(true);
    triggerHaptic(80);
    playChime();

    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CALL_NEXT" }),
      });
      const data = await res.json();
      if (data.message) {
        setNewBookingAlert(data.message);
        setTimeout(() => setNewBookingAlert(null), 5000);
      }
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setCallingNext(false);
    }
  };

  // START SERVICE FOR SPECIFIC BOOKING
  const handleStartService = async (bookingId: string) => {
    if (!activeSalonId) return;
    triggerHaptic(50);
    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START_SERVICE", bookingId }),
      });
      const data = await res.json();
      if (data.message) {
        setNewBookingAlert(data.message);
        setTimeout(() => setNewBookingAlert(null), 4000);
      }
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // COMPLETE SERVICE & 1-TAP CONVERT TO SALES LEDGER
  const handleCompleteBooking = async (bookingId: string) => {
    if (!activeSalonId) return;
    triggerHaptic(50);
    const logIncome = window.confirm(
      lang === "bn"
        ? "সার্ভিসটি সম্পন্ন করে হিসাব খাতায় বিক্রয় হিসেবে যোগ করতে চান?"
        : "Complete service and record bill into your sales ledger?"
    );

    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_BOOKING",
          bookingId,
          autoIncome: logIncome,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setNewBookingAlert(data.message);
        setTimeout(() => setNewBookingAlert(null), 4000);
      }
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // SKIP / HOLD BOOKING (+2 POSITIONS)
  const handleSkipBooking = async (bookingId: string) => {
    if (!activeSalonId) return;
    triggerHaptic(40);
    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SKIP_BOOKING", bookingId }),
      });
      const data = await res.json();
      if (data.message) {
        setNewBookingAlert(data.message);
        setTimeout(() => setNewBookingAlert(null), 4000);
      }
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // MARK NO-SHOW
  const handleNoShow = async (bookingId: string) => {
    if (!activeSalonId) return;
    const confirmNoShow = window.confirm(
      lang === "bn"
        ? "গ্রাহককে অনুপস্থিত (No-Show) চিহ্নিত করতে চান?"
        : "Mark customer as No-Show?"
    );
    if (!confirmNoShow) return;

    triggerHaptic(40);
    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "NO_SHOW", bookingId }),
      });
      const data = await res.json();
      if (data.message) {
        setNewBookingAlert(data.message);
        setTimeout(() => setNewBookingAlert(null), 4000);
      }
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-slate-600 mb-4">{t.login}</p>
          <Link
            href="/login"
            className="text-xs font-bold bg-[#0D9488] text-white px-5 py-2.5 rounded-full"
          >
            {t.login}
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!loading && !salon) {
    return (
      <AppShell>
        <div className="px-4 py-12 max-w-sm mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center justify-center mx-auto shadow-sm">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {lang === "bn" ? "কোন সেলুন শাখা পাওয়া যায়নি" : "No Salons Registered Yet"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {lang === "bn"
              ? "আপনার সেলুন বা পার্লারের শাখা যুক্ত করে লাইভ সিরিয়াল পরিচালনা শুরু করুন। পাবেন ৩০ দিনের সম্পূর্ণ ফ্রি ট্রায়াল।"
                : "Register your first salon branch to begin managing live queues and serials. Includes 30 days free trial."}
            </p>
          </div>
          <Link
            href="/owner/new-salon"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === "bn" ? "প্রথম সেলুন শাখা যুক্ত করুন" : "Add Your First Salon"}</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isExpired = subStatus?.status === "EXPIRED";
  const nextCustomer = waitingBookings[0];

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-4">
        {/* Real-time Toast Banner for New Queue Arrival */}
        {newBookingAlert && (
          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between gap-2 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <BellRing className="w-4 h-4 shrink-0 animate-bounce" />
              <span className="truncate">{newBookingAlert}</span>
            </div>
            <button
              onClick={() => setNewBookingAlert(null)}
              className="text-white/80 hover:text-white p-1 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Subscription Expired Lockout Warning */}
        {isExpired && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 shadow-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">
                {lang === "bn" ? "প্যাকেজের মেয়াদ শেষ হয়েছে!" : "Subscription Expired!"}
              </p>
              <p className="mt-0.5 text-rose-700">
                {lang === "bn"
                  ? "আপনার সেলুনটি গ্রাহক অনুসন্ধান থেকে সাময়িকভাবে লুকানো রয়েছে। সেবা চালু রাখতে প্যাকেজ নবায়ন করুন।"
                  : "Your salon is currently hidden from public search. Please renew your plan."}
              </p>
              <Link
                href="/owner/profile?tab=sub"
                className="mt-2 inline-flex items-center gap-1 font-bold bg-rose-600 text-white px-3 py-1.5 rounded-lg shadow-xs hover:bg-rose-700 transition"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t.renewNow}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Console Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t.navQueue}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === "bn"
              ? "লাইভ সিরিয়াল ও কিউ কন্ট্রোল"
                : "Live Serial & Queue Controller"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/owner/new-salon"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition text-xs font-bold active:scale-95"
              title={lang === "bn" ? "নতুন সেলুন শাখা যোগ করুন" : "Add New Salon Branch"}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === "bn" ? "নতুন শাখা" : "Add Branch"}</span>
            </Link>

            <button
              onClick={() => {
                setRefreshing(true);
                fetchDashboardData();
              }}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* "CALL NEXT CUSTOMER" OVERSIZED HERO BUTTON */}
        <section>
          <button
            onClick={handleCallNext}
            disabled={callingNext || isExpired}
            className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 p-4 sm:p-5 rounded-3xl shadow-lg hover:shadow-xl active:scale-[0.99] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer disabled:opacity-50 text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-slate-950/15 flex items-center justify-center shrink-0">
                <Megaphone className="w-6 h-6 text-slate-950 animate-bounce" />
              </div>

              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-slate-950/15 px-2 py-0.5 rounded-md">
                    {nextCustomer
                      ? lang === "bn"
                        ? "পরবর্তী গ্রাহক প্রস্তুত"
                        : "Next Customer"
                      : lang === "bn"
                        ? "সিরিয়াল ডাকুন"
                        : "Call Queue"}
                  </span>
                  {nextCustomer && (
                    <span className="font-mono font-black text-xs bg-slate-950 text-amber-300 px-2 py-0.5 rounded-md">
                      #{String(nextCustomer.tokenNumber).padStart(3, "0")}
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-black text-slate-950 truncate leading-snug">
                  {nextCustomer ? nextCustomer.guestName : t.callNextCustomer}
                </h2>

                {nextCustomer && (
                  <p className="text-[11px] font-semibold text-slate-900 truncate mt-0.5">
                    {nextCustomer.services?.map((s: any) => s.nameBn).join(", ") || "সার্ভিস"} • ৳{nextCustomer.totalAmount}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-slate-950/10 sm:border-t-0">
              <div className="text-left sm:text-right bg-white/40 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-white/30">
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">{t.currentServing}</p>
                <p className="font-mono font-black text-lg sm:text-xl text-slate-950 leading-tight">
                  #{String(salon?.currentServingToken || 0).padStart(3, "0")}
                </p>
              </div>

              <div className="sm:hidden px-3.5 py-2 rounded-xl bg-slate-950 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-xs">
                <span>{lang === "bn" ? "ডাকুন" : "Call"}</span>
                <Play className="w-3.5 h-3.5 fill-amber-300" />
              </div>
            </div>
          </button>
        </section>

        {/* LIVE ONLINE QUEUE LIST (CUSTOMER UPDATES APPEAR HERE) */}
        <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === "bn" ? "অনলাইন লাইভ সিরিয়াল" : "Live Online Queue"}
              </h3>
            </div>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              {waitingBookings.length} {t.peopleUnit} {t.queueWaiting}
            </span>
          </div>

          {/* Currently In Service Customer Card */}
          {inServiceBooking && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/80 dark:to-emerald-950/80 border border-teal-300 dark:border-teal-700 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-200 bg-teal-200/70 dark:bg-teal-900/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Play className="w-3 h-3 fill-teal-800 dark:fill-teal-200" />
                  <span>{lang === "bn" ? "বর্তমানে সেবা নিচ্ছেন" : "Currently Serving"}</span>
                </span>
                <span className="font-mono font-black text-base text-teal-900 dark:text-teal-200">
                  #{String(inServiceBooking.tokenNumber).padStart(3, "0")}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{inServiceBooking.guestName}</p>
                  <a
                    href={`tel:${inServiceBooking.guestPhone}`}
                    className="text-teal-700 dark:text-teal-400 font-mono text-[11px] flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{inServiceBooking.guestPhone}</span>
                  </a>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                    ৳{inServiceBooking.totalAmount}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {inServiceBooking.services?.map((s: any) => s.nameBn).join(", ")}
                  </p>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={() => handleCompleteBooking(inServiceBooking.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === "bn" ? "সার্ভিস সমাপ্ত ও ক্যাশ জমা" : "Complete & Record Cash"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Waiting Queue Customers */}
          {waitingBookings.length > 0 ? (
            <div className="space-y-2 pt-1">
              {waitingBookings.map((b, idx) => {
                const isNext = idx === 0;
                return (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-2xl transition space-y-2.5 ${isNext
                      ? "bg-amber-50/70 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-700/60 border border-slate-200/90 dark:border-slate-600 shadow-2xs hover:border-slate-300 dark:hover:border-slate-500"
                      }`}
                  >
                    {isNext && (
                      <div className="flex items-center justify-between pb-1 border-b border-amber-200 dark:border-amber-800/60">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>{lang === "bn" ? "পরবর্তী কাস্টমার (Next Customer)" : "Next in Queue"}</span>
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                          {lang === "bn" ? "ডাকের অপেক্ষায়" : "Ready to Serve"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-xl shrink-0 ${isNext ? "bg-amber-400 text-slate-950" : "bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white"
                          }`}>
                          #{String(b.tokenNumber).padStart(3, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className={`font-black truncate ${isNext ? "text-sm sm:text-base text-slate-950 dark:text-white" : "text-xs font-bold text-slate-900 dark:text-white"
                            }`}>
                            {b.guestName}
                          </p>
                          <a
                            href={`tel:${b.guestPhone}`}
                            className="text-[11px] text-teal-700 dark:text-teal-400 font-mono font-bold flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{b.guestPhone}</span>
                          </a>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                          ৳{b.totalAmount}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isNext
                            ? lang === "bn"
                              ? "১ম স্থানে"
                              : "1st in line"
                            : `${idx} জন পেছনে`}
                        </p>
                      </div>
                    </div>

                    {/* Services summary */}
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/90 p-2 rounded-xl border border-slate-100 dark:border-slate-600 flex items-center justify-between">
                      <span className="truncate max-w-[220px]">
                        {b.services?.map((s: any) => s.nameBn).join(" • ")}
                      </span>
                      <span className="shrink-0 text-slate-400 dark:text-slate-400">
                        ~{b.totalDuration} {t.minutes}
                      </span>
                    </div>

                    {/* Actions Bar */}
                    <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 pt-0.5">
                      <button
                        onClick={() => handleStartService(b.id)}
                        className={`col-span-3 sm:flex-1 py-2 px-3 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${isNext
                          ? "bg-[#0D9488] hover:bg-[#115E59] text-white"
                          : "bg-slate-800 hover:bg-slate-900 text-white"
                          }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{lang === "bn" ? "ডাকুন ও সার্ভিস শুরু করুন" : "Start Service"}</span>
                      </button>

                      <button
                        onClick={() => handleCompleteBooking(b.id)}
                        className="py-1.5 px-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-300 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        title="Complete"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>{lang === "bn" ? "সমাপ্ত" : "Done"}</span>
                      </button>

                      <button
                        onClick={() => handleSkipBooking(b.id)}
                        className="py-1.5 px-2 rounded-xl bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        title="Hold / Skip 2 spots"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>{lang === "bn" ? "+২ ধাপ" : "Skip"}</span>
                      </button>

                      <button
                        onClick={() => handleNoShow(b.id)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center justify-center active:scale-95"
                        title="No Show"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !inServiceBooking ? (
            <div className="py-6 text-center text-slate-400 dark:text-slate-400 space-y-1">
              <Ticket className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium">
                {lang === "bn"
                  ? "অনলাইনে অপেক্ষমাণ কোনো সিরিয়াল নেই"
                  : "No online customers currently in queue"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400">
                {lang === "bn"
                  ? "গ্রাহক অ্যাপ বা QR কোড থেকে সিরিয়াল নিলে এখানে সাথে সাথে ভেসে উঠবে।"
                  : "When customers book via QR or app, tokens appear here in real-time."}
              </p>
            </div>
          ) : null}
        </section>

        {/* HYBRID WALK-IN COUNTER CONTROLLER */}
        <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{t.walkInQueueTitle}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === "bn"
                  ? "দোকানে সরাসরি আসা কাস্টমার সংখ্যা বাড়ান/কমান"
                  : "Sync walk-in customers with online app users"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-600 mt-2">
            <button
              onClick={() => handleAdjustWalkIn(-1)}
              className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition flex items-center justify-center font-bold text-xl shadow-xs cursor-pointer"
              title="Decrease walk-in"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                {salon?.manualQueueCount || 0}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t.peopleUnit} {t.queueWaiting}
              </p>
            </div>

            <button
              onClick={() => handleAdjustWalkIn(1)}
              className="w-12 h-12 rounded-xl bg-[#0D9488] text-white hover:bg-[#115E59] active:scale-90 transition flex items-center justify-center font-bold text-xl shadow-xs cursor-pointer"
              title="Increase walk-in"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </section>
      </div >
    </AppShell >
  );
}
