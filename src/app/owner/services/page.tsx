"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Scissors,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const PRESET_TEMPLATES = [
  { nameBn: "চুল কাটা (Hair Cut)", nameEn: "Hair Cut", price: 200, durationMins: 25 },
  { nameBn: "দাড়ি শেভ ও ট্রিম (Beard Trim)", nameEn: "Beard Shave", price: 120, durationMins: 15 },
  { nameBn: "গোল্ডেন ফেসিয়াল (Facial)", nameEn: "Facial", price: 600, durationMins: 40 },
  { nameBn: "হেড ম্যাসাজ ও অয়েলিং", nameEn: "Head Massage", price: 250, durationMins: 20 },
  { nameBn: "ম্যানিকিউর ও পেডিকিউর", nameEn: "Mani-Pedi", price: 800, durationMins: 45 },
  { nameBn: "চুল কালার ও ডাই", nameEn: "Hair Color", price: 500, durationMins: 35 },
];

export default function OwnerServicesPage() {
  const { lang, t, activeSalonId, triggerHaptic } = useApp();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [price, setPrice] = useState("");
  const [durationMins, setDurationMins] = useState("25");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    if (!activeSalonId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/services`);
      const data = await res.json();
      if (data.services) {
        setServices(data.services);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [activeSalonId]);

  const handleToggleActive = async (service: any) => {
    triggerHaptic(25);
    try {
      await fetch(`/api/v1/owner/saloons/${activeSalonId}/services`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          isActive: !service.isActive,
        }),
      });
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (serviceId: string) => {
    const confirmDel = window.confirm(
      lang === "bn"
        ? "আপনি কি নিশ্চিত যে সার্ভিসটি মুছে ফেলতে চান?"
        : "Are you sure you want to delete this service?"
    );
    if (!confirmDel) return;

    try {
      await fetch(
        `/api/v1/owner/saloons/${activeSalonId}/services?serviceId=${serviceId}`,
        { method: "DELETE" }
      );
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPreset = (p: typeof PRESET_TEMPLATES[0]) => {
    setNameBn(p.nameBn);
    setNameEn(p.nameEn);
    setPrice(p.price.toString());
    setDurationMins(p.durationMins.toString());
    setShowAddModal(true);
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSalonId || !nameBn || !price) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn,
          nameEn: nameEn || nameBn,
          price: Number(price),
          durationMins: Number(durationMins),
          details,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNameBn("");
        setNameEn("");
        setPrice("");
        setDetails("");
        fetchServices();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.navServices}</h1>
            <p className="text-xs text-slate-500">
              {lang === "bn" ? "সার্ভিস রেট ও সময়সীমা নির্ধারণ" : "Manage Rates & Durations"}
            </p>
          </div>

          <button
            onClick={() => {
              setNameBn("");
              setNameEn("");
              setPrice("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#0D9488] text-white px-3.5 py-2 rounded-xl shadow-xs hover:bg-[#115E59] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === "bn" ? "+ নতুন সার্ভিস" : "+ Add Service"}</span>
          </button>
        </div>

        {/* Quick Setup Presets */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === "bn" ? "১-ক্লিকে টেমপ্লেট থেকে যোগ করুন:" : "Quick Preset Templates:"}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TEMPLATES.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleAddPreset(p)}
                className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition cursor-pointer font-medium"
              >
                + {p.nameBn} (৳{p.price})
              </button>
            ))}
          </div>
        </div>

        {/* Current Services List */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {lang === "bn" ? `চালু সার্ভিস সমূহ (${services.length})` : `Active Catalog (${services.length})`}
          </h2>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-16 bg-slate-200 rounded-2xl" />
              <div className="h-16 bg-slate-200 rounded-2xl" />
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              {lang === "bn" ? "কোন সার্ভিস যোগ করা হয়নি।" : "No services configured yet."}
            </div>
          ) : (
            services.map((s) => (
              <div
                key={s.id}
                className={`p-3.5 bg-white rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                  s.isActive ? "border-slate-200/80" : "border-slate-200 bg-slate-50/70 opacity-60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {lang === "bn" ? s.nameBn : s.nameEn}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800">
                      ৳{s.price}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{s.durationMins} {t.minutes}</span>
                    </span>
                    {s.details && <span className="truncate">• {s.details}</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(s)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                    title={s.isActive ? "Deactivate" : "Activate"}
                  >
                    {s.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL: ADD / EDIT SERVICE */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
            <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-5 shadow-2xl relative z-10 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">
                  {lang === "bn" ? "নতুন সার্ভিস যুক্ত করুন" : "Add New Service"}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitService} className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === "bn" ? "সার্ভিসের নাম (বাংলা)" : "Service Name (Bangla)"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameBn}
                    onChange={(e) => setNameBn(e.target.value)}
                    placeholder="যেমন: চুল কাটা ও শ্যাম্পু"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === "bn" ? "মূল্য (BDT ৳)" : "Price (BDT ৳)"} *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="২৫০"
                      className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === "bn" ? "সময় (মিনিট)" : "Duration (mins)"} *
                    </label>
                    <input
                      type="number"
                      required
                      min="5"
                      value={durationMins}
                      onChange={(e) => setDurationMins(e.target.value)}
                      className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === "bn" ? "বিবরণ (ঐচ্ছিক)" : "Description (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="যেমন: স্পেশাল কন্ডিশনার সহ"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-[#0D9488] hover:bg-[#115E59] text-white shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? t.loading : t.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
