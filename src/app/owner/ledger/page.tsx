"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Plus,
  Minus,
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Edit2,
  Trash2,
  ChevronDown,
} from "lucide-react";

export default function OwnerLedgerPage() {
  const { lang, t, activeSalonId, triggerHaptic } = useApp();

  const [summary, setSummary] = useState({
    thisMonthIncome: 0,
    thisMonthExpense: 0,
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    totalEntries: 0,
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState<"7days" | "15days" | "30days" | "custom">("30days");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Modal State for adding/editing entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [category, setCategory] = useState("সার্ভিস বিল (Walk-in)");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchLedger = async () => {
    if (!activeSalonId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/ledger`);
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        setEntries(data.entries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
}, [activeSalonId]);

const handleExportCsv = () => {
  if (!activeSalonId) return;
  triggerHaptic(30);
  let url = `/api/v1/owner/saloons/${activeSalonId}/ledger?export=csv&range=${exportRange}`;
  if (exportRange === "custom") {
    url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
  }
  window.location.href = url;
  setShowExportModal(false);
};

const handleExportPdf = () => {
  if (!activeSalonId) return;
  triggerHaptic(30);
  let url = `/api/v1/owner/saloons/${activeSalonId}/ledger?export=pdf&range=${exportRange}`;
  if (exportRange === "custom") {
    url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
  }
  window.open(url, "_blank");
  setShowExportModal(false);
};

const handleOpenAdd = (type: "INCOME" | "EXPENSE") => {
  triggerHaptic(20);
  setEditingEntryId(null);
  setEntryType(type);
  setCategory(type === "INCOME" ? "সার্ভিস বিল (Walk-in)" : "দোকানের খরচ (Utility)");
  setAmount("");
  setNote("");
  setEntryDate(new Date().toISOString().split("T")[0]);
  setErrorMessage("");
  setShowAddModal(true);
};

const handleEditEntry = (item: any) => {
  triggerHaptic(20);
  setEditingEntryId(item.id);
  setEntryType(item.type);
  setCategory(item.category);
  setAmount(item.amount.toString());
  setNote(item.note || "");
  setEntryDate(item.entryDate || new Date().toISOString().split("T")[0]);
  setErrorMessage("");
  setShowAddModal(true);
};

  const handleDeleteEntry = async (entryId: string) => {
    triggerHaptic(30);
    const confirmDel = window.confirm(
      lang === "bn"
        ? "আপনি কি নিশ্চিত যে এই লেনদেনটি মুছে ফেলতে চান?"
        : "Are you sure you want to delete this transaction?"
    );
    if (!confirmDel) return;

    try {
      const res = await fetch(
        `/api/v1/owner/saloons/${activeSalonId}/ledger?entryId=${entryId}`,
        { method: "DELETE" }
      );
        if (res.ok) {
          fetchLedger();
        }
    } catch (e) {
      console.error(e);
    }
  };

    const handleSubmitEntry = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeSalonId || !amount || Number(amount) <= 0) return;

        setSubmitting(true);
        setErrorMessage("");
        try {
          const isEditing = Boolean(editingEntryId);
          const url = `/api/v1/owner/saloons/${activeSalonId}/ledger`;
          const method = isEditing ? "PUT" : "POST";
          const payload: any = {
            type: entryType,
            category,
            amount: Number(amount),
            note,
            entryDate,
          };
          if (isEditing) {
            payload.entryId = editingEntryId;
          }

          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (res.ok) {
            setShowAddModal(false);
            setEditingEntryId(null);
            setAmount("");
            setNote("");
            fetchLedger();
          } else {
            setErrorMessage(data.error || t.error);
          }
      } catch (e) {
        setErrorMessage(t.error);
      } finally {
        setSubmitting(false);
      }
    };

    const displayedEntries = entries.slice(0, 15);

            return (
            <AppShell>
              <div className="px-4 py-4 space-y-4">
                {/* Title & Actions */}
                <div className="flex items-center justify-between no-print">
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t.navLedger}</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.hishabKhata}</p>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic(20);
                      setShowExportModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer active:scale-95"
                    title={t.exportReport || "রিপোর্ট এক্সপোর্ট"}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.exportReport || (lang === "bn" ? "রিপোর্ট এক্সপোর্ট" : "Export Report")}</span>
                  </button>
                </div>

                {/* FINANCIAL SUMMARY CARDS (CURRENT MONTH ONLY, NO PROFIT CARD) */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  {/* Current Month Income */}
                  <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-950/60 shadow-xs flex flex-col justify-center items-center">
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      {t.thisMonthIncome || (lang === "bn" ? "চলতি মাসের আয়" : "This Month's Income")}
                    </p>
                    <p className="text-xl font-black text-emerald-800 dark:text-emerald-300 font-mono mt-1.5">
                      ৳{(summary.thisMonthIncome ?? summary.totalIncome).toLocaleString()}
                    </p>
                  </div>

                    {/* Current Month Expense */}
                    <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-rose-100 dark:border-rose-950/60 shadow-xs flex flex-col justify-center items-center">
                      <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        {t.thisMonthExpense || (lang === "bn" ? "চলতি মাসের ব্যয়" : "This Month's Expense")}
                      </p>
                      <p className="text-xl font-black text-rose-800 dark:text-rose-300 font-mono mt-1.5">
                        ৳{(summary.thisMonthExpense ?? summary.totalExpense).toLocaleString()}
                      </p>
                    </div>
                  </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-2 gap-2.5 no-print">
                  <button
                    onClick={() => handleOpenAdd("INCOME")}
                    className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.addIncome}</span>
                  </button>

                    <button
                      onClick={() => handleOpenAdd("EXPENSE")}
                      className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shadow-xs cursor-pointer"
                    >
                      <Minus className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>{t.addExpense}</span>
                    </button>
                  </div>

                {/* TRANSACTIONS LIST (LAST 15 ENTRIES) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {t.recentTransactions}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {lang === "bn"
                        ? `সর্বশেষ ${displayedEntries.length}টি লেনদেন`
                        : `Last ${displayedEntries.length} entries`}
                    </span>
                  </div>

                    {loading ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                      </div>
                    ) : displayedEntries.length === 0 ? (
                      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                        {t.noTransactions}
                      </div>
                    ) : (
                      <>
                        <div className="max-h-[440px] overflow-y-auto overscroll-contain pr-1 space-y-2">
                          {displayedEntries.map((item) => {
                            const isIncome = item.type === "INCOME";
                            return (
                              <div
                                key={item.id}
                                className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {item.category}
                                  </p>
                                  {item.note && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.note}</p>
                                  )}
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{item.entryDate}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <p
                                      className={`font-mono font-bold text-sm ${isIncome
                                          ? "text-emerald-700 dark:text-emerald-400"
                                          : "text-rose-700 dark:text-rose-400"
                                        }`}
                                    >
                                      {isIncome ? "+" : "-"}৳{item.amount.toLocaleString()}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-700 pl-2 no-print">
                                    <button
                                      onClick={() => handleEditEntry(item)}
                                      className="p-1.5 text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-lg transition cursor-pointer"
                                      title={lang === "bn" ? "লেনদেন সম্পাদনা" : "Edit transaction"}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEntry(item.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                                      title={lang === "bn" ? "লেনদেন মুছুন" : "Delete transaction"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                              {entries.length > 15 && (
                                <div className="pt-2 text-center">
                                  <button
                                    onClick={() => {
                                      triggerHaptic(20);
                                      setShowExportModal(true);
                                    }}
                                    className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                                  >
                                    {lang === "bn"
                                      ? `সব (${entries.length}টি) লেনদেন দেখতে রিপোর্ট এক্সপোর্ট করুন`
                                      : `Export report to view all (${entries.length}) transactions`}
                                  </button>
                                </div>
                              )}
                            </>
                          )
                        }
                  </div>

                        {/* MODAL / DRAWER: EXPORT REPORT */}
                        {showExportModal && (
                          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in p-0 sm:p-4">
                            <div className="fixed inset-0" onClick={() => setShowExportModal(false)} />
                            <div className="w-full max-w-[440px] bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto pb-10 sm:pb-6">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                                    <Download className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                      {t.exportReport || (lang === "bn" ? "হিসাব খাতা রিপোর্ট এক্সপোর্ট" : "Export Ledger Report")}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {lang === "bn" ? "সময়কাল ও ফরম্যাট নির্বাচন করুন" : "Select date range and format"}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowExportModal(false)}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 text-lg font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="space-y-4 mt-4">
                                {/* Range Selection */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {lang === "bn" ? "সময়কাল নির্বাচন করুন" : "Select Range"}
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      { id: "7days", label: t.last7Days || (lang === "bn" ? "গত ৭ দিন" : "Last 7 Days") },
                                      { id: "15days", label: t.last15Days || (lang === "bn" ? "গত ১৫ দিন" : "Last 15 Days") },
                                      { id: "30days", label: t.last30Days || (lang === "bn" ? "গত ৩০ দিন" : "Last 30 Days") },
                                      { id: "custom", label: t.customRange || (lang === "bn" ? "নির্দিষ্ট তারিখ" : "Custom Range") },
                                    ].map((opt) => (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                          triggerHaptic(15);
                                          setExportRange(opt.id as any);
                                        }}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${exportRange === opt.id
                                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                                            : "bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600"
                                          }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Custom Date Inputs if 'custom' is selected */}
                                {exportRange === "custom" && (
                                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in">
                                    <div className="grid grid-cols-2 gap-2.5">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                          {lang === "bn" ? "শুরুর তারিখ" : "Start Date"}
                                        </label>
                                        <input
                                          type="date"
                                          value={customStartDate}
                                          onChange={(e) => setCustomStartDate(e.target.value)}
                                          className="w-full text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                          {lang === "bn" ? "শেষের তারিখ" : "End Date"}
                                        </label>
                                        <input
                                          type="date"
                                          value={customEndDate}
                                          onChange={(e) => setCustomEndDate(e.target.value)}
                                          className="w-full text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                  {/* Action buttons: PDF and CSV */}
                                  <div className="pt-2 space-y-2.5">
                                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                      {lang === "bn" ? "ডাউনলোড ফরম্যাট নির্বাচন করুন" : "Select Export Format"}
                                    </p>

                                      <div className="grid grid-cols-2 gap-2.5">
                                        {/* PDF Export Button */}
                                        <button
                                          type="button"
                                          onClick={handleExportPdf}
                                          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-900 dark:text-teal-200 transition cursor-pointer group shadow-xs active:scale-[0.98]"
                                        >
                                          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                                            <FileText className="w-5 h-5" />
                                          </div>
                                          <span className="font-bold text-xs">{lang === "bn" ? "PDF রিপোর্ট" : "PDF Report"}</span>
                                          <span className="text-[10px] text-teal-700 dark:text-teal-400">
                                            {lang === "bn" ? "A4 প্রিন্ট উপযোগী" : "Print-ready A4"}
                                          </span>
                                        </button>

                                    {/* CSV Export Button */}
                                    <button
                                      type="button"
                                      onClick={handleExportCsv}
                                      className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 transition cursor-pointer group shadow-xs active:scale-[0.98]"
                                    >
                                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                                        <FileSpreadsheet className="w-5 h-5" />
                                      </div>
                                      <span className="font-bold text-xs">CSV / Excel</span>
                                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                        {lang === "bn" ? "স্প্রেডশিট ডেটা" : "Spreadsheet Data"}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                          </div>
          </div>
        )}

                            {/* MODAL / DRAWER: ADD OR EDIT LEDGER ENTRY */}
                            {showAddModal && (
                              <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in p-0 sm:p-4">
                                <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
                                <div className="w-full max-w-[480px] bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto pb-12 sm:pb-6">
                                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`w-3 h-3 rounded-full ${entryType === "INCOME" ? "bg-emerald-500" : "bg-rose-500"
                                          }`}
                                      />
                                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                        {editingEntryId
                                          ? lang === "bn"
                                            ? "লেনদেন সম্পাদনা করুন"
                                            : "Edit Transaction"
                                          : entryType === "INCOME"
                                            ? lang === "bn"
                                              ? "নতুন আয় যোগ করুন"
                                              : "Record New Sale / Income"
                                            : lang === "bn"
                                              ? "নতুন ব্যয় / খরচ যোগ করুন"
                                              : "Record New Expense"}
                                      </h3>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setShowAddModal(false)}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 text-lg font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {errorMessage && (
                                    <div className="my-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4 shrink-0" />
                                      <span>{errorMessage}</span>
                                    </div>
                                  )}

              <form onSubmit={handleSubmitEntry} className="space-y-3.5 mt-3">
                                        {/* Category Preset Selector */}
                                        <div>
                                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            {t.categoryLabel}
                                          </label>
                                          <div className="relative">
                                            <select
                                              value={category}
                                              onChange={(e) => setCategory(e.target.value)}
                                              className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3.5 py-3 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer pr-10 shadow-2xs transition"
                                            >
                                              {entryType === "INCOME" ? (
                        <>
                          <option value="সার্ভিস বিল (Walk-in)">💵 সার্ভিস বিল (Walk-in Cash)</option>
                          <option value="প্রোডাক্ট বিক্রয় (Cosmetics Sale)">🧴 প্রোডাক্ট বিক্রয় (Cosmetics Sale)</option>
                          <option value="টিপস ও অন্যান্য">✨ টিপস ও অন্যান্য আয়</option>
                        </>
                                              ) : (
                        <>
                          <option value="দোকানের খরচ (Utility/Tea)">☕ দোকানের খরচ / চা-নাস্তা</option>
                          <option value="কসমেটিকস ও ব্লেড ক্রয়">🪒 কসমেটিকস ও ব্লেড ক্রয়</option>
                          <option value="বিদ্যুৎ বিল (Electricity)">⚡ বিদ্যুৎ বিল</option>
                          <option value="দোকান ভাড়া (Rent)">🏢 দোকান ভাড়া</option>
                          <option value="কর্মচারী বেতন (Staff)">👥 কর্মচারী বেতন / বকশিস</option>
                          <option value="অন্যান্য ব্যয়">📦 অন্যান্য ব্যয়</option>
                        </>
                                              )}
                                          </select>
                                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500 dark:text-slate-400">
                                            <ChevronDown className="w-4 h-4" />
                                          </div>
                                        </div>
                                </div>

                                {/* Amount */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {t.amount} (BDT ৳) <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="৫০০"
                                    className="w-full text-base font-mono font-bold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                  />
                                </div>

                                {/* Description */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {t.noteLabel}
                                  </label>
                                  <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={
                                      entryType === "INCOME"
                                        ? "যেমন: চুল ও দাড়ি শেভ বিল"
                                        : "যেমন: ৩ প্যাকেট সেভলন ব্লেড"
                                    }
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-750 focus:outline-none"
                                  />
                                </div>

                                {/* Date */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {t.date}
                                  </label>
                                  <input
                                    type="date"
                                    value={entryDate}
                                    onChange={(e) => setEntryDate(e.target.value)}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 font-mono"
                                  />
                                </div>

                                <div className="pt-2">
                                  <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${entryType === "INCOME"
                                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 active:scale-[0.99]"
                                        : "bg-rose-600 hover:bg-rose-700 shadow-rose-900/20 active:scale-[0.99]"
                                      }`}
                                  >
                                    {entryType === "INCOME" ? (
                                      <Plus className="w-4 h-4" />
                                    ) : (
                                      <Minus className="w-4 h-4" />
                                    )}
                                    <span>
                                      {submitting
                                        ? lang === "bn"
                                          ? "অপেক্ষা করুন..."
                                          : "Recording..."
                                        : editingEntryId
                                          ? lang === "bn"
                                            ? "পরিবর্তন সংরক্ষণ করুন"
                                            : "Save Changes"
                                          : entryType === "INCOME"
                                            ? lang === "bn"
                                              ? "নতুন আয় জমা দিন"
                                              : "Record Income"
                                            : lang === "bn"
                                              ? "নতুন ব্যয় জমা দিন"
                                              : "Record Expense"}
                                    </span>
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
