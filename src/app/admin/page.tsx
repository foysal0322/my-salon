"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  Shield,
  CreditCard,
  Building,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Lock,
  ArrowRight,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function AdminPage() {
  const { lang, user, setUser, logout, triggerHaptic } = useApp();

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPhone, setAdminPhone] = useState("01700000000");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"subscriptions" | "saloons" | "users">("subscriptions");

  // Admin Data State
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [saloons, setSaloons] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    if (user?.role === "ADMIN") {
      setIsAdminLoggedIn(true);
      fetchAdminData();
    }
  }, [user]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/v1/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: adminPhone, password: adminPassword }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setIsAdminLoggedIn(true);
      } else {
        setLoginError(data.error || "লগইন ব্যর্থ হয়েছে।");
      }
    } catch (e) {
      setLoginError("সার্ভার ত্রুটি");
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [subsRes, saloonsRes, usersRes] = await Promise.all([
        fetch("/api/v1/admin/subscriptions"),
        fetch("/api/v1/admin/saloons"),
        fetch("/api/v1/admin/users"),
      ]);

      const subsData = await subsRes.json();
      const saloonsData = await saloonsRes.json();
      const usersData = await usersRes.json();

      if (subsData.subscriptions) setSubscriptions(subsData.subscriptions);
      if (saloonsData.saloons) setSaloons(saloonsData.saloons);
      if (usersData.users) setUsersList(usersData.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Subscription Approval / Rejection
  const handleVerifySub = async (subscriptionId: string, action: "APPROVE" | "REJECT") => {
    triggerHaptic(40);
    const note = prompt(
      action === "APPROVE"
        ? "অনুমোদনের জন্য এডমিন নোট লিখুন (ঐচ্ছিক):"
        : "বাতিলের কারণ লিখুন:"
    );
    if (note === null) return;

    try {
      const res = await fetch("/api/v1/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, action, adminNote: note }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Salon Status Toggle
  const handleToggleSalonStatus = async (saloonId: string, currentStatus: string) => {
    triggerHaptic(30);
    const newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      await fetch("/api/v1/admin/saloons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saloonId, status: newStatus }),
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // Extend Trial
  const handleExtendTrial = async (saloonId: string) => {
    triggerHaptic(30);
    try {
      await fetch("/api/v1/admin/saloons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saloonId, extendDays: 15 }),
      });
      alert("ট্রায়াল মেয়াদ ১৫ দিন বৃদ্ধি করা হয়েছে!");
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // User Role Toggle
  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "CUSTOMER" ? "OWNER" : "CUSTOMER";
    try {
      await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // ADMIN LOGIN SCREEN (If not authenticated as ADMIN)
  if (!isAdminLoggedIn || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white">AmarSaloon Super Admin</h1>
            <p className="text-xs text-slate-400 mt-1">
              সিস্টেম এডমিন পোর্টাল — নিরাপদ প্রবেশাধিকার
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                এডমিন মোবাইল নম্বর বা ইউজারনেম
              </label>
              <input
                type="text"
                required
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-mono">
              Demo Seed: Phone: 01700000000 / Pass: admin123
            </p>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>লগইন করুন</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
              ← কাস্টমার হোমে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // WIDESCREEN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none text-white">
              AmarSaloon Admin Console
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              সুপার এডমিন কন্ট্রোল ও ভেরিফিকেশন প্যানেল
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            গ্রাহক ভিউ দেখুন
          </Link>

          <button
            onClick={() => {
              logout();
              setIsAdminLoggedIn(false);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === "subscriptions"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>পেমেন্ট ভেরিফিকেশন ({subscriptions.filter((s) => s.status === "PENDING").length})</span>
          </button>

          <button
            onClick={() => setActiveTab("saloons")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === "saloons"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>সেলুন সমূহ ({saloons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ব্যবহারকারী ({usersList.length})</span>
          </button>
        </div>

        {actionMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs">
            {actionMsg}
          </div>
        )}

        {/* TAB 1: SUBSCRIPTIONS VERIFICATION */}
        {activeTab === "subscriptions" && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">MFS / ব্যাংক সাবস্ক্রিপশন তালিকা</h2>
              <span className="text-xs text-slate-400">TrxID যাচাই করে মেয়াদ বৃদ্ধি করুন</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">সেলুন নাম</th>
                    <th className="p-3">প্যাকেজ</th>
                    <th className="p-3">পেমেন্ট মেথড</th>
                    <th className="p-3">প্রেরক নম্বর ও TrxID</th>
                    <th className="p-3">টাকার পরিমাণ</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subscriptions.map((sub) => {
                    const isPending = sub.status === "PENDING";
                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-white">
                          <p>{sub.saloon?.nameBn}</p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            মালিক: {sub.saloon?.owner?.name} ({sub.saloon?.phone})
                          </p>
                        </td>
                        <td className="p-3 font-mono font-bold text-purple-300">
                          {sub.planType}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 font-mono font-bold text-slate-300">
                            {sub.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          <p className="text-amber-400 font-bold">{sub.trxId || "N/A"}</p>
                          <p className="text-[10px] text-slate-400">{sub.senderNumber}</p>
                        </td>
                        <td className="p-3 font-mono font-bold text-white">৳{sub.amount}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : sub.status === "PENDING"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleVerifySub(sub.id, "APPROVE")}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                              >
                                অনুমোদন
                              </button>
                              <button
                                onClick={() => handleVerifySub(sub.id, "REJECT")}
                                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer"
                              >
                                বাতিল
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-500 text-[11px]">প্রক্রিয়াকৃত</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SALOON MANAGEMENT */}
        {activeTab === "saloons" && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">নিবন্ধিত সেলুন সমূহ</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">নাম ও অবস্থান</th>
                    <th className="p-3">ক্যাটাগরি</th>
                    <th className="p-3">চেয়ার</th>
                    <th className="p-3">মালিকের নাম ও ফোন</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {saloons.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">
                        <p>{s.nameBn}</p>
                        <p className="text-[11px] text-slate-400 font-normal">{s.address}</p>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {s.category} {s.isAc ? "• AC" : ""}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{s.totalChairs}টি</td>
                      <td className="p-3">
                        <p className="text-white">{s.owner?.name}</p>
                        <p className="text-slate-400 font-mono text-[10px]">{s.owner?.phone}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleExtendTrial(s.id)}
                          className="px-2 py-1 rounded bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 cursor-pointer text-[10px]"
                        >
                          +১৫ দিন ট্রায়াল
                        </button>
                        <button
                          onClick={() => handleToggleSalonStatus(s.id, s.status)}
                          className={`px-2.5 py-1 rounded font-bold text-[11px] cursor-pointer ${
                            s.status === "ACTIVE"
                              ? "bg-rose-600/30 text-rose-300 hover:bg-rose-600/50"
                              : "bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50"
                          }`}
                        >
                          {s.status === "ACTIVE" ? "স্থগিত করুন" : "সক্রিয় করুন"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">ব্যবহারকারী তালিকা</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">নাম</th>
                    <th className="p-3">মোবাইল</th>
                    <th className="p-3">রোল</th>
                    <th className="p-3">অবস্থা</th>
                    <th className="p-3 text-right">রোল পরিবর্তন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">{u.name || "N/A"}</td>
                      <td className="p-3 font-mono text-slate-300">{u.phone}</td>
                      <td className="p-3 font-bold text-teal-400">{u.role}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.role !== "ADMIN" && (
                          <button
                            onClick={() => handleToggleUserRole(u.id, u.role)}
                            className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          >
                            {u.role === "CUSTOMER" ? "Make Owner" : "Make Customer"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
