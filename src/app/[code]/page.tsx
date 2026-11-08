"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors } from "lucide-react";

export default function SalonCodeRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || "";
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;

    // Ignore asset / system requests
    if (code.includes(".") || code.startsWith("_")) {
      setError(true);
      return;
    }

    fetch(`/api/v1/saloons/${code}`)
      .then((res) => {
        if (!res.ok) throw new Error("Salon not found");
        return res.json();
      })
      .then((data) => {
        if (data.salon?.slug) {
          router.replace(`/s/${data.salon.slug}`);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      });
  }, [code, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 text-center shadow-lg border border-slate-200/80 max-w-sm w-full">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Scissors className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">সেলুন খুঁজে পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500 mt-1.5">
            আইডি <span className="font-mono font-bold text-slate-800">#{code}</span> দিয়ে কোনো সেলুন রেজিস্টার্ড নেই।
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href={`/search?query=${code}`}
              className="text-xs font-bold px-4 py-2.5 bg-[#0D9488] hover:bg-[#115E59] text-white rounded-xl transition"
            >
              সার্চ করুন
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            >
              হোমপেজে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-600 font-semibold">সেলুনে নিয়ে যাওয়া হচ্ছে...</p>
        <p className="text-[11px] font-mono text-slate-400 mt-1">ID: #{code}</p>
      </div>
    </div>
  );
}
