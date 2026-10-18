import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly"; // daily, monthly, yearly, all
    const exportFormat = searchParams.get("export"); // csv

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

    let whereClause: any = { saloonId: id };

    if (period === "daily") {
      whereClause.entryDate = todayStr;
    } else if (period === "monthly") {
      // Current month prefix YYYY-MM
      whereClause.entryDate = {
        startsWith: `${currentYear}-${currentMonth}`,
      };
    } else if (period === "yearly") {
      // Current year prefix YYYY
      whereClause.entryDate = {
        startsWith: `${currentYear}`,
      };
    }

    const entries = await prisma.ledgerEntry.findMany({
      where: whereClause,
      orderBy: { entryDate: "desc" },
    });

    // Compute aggregations from real database records
    const totalIncome = entries
      .filter((e) => e.type === "INCOME")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpense = entries
      .filter((e) => e.type === "EXPENSE")
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfit = totalIncome - totalExpense;

    // Handle CSV export with UTF-8 BOM (\uFEFF) as specified in TRD Section 7.2
    if (exportFormat === "csv") {
      const header = ["তারিখ (Date)", "ধরন (Type)", "ক্যাটাগরি (Category)", "টাকার পরিমাণ (BDT)", "নোট (Note)"];
      const rows = entries.map((e) => {
        const typeLabel = e.type === "INCOME" ? "আয় (Income)" : "ব্যয় (Expense)";
        const cleanNote = (e.note || "").replace(/"/g, '""');
        return [
          `"${e.entryDate}"`,
          `"${typeLabel}"`,
          `"${e.category}"`,
          e.amount,
          `"${cleanNote}"`,
        ];
      });

      const csvContent =
        "\uFEFF" +
        [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="hishab_khata_${period}_${todayStr}.csv"`,
        },
      });
    }

    return NextResponse.json({
      period,
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
        totalEntries: entries.length,
      },
      entries,
    });
  } catch (error: any) {
    console.error("Ledger fetch error:", error);
    return NextResponse.json(
      { error: "হিসাব খাতার তথ্য লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, category, amount, note, entryDate } = body;

    if (!type || !category || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "লেনদেনের ধরন (আয়/ব্যয়), ক্যাটাগরি এবং সঠিক টাকার পরিমাণ দিন।" },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const dateToRecord = entryDate || todayStr;

    const entry = await prisma.ledgerEntry.create({
      data: {
        saloonId: id,
        type: type === "INCOME" ? "INCOME" : "EXPENSE",
        category,
        amount: Number(amount),
        note,
        entryDate: dateToRecord,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${type === "INCOME" ? "আয়" : "ব্যয়"} সফলভাবে হিসাব খাতায় যুক্ত হয়েছে!`,
      entry,
    });
  } catch (error: any) {
    console.error("Ledger create error:", error);
    return NextResponse.json(
      { error: "হিসাব খাতায় তথ্য যোগ করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
