"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Armchair,
  Users,
  Plus,
  Minus,
  Megaphone,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Receipt,
  SkipForward,
  UserX,
  RefreshCw,
  CreditCard,
  Phone,
  Ticket,
  BellRing,
  Play,
} from "lucide-react";

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { lang, t, user, activeSalonId, playChime, triggerHaptic } = useApp();

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
    if (!activeSalonId) {
      setLoading(false);
      return;
    }
    try {
      // 1. Fetch salon data
      const res = await fetch(`/api/v1/owner/saloons?ownerId=${user?.id}`);
      const data = await res.json();
      if (data.saloons && data.saloons.length > 0) {
        const current =
          data.saloons.find((s: any) => s.id === activeSalonId) || data.saloons[0];
        setSalon(current);
      }

      // 2. Fetch subscription status
      const subRes = await fetch(`/api/v1/owner/subscriptions?saloonId=${activeSalonId}`);
      const subData = await subRes.json();
      setSubStatus(subData);

      // 3. Fetch today's live online queue bookings
      const bookRes = await fetch(`/api/v1/bookings?saloonId=${activeSalonId}`);
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
          setTimeout(() => setNewBookingAlert(null), 6000);
        }
        prevWaitingCount.current = waiting.length;

        setWaitingBookings(waiting);
        setInServiceBooking(inService);
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

  // TOGGLE CHAIR
  const handleToggleChair = async (chairNo: number) => {
    if (!activeSalonId) return;
    triggerHaptic(40);
    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_CHAIR", chairNo }),
      });
      const data = await res.json();
      if (data.success && salon) {
        setSalon({
          ...salon,
          chairStates: data.chairStates,
          busyChairs: data.busyChairs,
          freeChairs: salon.totalChairs - data.busyChairs,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

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
            href="/login?role=owner"
            className="text-xs font-bold bg-[#0D9488] text-white px-5 py-2.5 rounded-full"
          >
            {t.login}
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
            <h1 className="text-lg font-bold text-slate-900">{t.navQueue}</h1>
            <p className="text-xs text-slate-500">
              {lang === "bn"
                ? "লাইভ সিরিয়াল ও চেয়ার কন্ট্রোল"
                : "Live Floor & Queue Controller"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRefreshing(true);
                fetchDashboardData();
              }}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
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
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 p-4 rounded-3xl shadow-lg hover:shadow-xl active:scale-98 transition flex items-center justify-between gap-3 cursor-pointer disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-950/10 flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6 text-slate-950 animate-bounce" />
            </div>

            <div className="text-left flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                {nextCustomer
                  ? lang === "bn"
                    ? `পরবর্তী: #${String(nextCustomer.tokenNumber).padStart(3, "0")} (${nextCustomer.guestName})`
                    : `Next: #${String(nextCustomer.tokenNumber).padStart(3, "0")} (${nextCustomer.guestName})`
                  : lang === "bn"
                  ? "সিরিয়াল ডাকুন"
                  : "Call Next"}
              </p>
              <h2 className="text-base font-extrabold text-slate-950 truncate">
                {t.callNextCustomer}
              </h2>
            </div>

            <div className="text-right shrink-0 bg-white/30 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20">
              <p className="text-[10px] font-bold text-slate-900">{t.currentServing}</p>
              <p className="font-mono font-black text-lg text-slate-950 leading-tight">
                #{String(salon?.currentServingToken || 0).padStart(3, "0")}
              </p>
            </div>
          </button>
        </section>

        {/* LIVE ONLINE QUEUE LIST (CUSTOMER UPDATES APPEAR HERE) */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {lang === "bn" ? "অনলাইন লাইভ সিরিয়াল" : "Live Online Queue"}
              </h3>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {waitingBookings.length} {t.peopleUnit} {t.queueWaiting}
            </span>
          </div>

          {/* Currently In Service Customer Card */}
          {inServiceBooking && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-300 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Play className="w-3 h-3 fill-teal-800" />
                  <span>{lang === "bn" ? "বর্তমানে সেবা নিচ্ছেন" : "Currently In Chair"}</span>
                </span>
                <span className="font-mono font-black text-base text-teal-900">
                  #{String(inServiceBooking.tokenNumber).padStart(3, "0")}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{inServiceBooking.guestName}</p>
                  <a
                    href={`tel:${inServiceBooking.guestPhone}`}
                    className="text-teal-700 font-mono text-[11px] flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{inServiceBooking.guestPhone}</span>
                  </a>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    ৳{inServiceBooking.totalAmount}
                  </span>
                  <p className="text-[10px] text-slate-500">
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
              {waitingBookings.map((b, idx) => (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-black text-sm bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg shrink-0">
                        #{String(b.tokenNumber).padStart(3, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {b.guestName}
                        </p>
                        <a
                          href={`tel:${b.guestPhone}`}
                          className="text-[11px] text-slate-500 font-mono flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-teal-600" />
                          <span>{b.guestPhone}</span>
                        </a>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-xs text-slate-900 font-mono">
                        ৳{b.totalAmount}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {idx === 0
                          ? lang === "bn"
                            ? "পরবর্তী গ্রাহক"
                            : "Next in line"
                          : `${idx} জন পেছনে`}
                      </p>
                    </div>
                  </div>

                  {/* Services summary */}
                  <div className="text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="truncate max-w-[220px]">
                      {b.services?.map((s: any) => s.nameBn).join(" • ")}
                    </span>
                    <span className="shrink-0 text-slate-400">
                      ~{b.totalDuration} {t.minutes}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      onClick={() => handleStartService(b.id)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-[#0D9488] hover:bg-[#115E59] text-white font-bold text-[11px] shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>{lang === "bn" ? "ডাকুন / শুরু" : "Start"}</span>
                    </button>

                    <button
                      onClick={() => handleCompleteBooking(b.id)}
                      className="py-1.5 px-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Complete"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{lang === "bn" ? "সমাপ্ত" : "Done"}</span>
                    </button>

                    <button
                      onClick={() => handleSkipBooking(b.id)}
                      className="py-1.5 px-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Hold / Skip 2 spots"
                    >
                      <SkipForward className="w-3 h-3" />
                      <span>{lang === "bn" ? "+২ ধাপ" : "Skip"}</span>
                    </button>

                    <button
                      onClick={() => handleNoShow(b.id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                      title="No Show"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !inServiceBooking ? (
            <div className="py-6 text-center text-slate-400 space-y-1">
              <Ticket className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">
                {lang === "bn"
                  ? "অনলাইনে অপেক্ষমাণ কোনো সিরিয়াল নেই"
                  : "No online customers currently in queue"}
              </p>
              <p className="text-[10px] text-slate-400">
                {lang === "bn"
                  ? "গ্রাহক অ্যাপ বা QR কোড থেকে সিরিয়াল নিলে এখানে সাথে সাথে ভেসে উঠবে।"
                  : "When customers book via QR or app, tokens appear here in real-time."}
              </p>
            </div>
          ) : null}
        </section>

        {/* CHAIR GRID MATRIX (THE ONE-TAP CONSOLE) */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Armchair className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.chairMatrix}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {lang === "bn" ? "বড় বাটন (ভেজা হাতে ব্যবহারযোগ্য)" : "Oversized Touch Cards"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {salon?.chairStates && Array.isArray(salon.chairStates) ? (
              salon.chairStates.map((chair: any) => {
                const isBusy = chair.isBusy;
                return (
                  <button
                    key={chair.chairNo}
                    type="button"
                    onClick={() => handleToggleChair(chair.chairNo)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[90px] active:scale-95 ${
                      isBusy
                        ? "bg-rose-50 border-rose-400 text-rose-900 shadow-xs"
                        : "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-extrabold">
                        {lang === "bn" ? `চেয়ার #${chair.chairNo}` : `Chair #${chair.chairNo}`}
                      </span>
                      <span
                        className={`w-3 h-3 rounded-full ${
                          isBusy ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                        }`}
                      />
                    </div>

                    <div className="text-left mt-2">
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded-lg ${
                          isBusy ? "bg-rose-200 text-rose-900" : "bg-emerald-200 text-emerald-950"
                        }`}
                      >
                        {isBusy ? t.chairBusy : t.chairFree}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {isBusy
                          ? lang === "bn"
                            ? "ট্যাপ করে খালি করুন"
                            : "Tap to free"
                          : lang === "bn"
                          ? "ট্যাপ করে ব্যস্ত করুন"
                          : "Tap to book"}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 col-span-2">{t.loading}</p>
            )}
          </div>
        </section>

        {/* HYBRID WALK-IN COUNTER CONTROLLER */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>{t.walkInQueueTitle}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === "bn"
                  ? "দোকানে সরাসরি আসা কাস্টমার সংখ্যা বাড়ান/কমান"
                  : "Sync walk-in customers with online app users"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-2">
            <button
              onClick={() => handleAdjustWalkIn(-1)}
              className="w-12 h-12 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 active:scale-90 transition flex items-center justify-center font-bold text-xl shadow-xs cursor-pointer"
              title="Decrease walk-in"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="text-center">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {salon?.manualQueueCount || 0}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
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

        {/* QUICK LEDGER ENTRY & QR SHORTCUTS */}
        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/owner/ledger"
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-400 transition flex items-center gap-2.5"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{t.navLedger}</p>
              <p className="text-[10px] text-slate-500">
                {lang === "bn" ? "আয়-ব্যয়ের হিসাব" : "Income & Sales"}
              </p>
            </div>
          </Link>

          <Link
            href="/owner/profile"
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-400 transition flex items-center gap-2.5"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{t.navProfile}</p>
              <p className="text-[10px] text-slate-500">
                {lang === "bn" ? "A4 QR ও সাবস্ক্রিপশন" : "QR & Package"}
              </p>
            </div>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
