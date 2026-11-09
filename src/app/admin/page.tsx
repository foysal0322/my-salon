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
  Plus,
  Scissors,
  Navigation,
  Trash2,
  MapPin,
  Mail,
  Phone,
  Check,
  ExternalLink,
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
  const [availableReservedCodes, setAvailableReservedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  // Add Salon Modal State
  const [showAddSalonModal, setShowAddSalonModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("23.7461");
  const [longitude, setLongitude] = useState("90.3742");
  const [category, setCategory] = useState<"GENTS" | "LADIES" | "UNISEX">("GENTS");
  const [isAc, setIsAc] = useState(false);
  const [acceptsDigitalPayment, setAcceptsDigitalPayment] = useState(true);
  const [totalChairs, setTotalChairs] = useState("3");
  const [fetchingGps, setFetchingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");
  const [submittingSalon, setSubmittingSalon] = useState(false);
  const [salonFormError, setSalonFormError] = useState("");

  // Services list inside Add Salon
  const defaultServicesList = [
    { nameBn: "চুল কাটা", nameEn: "Hair Cutting", price: "200", durationMins: "25", details: "স্ট্যান্ডার্ড হেয়ারকাট" },
    { nameBn: "দাড়ি শেভ ও ট্রিম", nameEn: "Beard Shave & Trim", price: "120", durationMins: "15", details: "শেভ বা বিয়ার্ড শেপিং" },
    { nameBn: "হেড ম্যাসাজ", nameEn: "Head Massage", price: "250", durationMins: "20", details: "হার্বাল তেল দিয়ে ম্যাসাজ" },
    { nameBn: "ফেসিয়াল ট্রিটমেন্ট", nameEn: "Facial Treatment", price: "500", durationMins: "35", details: "ডিপ ক্লিনজিং ফেসিয়াল" },
  ];
  const [servicesList, setServicesList] = useState(defaultServicesList);

  // Manage existing salon's services drawer/modal
  const [managingSalon, setManagingSalon] = useState<any | null>(null);
  const [newServiceNameBn, setNewServiceNameBn] = useState("");
  const [newServiceNameEn, setNewServiceNameEn] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("25");
  const [addingService, setAddingService] = useState(false);

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
      if (saloonsData.availableReservedCodes) {
        setAvailableReservedCodes(saloonsData.availableReservedCodes);
      }
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

  // Add Salon Handlers
  const handleOpenAddSalon = () => {
    triggerHaptic(20);
    if (availableReservedCodes.length > 0) {
      setSelectedCode(availableReservedCodes[0]);
    } else {
      setSelectedCode("");
    }
    setNameBn("");
    setNameEn("");
    setOwnerName("");
    setOwnerPhone("");
    setEmail("");
    setAddress("");
    setLatitude("23.7461");
    setLongitude("90.3742");
    setCategory("GENTS");
    setIsAc(false);
    setAcceptsDigitalPayment(true);
    setTotalChairs("3");
    setGpsStatus("");
    setSalonFormError("");
    setServicesList([
      { nameBn: "চুল কাটা", nameEn: "Hair Cutting", price: "200", durationMins: "25", details: "স্ট্যান্ডার্ড হেয়ারকাট" },
      { nameBn: "দাড়ি শেভ ও ট্রিম", nameEn: "Beard Shave & Trim", price: "120", durationMins: "15", details: "শেভ বা বিয়ার্ড শেপিং" },
      { nameBn: "হেড ম্যাসাজ", nameEn: "Head Massage", price: "250", durationMins: "20", details: "হার্বাল তেল দিয়ে ম্যাসাজ" },
      { nameBn: "ফেসিয়াল ট্রিটমেন্ট", nameEn: "Facial Treatment", price: "500", durationMins: "35", details: "ডিপ ক্লিনজিং ফেসিয়াল" },
    ]);
    setShowAddSalonModal(true);
  };

  // GPS Location Fetcher
  const handleFetchCurrentLocation = () => {
    triggerHaptic(30);
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("আপনার ডিভাইসে Geolocation সমর্থিত নয়।");
      return;
    }
    setFetchingGps(true);
    setGpsStatus("GPS স্যাটেলাইট থেকে বর্তমান অবস্থান খোঁজা হচ্ছে...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setFetchingGps(false);
        setGpsStatus(`✓ সঠিক জিপিএস কো-অর্ডিনেট সনাক্ত হয়েছে: (${lat}, ${lng})`);
      },
      (error) => {
        setFetchingGps(false);
        setGpsStatus(`লোকেশন পাওয়া যায়নি: ${error.message}`);
        alert(`লোকেশন অ্যাক্সেস করা সম্ভব হয়নি: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAddServiceRow = () => {
    setServicesList([
      ...servicesList,
      { nameBn: "", nameEn: "", price: "", durationMins: "20", details: "" },
    ]);
  };

  const handleRemoveServiceRow = (index: number) => {
    setServicesList(servicesList.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    const updated = [...servicesList];
    updated[index] = { ...updated[index], [field]: value };
    setServicesList(updated);
  };

  const handleCreateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn || !nameEn || !ownerName || !ownerPhone || !address) {
      setSalonFormError("অনুগ্রহ করে প্রয়োজনীয় সকল তথ্য পূরণ করুন।");
      return;
    }

    const codeToAssign = selectedCode || availableReservedCodes[0];
    if (!codeToAssign) {
      setSalonFormError("কোনো সেলুন আইডি নির্বাচন করা হয়নি।");
      return;
    }

    setSubmittingSalon(true);
    setSalonFormError("");
    try {
      const res = await fetch("/api/v1/admin/saloons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToAssign,
          nameBn,
          nameEn,
          ownerName,
          ownerPhone,
          email,
          address,
          latitude: Number(latitude) || 23.7461,
          longitude: Number(longitude) || 90.3742,
          category,
          isAc,
          acceptsDigitalPayment,
          totalChairs: Number(totalChairs) || 3,
          services: servicesList.filter((s) => s.nameBn && s.price),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message || "নতুন সেলুন ও সার্ভিস সফলভাবে তৈরি হয়েছে!");
        setShowAddSalonModal(false);
        fetchAdminData();
      } else {
        setSalonFormError(data.error || "সেলুন তৈরি করতে সমস্যা হয়েছে।");
      }
    } catch (e) {
      setSalonFormError("সার্ভার ত্রুটি");
    } finally {
      setSubmittingSalon(false);
    }
  };

  // Manage Services for Existing Salon
  const handleOpenManageServices = (salon: any) => {
    triggerHaptic(20);
    setManagingSalon(salon);
    setNewServiceNameBn("");
    setNewServiceNameEn("");
    setNewServicePrice("");
    setNewServiceDuration("25");
  };

  const handleAddServiceToSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingSalon || !newServiceNameBn || !newServicePrice) return;
    setAddingService(true);
    try {
      const res = await fetch(`/api/v1/owner/saloons/${managingSalon.id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: newServiceNameBn,
          nameEn: newServiceNameEn || newServiceNameBn,
          price: Number(newServicePrice),
          durationMins: Number(newServiceDuration) || 25,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedServices = [...(managingSalon.services || []), data.service];
        setManagingSalon({ ...managingSalon, services: updatedServices });
        setNewServiceNameBn("");
        setNewServiceNameEn("");
        setNewServicePrice("");
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingService(false);
    }
  };

  const handleDeleteServiceFromSalon = async (serviceId: string) => {
    if (!managingSalon) return;
    if (!confirm("আপনি কি নিশ্চিত যে এই সার্ভিসটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(
        `/api/v1/owner/saloons/${managingSalon.id}/services?serviceId=${serviceId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const updatedServices = (managingSalon.services || []).filter(
          (s: any) => s.id !== serviceId
        );
        setManagingSalon({ ...managingSalon, services: updatedServices });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ADMIN LOGIN SCREEN (If not authenticated as ADMIN)
  if (!isAdminLoggedIn || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white">AmarSalon Super Admin</h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
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
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
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

  // ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-3.5 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight text-white">
              AmarSalon Admin Console
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400">
              সুপার এডমিন কন্ট্রোল ও ভেরিফিকেশন প্যানেল
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <Link
            href="/"
            className="text-[11px] sm:text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            গ্রাহক ভিউ দেখুন
          </Link>

          <button
            onClick={() => {
              logout();
              setIsAdminLoggedIn(false);
            }}
            className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 cursor-pointer transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === "subscriptions"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>পেমেন্ট ভেরিফিকেশন ({subscriptions.filter((s) => s.status === "PENDING").length})</span>
          </button>

          <button
            onClick={() => setActiveTab("saloons")}
            className={`shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === "saloons"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
          >
            <Building className="w-4 h-4" />
            <span>সেলুন সমূহ ({saloons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === "users"
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
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="text-sm font-bold text-white">MFS / ব্যাংক সাবস্ক্রিপশন তালিকা</h2>
              <span className="text-[11px] sm:text-xs text-slate-400">TrxID যাচাই করে মেয়াদ বৃদ্ধি করুন</span>
            </div>

            {/* Mobile View: Cards */}
            <div className="block md:hidden divide-y divide-slate-800/80">
              {subscriptions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">কোনো সাবস্ক্রিপশন রেকর্ড পাওয়া যায়নি</div>
              ) : (
                subscriptions.map((sub) => {
                  const isPending = sub.status === "PENDING";
                  return (
                    <div key={sub.id} className="p-3.5 space-y-3 hover:bg-slate-800/30 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {sub.saloon?.code && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                                #{sub.saloon.code}
                              </span>
                            )}
                            <span className="font-bold text-white text-sm">{sub.saloon?.nameBn || "N/A"}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            মালিক: {sub.saloon?.owner?.name} ({sub.saloon?.phone})
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${sub.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : sub.status === "PENDING"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                        >
                          {sub.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <div>
                          <span className="text-[10px] text-slate-400 block">প্যাকেজ ও মেথড</span>
                          <span className="font-mono font-bold text-teal-300">{sub.planType}</span>
                          <span className="ml-1 text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            {sub.paymentMethod}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">টাকার পরিমাণ</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">৳{sub.amount}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-800/60">
                          <span className="text-[10px] text-slate-400 block">TrxID ও প্রেরক</span>
                          <span className="font-mono font-bold text-amber-400 text-xs break-all">{sub.trxId || "N/A"}</span>
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">({sub.senderNumber})</span>
                          {sub.adminNote && (
                            <p className="text-[11px] text-teal-300 mt-1 font-mono bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">{sub.adminNote}</p>
                          )}
                          {sub.receiptUrl && (
                            <a
                              href={sub.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-semibold underline mt-1"
                            >
                              <span>ইনভয়েস / স্ক্রিনশট দেখুন</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {isPending ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => handleVerifySub(sub.id, "APPROVE")}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>অনুমোদন</span>
                          </button>
                          <button
                            onClick={() => handleVerifySub(sub.id, "REJECT")}
                            className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>বাতিল</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-slate-500 text-[11px]">প্রক্রিয়াকৃত</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
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
                          <div className="flex items-center gap-2">
                            {sub.saloon?.code && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs shrink-0">
                                #{sub.saloon.code}
                              </span>
                            )}
                            <p className="font-bold">{sub.saloon?.nameBn || "N/A"}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                            মালিক: {sub.saloon?.owner?.name} ({sub.saloon?.phone})
                          </p>
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-300">
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
                          {sub.adminNote && (
                            <p className="text-[10px] text-teal-300 max-w-[200px] truncate" title={sub.adminNote}>{sub.adminNote}</p>
                          )}
                          {sub.receiptUrl && (
                            <a
                              href={sub.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 font-semibold underline mt-0.5"
                            >
                              <span>ইনভয়েস দেখুন</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-white">৳{sub.amount}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sub.status === "APPROVED"
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
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">নিবন্ধিত সেলুন সমূহ</h2>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {saloons.length}টি
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  এডমিন সংরক্ষিত আইডি (১০০১-১০৫০): খালি আছে{" "}
                  <span className="text-amber-400 font-mono font-bold">
                    {availableReservedCodes.length}টি
                  </span>
                </p>
              </div>

              <button
                onClick={handleOpenAddSalon}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সেলুন ও সার্ভিস যোগ করুন</span>
              </button>
            </div>

            {/* Mobile View: Cards */}
            <div className="block md:hidden divide-y divide-slate-800/80">
              {saloons.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">কোনো সেলুন পাওয়া যায়নি</div>
              ) : (
                saloons.map((s) => (
                  <div key={s.id} className="p-3.5 space-y-3 hover:bg-slate-800/30 transition">
                    {/* Top: Code + Name + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-black text-sm tracking-wide shrink-0">
                          #{s.code || "N/A"}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white leading-tight">{s.nameBn}</h3>
                          <p className="text-[11px] text-slate-300">{s.nameEn}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${s.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                          }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    {/* Location */}
                    <p className="text-[11px] text-slate-300 flex items-start gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span>{s.address}</span>
                    </p>

                    {/* Badges / Features */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">
                        {s.category === "GENTS"
                          ? "👨 জেন্টস"
                          : s.category === "LADIES"
                            ? "👩 লেডিস"
                            : "👥 ইউনিসেক্স"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded ${s.isAc
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : "bg-slate-800 text-slate-400"
                          }`}
                      >
                        {s.isAc ? "❄️ AC" : "Non-AC"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded ${s.acceptsDigitalPayment !== false
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400"
                          }`}
                      >
                        {s.acceptsDigitalPayment !== false ? "✓ ডিজিটাল পে" : "ক্যাশ"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                        🪑 {s.totalChairs}টি চেয়ার
                      </span>
                    </div>

                    {/* Owner Info */}
                    <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/60 pt-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">মালিক</span>
                        <span className="font-medium text-white">{s.owner?.name || "N/A"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">যোগাযোগ</span>
                        <a
                          href={`tel:${s.owner?.phone || s.phone}`}
                          className="font-mono text-teal-400 hover:underline text-[11px]"
                        >
                          {s.owner?.phone || s.phone}
                        </a>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => handleOpenManageServices(s)}
                        className="py-2 px-1 rounded-xl bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 border border-teal-500/30 cursor-pointer text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 active:scale-95 transition"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span className="truncate">সার্ভিস ({s.services?.length || s._count?.services || 0})</span>
                      </button>
                      <button
                        onClick={() => handleExtendTrial(s.id)}
                        className="py-2 px-1 rounded-xl bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40 border border-cyan-500/30 cursor-pointer text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 active:scale-95 transition"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>+১৫ দিন</span>
                      </button>
                      <button
                        onClick={() => handleToggleSalonStatus(s.id, s.status)}
                        className={`py-2 px-1 rounded-xl font-bold text-[11px] cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 transition ${s.status === "ACTIVE"
                          ? "bg-rose-600/20 text-rose-300 hover:bg-rose-600/40 border border-rose-500/30"
                          : "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/30"
                          }`}
                      >
                        {s.status === "ACTIVE" ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{s.status === "ACTIVE" ? "স্থগিত" : "সক্রিয়"}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 text-center">সেলুন আইডি</th>
                    <th className="p-3">নাম ও অবস্থান</th>
                    <th className="p-3">ক্যাটাগরি ও সুবিধা</th>
                    <th className="p-3">চেয়ার</th>
                    <th className="p-3">মালিক ও যোগাযোগ</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {saloons.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-center">
                        <span className="inline-block px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-black text-sm tracking-wide shadow-xs">
                          #{s.code || "N/A"}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">
                        <p className="text-sm text-white font-bold">{s.nameBn}</p>
                        <p className="text-[11px] text-slate-300 font-normal">{s.nameEn}</p>
                        <p className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{s.address}</span>
                        </p>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                            {s.category === "GENTS"
                              ? "👨 জেন্টস"
                              : s.category === "LADIES"
                                ? "👩 লেডিস"
                                : "👥 ইউনিসেক্স"}
                          </span>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded ${s.isAc
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "bg-slate-800 text-slate-400"
                                }`}
                            >
                              {s.isAc ? "AC" : "Non-AC"}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded ${s.acceptsDigitalPayment !== false
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-800 text-slate-400"
                                }`}
                            >
                              {s.acceptsDigitalPayment !== false ? "ডিজিটাল পে" : "ক্যাশ"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-300">{s.totalChairs}টি</td>
                      <td className="p-3">
                        <p className="text-white font-medium">{s.owner?.name}</p>
                        <p className="text-slate-400 font-mono text-[11px]">
                          {s.owner?.phone || s.phone}
                        </p>
                        {(s.owner?.email || s.email) && (
                          <p className="text-slate-500 text-[10px] truncate max-w-[140px]">
                            {s.owner?.email || s.email}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                            }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenManageServices(s)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 border border-teal-500/30 cursor-pointer text-[11px] font-bold inline-flex items-center gap-1"
                          title="সার্ভিস সমূহ পরিচালনা করুন"
                        >
                          <Scissors className="w-3 h-3" />
                          <span>সার্ভিস ({s.services?.length || s._count?.services || 0})</span>
                        </button>
                        <button
                          onClick={() => handleExtendTrial(s.id)}
                          className="px-2 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40 border border-cyan-500/30 cursor-pointer text-[10px]"
                        >
                          +১৫ দিন
                        </button>
                        <button
                          onClick={() => handleToggleSalonStatus(s.id, s.status)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer ${s.status === "ACTIVE"
                            ? "bg-rose-600/20 text-rose-300 hover:bg-rose-600/40 border border-rose-500/30"
                            : "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/30"
                            }`}
                        >
                          {s.status === "ACTIVE" ? "স্থগিত" : "সক্রিয়"}
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
            <div className="p-3.5 sm:p-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">ব্যবহারকারী তালিকা</h2>
            </div>

            {/* Mobile View: Cards */}
            <div className="block md:hidden divide-y divide-slate-800/80">
              {usersList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">কোনো ব্যবহারকারী পাওয়া যায়নি</div>
              ) : (
                usersList.map((u) => (
                  <div key={u.id} className="p-3.5 space-y-2.5 hover:bg-slate-800/30 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white text-sm">{u.name || "N/A"}</p>
                        <p className="font-mono text-slate-300 text-xs mt-0.5">{u.phone}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          {u.role}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {u.status}
                        </span>
                      </div>
                    </div>
                    {u.role !== "ADMIN" && (
                      <div className="pt-1">
                        <button
                          onClick={() => handleToggleUserRole(u.id, u.role)}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition active:scale-[0.98]"
                        >
                          {u.role === "CUSTOMER" ? "রোল পরিবর্তন করুন: Make Owner" : "রোল পরিবর্তন করুন: Make Customer"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
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

        {/* MODAL: ADD SALON & SERVICES */}
        {showAddSalonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto text-slate-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">নতুন সেলুন ও সার্ভিস যোগ করুন</h3>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      এডমিন কর্তৃক সংরক্ষিত আইডি (১০০১-১০৫০) বরাদ্দ ও প্রোফাইল তৈরি
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSalonModal(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {salonFormError && (
                <div className="my-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{salonFormError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSalon} className="space-y-4 sm:space-y-5 mt-4">
                {/* Section 1: Salon ID & Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>১. সেলুন আইডি ও প্রাথমিক তথ্য</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Salon ID */}
                    <div className="sm:col-span-2 bg-slate-950 p-3 sm:p-3.5 rounded-2xl border border-slate-800">
                      <label className="block text-xs font-bold text-amber-300 mb-1">
                        সেলুন আইডি নির্বাচন (সংরক্ষিত: ১০০১ - ১০৫০) <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={selectedCode}
                        onChange={(e) => setSelectedCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-amber-400"
                        required
                      >
                        <option value="">-- উপলব্ধ সংরক্ষিত আইডি বেছে নিন --</option>
                        {availableReservedCodes.map((code) => (
                          <option key={code} value={code}>
                            আইডি #{code} (উপলব্ধ / Reserved)
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        💡 পূর্বে ব্যবহৃত আইডিগুলো ড্রপডাউনে আসবে না। সেলুন মালিকরা নিজ থেকে রেজিস্টার করলে তাদের আইডি শুরু হবে <strong className="text-amber-400">১০৫১</strong> থেকে।
                      </p>
                    </div>

                    {/* Salon Name Bn */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        সেলুনের নাম (বাংলা) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nameBn}
                        onChange={(e) => setNameBn(e.target.value)}
                        placeholder="যেমন: রয়েল জেন্টস সেলুন"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Salon Name En */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        সেলুনের নাম (English) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="e.g. Royal Gents Salon"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Owner Info */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>২. মালিকের বিবরণ ও যোগাযোগ</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        মালিকের নাম <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        মোবাইল নম্বর <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        ইমেইল (ঐচ্ছিক)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Facilities, Category & Chairs */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>৩. ক্যাটাগরি, চেয়ার ও সুবিধাসমূহ</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        ক্যাটাগরি
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-medium"
                      >
                        <option value="GENTS">👨 জেন্টস সেলুন (Gents)</option>
                        <option value="LADIES">👩 লেডিস পার্লার (Ladies)</option>
                        <option value="UNISEX">👥 ইউনিসেক্স (Unisex)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        মোট চেয়ার সংখ্যা
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={totalChairs}
                        onChange={(e) => setTotalChairs(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        এয়ার কন্ডিশন (AC)
                      </label>
                      <select
                        value={isAc ? "true" : "false"}
                        onChange={(e) => setIsAc(e.target.value === "true")}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-medium"
                      >
                        <option value="true">❄️ শীতাতপ নিয়ন্ত্রিত (AC)</option>
                        <option value="false">নন-এসি (Non-AC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        ডিজিটাল পেমেন্ট
                      </label>
                      <select
                        value={acceptsDigitalPayment ? "true" : "false"}
                        onChange={(e) => setAcceptsDigitalPayment(e.target.value === "true")}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-medium"
                      >
                        <option value="true">✓ বিকাশ / নগদ গ্রহণযোগ্য</option>
                        <option value="false">শুধুমাত্র নগদ ক্যাশ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Address & GPS Geolocation */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>৪. সেলুনের ঠিকানা ও মানচিত্র লোকেশন</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      সম্পূর্ণ ঠিকানা <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="বাড়ি #১২, রোড #৪, সেক্টর #৩, ধানমন্ডি, ঢাকা"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* GPS Coordinates Fetcher */}
                  <div className="bg-slate-950 p-3 sm:p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                        <span>মানচিত্র কো-অর্ডিনেট (Latitude & Longitude)</span>
                      </span>

                      <button
                        type="button"
                        onClick={handleFetchCurrentLocation}
                        disabled={fetchingGps}
                        className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50 active:scale-98"
                      >
                        <Navigation className={`w-3.5 h-3.5 ${fetchingGps ? "animate-spin" : ""}`} />
                        <span>{fetchingGps ? "GPS খোঁজা হচ্ছে..." : "বর্তমান সঠিক লোকেশন নিন (Fetch GPS)"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Latitude (অক্ষাংশ)</label>
                        <input
                          type="text"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Longitude (দ্রাঘিমাংশ)</label>
                        <input
                          type="text"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {gpsStatus && (
                      <p className="text-[11px] text-emerald-400 font-mono font-medium">
                        {gpsStatus}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section 5: Services Configurator */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5" />
                        <span>৫. সেলুনের প্রাথমিক সার্ভিস ও মূল্য তালিকা</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        সেলুন চালুর সাথে সাথে এই সেবাগুলো গ্রাহকরা দেখতে পাবেন
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddServiceRow}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition active:scale-98"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>সার্ভিস যোগ করুন</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {servicesList.map((srv, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center"
                      >
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden">সার্ভিসের নাম (বাংলা)</label>
                          <input
                            type="text"
                            required
                            placeholder="সার্ভিসের নাম (বাংলা)"
                            value={srv.nameBn}
                            onChange={(e) => handleServiceChange(idx, "nameBn", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden">Name (English)</label>
                          <input
                            type="text"
                            placeholder="Name (English)"
                            value={srv.nameEn}
                            onChange={(e) => handleServiceChange(idx, "nameEn", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-12 gap-2 sm:contents">
                          <div className="col-span-5 sm:col-span-2">
                            <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden">মূল্য ৳</label>
                            <input
                              type="number"
                              required
                              min="0"
                              placeholder="মূল্য ৳"
                              value={srv.price}
                              onChange={(e) => handleServiceChange(idx, "price", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                            />
                          </div>

                          <div className="col-span-5 sm:col-span-2">
                            <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden">সময়কাল</label>
                            <select
                              value={srv.durationMins}
                              onChange={(e) =>
                                handleServiceChange(idx, "durationMins", e.target.value)
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
                            >
                              <option value="15">১৫ মি.</option>
                              <option value="20">২০ মি.</option>
                              <option value="25">২৫ মি.</option>
                              <option value="30">৩০ মি.</option>
                              <option value="40">৪০ মি.</option>
                              <option value="60">৬০ মি.</option>
                            </select>
                          </div>

                          <div className="col-span-2 sm:col-span-1 flex items-end sm:items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveServiceRow(idx)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddSalonModal(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition cursor-pointer active:scale-98"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    disabled={submittingSalon}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {submittingSalon ? "তৈরি হচ্ছে..." : "সেলুন ও সার্ভিস যুক্ত করুন"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: MANAGE EXISTING SALON SERVICES */}
        {managingSalon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative my-auto max-h-[88vh] overflow-y-auto text-slate-200">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      সার্ভিস তালিকা — {managingSalon.nameBn}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                      সেলুন আইডি: #{managingSalon.code || "N/A"} • মোট{" "}
                      {managingSalon.services?.length || 0}টি সার্ভিস
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingSalon(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Current Services Table */}
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  বিদ্যমান সার্ভিসসমূহ:
                </h4>
                {!managingSalon.services || managingSalon.services.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                    কোনো সার্ভিস পাওয়া যায়নি। নিচের ফর্ম থেকে নতুন সার্ভিস যোগ করুন।
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    {managingSalon.services.map((srv: any) => (
                      <div
                        key={srv.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/50"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{srv.nameBn}</p>
                          <p className="text-[11px] text-slate-400">
                            {srv.nameEn} • {srv.durationMins} মিনিট
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-emerald-400">
                            ৳{srv.price}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteServiceFromSalon(srv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Service to This Salon */}
              <form
                onSubmit={handleAddServiceToSalon}
                className="mt-5 p-3.5 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন সার্ভিস যোগ করুন</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      সার্ভিসের নাম (বাংলা) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newServiceNameBn}
                      onChange={(e) => setNewServiceNameBn(e.target.value)}
                      placeholder="যেমন: স্পেশাল হেয়ার স্পা"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Name (English)
                    </label>
                    <input
                      type="text"
                      value={newServiceNameEn}
                      onChange={(e) => setNewServiceNameEn(e.target.value)}
                      placeholder="e.g. Special Hair Spa"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      মূল্য (৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      placeholder="৩৫০"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      সময়কাল (মিনিট)
                    </label>
                    <input
                      type="number"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(e.target.value)}
                      placeholder="২৫"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addingService}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {addingService ? "যোগ হচ্ছে..." : "সার্ভিসটি সংরক্ষণ করুন"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div >
    </div >
  );
}
