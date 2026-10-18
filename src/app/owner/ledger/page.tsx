"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useApp } from "@/context/AppContext";
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Download,
  Printer,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export default function OwnerLedgerPage() {
  const { lang, t, activeSalonId, triggerHaptic } = useApp();

  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    totalEntries: 0,
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for adding new entry
  const [showAddModal, setShowAddModal] = useState(false);
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
      const res = await fetch(
        `/api/v1/owner/saloons/${activeSalonId}/ledger?period=${period}`
      );
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
  }, [activeSalonId, period]);

  const handleDownloadCsv = () => {
    if (!activeSalonId) return;
    triggerHaptic(30);
    window.location.href = `/api/v1/owner/saloons/${activeSalonId}/ledger?period=${period}&export=csv`;
  };

  const handlePrint = () => {
    triggerHaptic(20);
    window.print();
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSalonId || !amount || Number(amount) <= 0) return;

    setSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/v1/owner/saloons/${activeSalonId}/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: entryType,
          category,
          amount: Number(amount),
          note,
          entryDate,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
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

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-4">
        {/* Title & Actions */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.navLedger}</h1>
            <p className="text-xs text-slate-500">{t.hishabKhata}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadCsv}
              className="p-2 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 transition border border-teal-200 cursor-pointer"
              title={t.exportCsv}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200 cursor-pointer"
              title={t.printLedger}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold border border-slate-200 no-print">
          <button
            onClick={() => setPeriod("daily")}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${
              period === "daily"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.periodDaily}
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${
              period === "monthly"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.periodMonthly}
          </button>
          <button
            onClick={() => setPeriod("yearly")}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${
              period === "yearly"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.periodYearly}
          </button>
        </div>

        {/* FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Income */}
          <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{t.todayIncome}</span>
            </p>
            <p className="text-base font-black text-emerald-800 font-mono mt-1">
              ৳{summary.totalIncome.toLocaleString()}
            </p>
          </div>

          {/* Expense */}
          <div className="bg-white rounded-2xl p-3 border border-rose-100 shadow-xs">
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3" />
              <span>{t.todayExpense}</span>
            </p>
            <p className="text-base font-black text-rose-800 font-mono mt-1">
              ৳{summary.totalExpense.toLocaleString()}
            </p>
          </div>

          {/* Net Profit */}
          <div className="bg-teal-900 text-white rounded-2xl p-3 shadow-sm">
            <p className="text-[10px] font-bold text-teal-200 uppercase tracking-wider">
              {t.netProfit}
            </p>
            <p className="text-base font-black text-amber-300 font-mono mt-1">
              ৳{summary.netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-2 gap-2.5 no-print">
          <button
            onClick={() => {
              setEntryType("INCOME");
              setCategory("সার্ভিস বিল (Walk-in)");
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>{t.addIncome}</span>
          </button>

          <button
            onClick={() => {
              setEntryType("EXPENSE");
              setCategory("দোকানের খরচ (Utility)");
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition shadow-xs cursor-pointer"
          >
            <Minus className="w-4 h-4 text-rose-600" />
            <span>{t.addExpense}</span>
          </button>
        </div>

        {/* TRANSACTIONS LIST */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t.recentTransactions}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {summary.totalEntries} {lang === "bn" ? "টি লেনদেন" : "entries"}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-16 bg-slate-200 rounded-2xl" />
              <div className="h-16 bg-slate-200 rounded-2xl" />
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-xs text-slate-500">
              {t.noTransactions}
            </div>
          ) : (
            entries.map((item) => {
              const isIncome = item.type === "INCOME";
              return (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isIncome ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        {item.category}
                      </p>
                      {item.note && (
                        <p className="text-[11px] text-slate-500 truncate">{item.note}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.entryDate}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`font-mono font-bold text-sm ${
                        isIncome ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {isIncome ? "+" : "-"}৳{item.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL / DRAWER: ADD LEDGER ENTRY */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
            <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-5 shadow-2xl relative z-10 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">
                  {entryType === "INCOME" ? t.addIncome : t.addExpense}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {errorMessage && (
                <div className="my-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmitEntry} className="space-y-3 mt-3">
                {/* Category Preset Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.categoryLabel}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  >
                    {entryType === "INCOME" ? (
                      <>
                        <option value="সার্ভিস বিল (Walk-in)">সার্ভিস বিল (Walk-in Cash)</option>
                        <option value="প্রোডাক্ট বিক্রয় (Cosmetics Sale)">প্রোডাক্ট বিক্রয়</option>
                        <option value="টিপস ও অন্যান্য">অন্যান্য আয়</option>
                      </>
                    ) : (
                      <>
                        <option value="দোকানের খরচ (Utility/Tea)">দোকানের খরচ / চা-নাস্তা</option>
                        <option value="কসমেটিকস ও ব্লেড ক্রয়">কসমেটিকস ও ব্লেড ক্রয়</option>
                        <option value="বিদ্যুৎ বিল (Electricity)">বিদ্যুৎ বিল</option>
                        <option value="দোকান ভাড়া (Rent)">দোকান ভাড়া</option>
                        <option value="কর্মচারী বেতন (Staff)">কর্মচারী বেতন / বকশিস</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.amount} (BDT ৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder=" ৫০০"
                    className="w-full text-base font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.noteLabel}
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="যেমন: ৩ প্যাকেট সেভলন ব্লেড"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.date}
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-[#0D9488] hover:bg-[#115E59] text-white shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? t.loading : t.submit}
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
