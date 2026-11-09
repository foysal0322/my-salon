"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import AddNewSalonForm from "@/components/AddNewSalonForm";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";

function NewSalonContent() {
  const { lang, t, user } = useApp();

  if (!user) {
    return (
      <AppShell>
        <div className="p-8 text-center max-w-sm mx-auto">
          <p className="text-slate-600 dark:text-slate-400 mb-4 text-xs font-semibold">
            {lang === "bn"
              ? "নতুন সেলুন শাখা যোগ করতে প্রথমে লগইন করুন।"
              : "Please login to add a new salon branch."}
          </p>
          <Link
            href="/login"
            className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl transition"
          >
            {t.login}
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "ড্যাশবোর্ডে ফিরে যান" : "Back to Dashboard"}</span>
          </Link>
        </div>

        <AddNewSalonForm />
      </div>
    </AppShell>
  );
}

export default function NewSalonPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">লোড হচ্ছে...</div>}>
      <NewSalonContent />
    </Suspense>
  );
}
