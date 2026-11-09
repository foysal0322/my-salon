import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period"); // daily, monthly, yearly
    const range = searchParams.get("range"); // 7days, 15days, 30days, custom
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const exportFormat = searchParams.get("export"); // csv, pdf

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonthPrefix = `${currentYear}-${currentMonth}`;

    // 1. Calculate current month totals
    const currentMonthEntries = await prisma.ledgerEntry.findMany({
      where: {
        saloonId: id,
        entryDate: { startsWith: currentMonthPrefix },
      },
    });

    const thisMonthIncome = currentMonthEntries
      .filter((e) => e.type === "INCOME")
      .reduce((sum, e) => sum + e.amount, 0);

    const thisMonthExpense = currentMonthEntries
      .filter((e) => e.type === "EXPENSE")
      .reduce((sum, e) => sum + e.amount, 0);

    const thisMonthProfit = thisMonthIncome - thisMonthExpense;

    // 2. Determine date filter for exports or period-specific queries
    let whereClause: any = { saloonId: id };
    let rangeLabel = "চলতি মাস (This Month)";

    if (range === "7days") {
      const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const past7Str = past7.toISOString().split("T")[0];
      whereClause.entryDate = { gte: past7Str, lte: todayStr };
      rangeLabel = `গত ৭ দিন (${past7Str} থেকে ${todayStr})`;
    } else if (range === "15days") {
      const past15 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const past15Str = past15.toISOString().split("T")[0];
      whereClause.entryDate = { gte: past15Str, lte: todayStr };
      rangeLabel = `গত ১৫ দিন (${past15Str} থেকে ${todayStr})`;
    } else if (range === "30days") {
      const past30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      const past30Str = past30.toISOString().split("T")[0];
      whereClause.entryDate = { gte: past30Str, lte: todayStr };
      rangeLabel = `গত ৩০ দিন (${past30Str} থেকে ${todayStr})`;
    } else if (range === "custom") {
      if (startDate && endDate) {
        whereClause.entryDate = { gte: startDate, lte: endDate };
        rangeLabel = `${startDate} থেকে ${endDate}`;
      } else if (startDate) {
        whereClause.entryDate = { gte: startDate };
        rangeLabel = `${startDate} থেকে অদ্যাবধি`;
      } else if (endDate) {
        whereClause.entryDate = { lte: endDate };
        rangeLabel = `${endDate} পর্যন্ত`;
      }
    } else if (period === "daily") {
      whereClause.entryDate = todayStr;
      rangeLabel = `আজকের দিন (${todayStr})`;
    } else if (period === "yearly") {
      whereClause.entryDate = { startsWith: `${currentYear}` };
      rangeLabel = `চলতি বছর (${currentYear})`;
    } else if (exportFormat) {
      whereClause.entryDate = { startsWith: currentMonthPrefix };
      rangeLabel = `চলতি মাস (${currentMonthPrefix})`;
    }

    // 3. Query entries
    const entries = await prisma.ledgerEntry.findMany({
      where: whereClause,
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    });

    const exportIncome = entries
      .filter((e) => e.type === "INCOME")
      .reduce((sum, e) => sum + e.amount, 0);

    const exportExpense = entries
      .filter((e) => e.type === "EXPENSE")
      .reduce((sum, e) => sum + e.amount, 0);

    const exportNet = exportIncome - exportExpense;

    // Handle CSV export with UTF-8 BOM (\uFEFF)
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
          "Content-Disposition": `attachment; filename="hishab_khata_${range || period || "report"}_${todayStr}.csv"`,
        },
      });
    }

    // Handle PDF export (Print-ready A4 HTML document)
    if (exportFormat === "pdf") {
      const salon = await prisma.saloon.findUnique({
        where: { id },
        select: { nameBn: true, nameEn: true, code: true, address: true, phone: true },
      });

      const salonName = salon?.nameBn || salon?.nameEn || "AmarSalon";
      const salonAddress = salon?.address || "";
      const salonPhone = salon?.phone || "";
      const salonCode = salon?.code || "";

      const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>হিসাব খাতা রিপোর্ট - ${salonName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      padding: 24px;
      line-height: 1.5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 700;
      color: #0f766e;
    }
    .salon-name {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }
    .salon-info {
      font-size: 13px;
      color: #64748b;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 13px;
    }
    .meta-badge {
      display: inline-block;
      background: #f0fdfa;
      color: #0f766e;
      padding: 4px 10px;
      border-radius: 9999px;
      font-weight: 600;
      border: 1px solid #ccfbf1;
      margin-bottom: 6px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .summary-card {
      padding: 14px;
      border-radius: 12px;
      text-align: center;
    }
    .card-income { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .card-expense { background: #fff1f2; border: 1px solid #fecdd3; }
    .card-net { background: #f0fdfa; border: 1px solid #99f6e4; }
    .card-title { font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .card-income .card-title { color: #166534; }
    .card-expense .card-title { color: #9f1239; }
    .card-net .card-title { color: #0f766e; }
    .card-amount { font-size: 20px; font-weight: 700; margin-top: 4px; font-family: monospace; }
    .card-income .card-amount { color: #15803d; }
    .card-expense .card-amount { color: #be123c; }
    .card-net .card-amount { color: #0f766e; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 24px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tr:nth-child(even) td { background: #f8fafc; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-income { background: #dcfce7; color: #166534; }
    .badge-expense { background: #fee2e2; color: #991b1b; }
    .amount-income { color: #15803d; font-weight: 700; font-family: monospace; }
    .amount-expense { color: #dc2626; font-weight: 700; font-family: monospace; }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #94a3b8;
    }
    .btn-bar {
      margin-bottom: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0d9488;
      color: #ffffff;
      text-decoration: none;
    }
    .btn:hover { background: #0f766e; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { max-width: 100%; padding: 0; box-shadow: none; border-radius: 0; }
      .btn-bar { display: none !important; }
      @page { size: A4; margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="btn-bar">
      <button class="btn" onclick="window.print()">🖨️ সেভ করুন বা প্রিন্ট (Save as PDF)</button>
    </div>

    <div class="header">
      <div>
        <div class="brand-title">AmarSalon • হিসাব খাতা</div>
        <div class="salon-name">${salonName} ${salonCode ? `(#${salonCode})` : ""}</div>
        <div class="salon-info">${salonAddress ? `${salonAddress} • ` : ""}${salonPhone}</div>
      </div>
      <div class="meta-box">
        <div class="meta-badge">${rangeLabel}</div>
        <div style="color: #64748b;">তৈরির তারিখ: ${todayStr}</div>
        <div style="color: #64748b; font-size: 11px; margin-top: 2px;">মোট লেনদেন: ${entries.length}টি</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card card-income">
        <div class="card-title">মোট আয় (Total Income)</div>
        <div class="card-amount">৳${exportIncome.toLocaleString()}</div>
      </div>
      <div class="summary-card card-expense">
        <div class="card-title">মোট ব্যয় (Total Expense)</div>
        <div class="card-amount">৳${exportExpense.toLocaleString()}</div>
      </div>
      <div class="summary-card card-net">
        <div class="card-title">নিট ব্যালেন্স (Net Balance)</div>
        <div class="card-amount">৳${exportNet.toLocaleString()}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 50px;">নং</th>
          <th style="width: 100px;">তারিখ</th>
          <th>ক্যাটাগরি ও বিবরণ</th>
          <th style="width: 80px; text-align: center;">ধরন</th>
          <th style="width: 110px; text-align: right;">পরিমাণ</th>
        </tr>
      </thead>
      <tbody>
        ${entries.length === 0
          ? `<tr><td colspan="5" style="text-align: center; padding: 24px; color: #94a3b8;">কোনো লেনদেন রেকর্ড পাওয়া যায়নি</td></tr>`
          : entries
              .map(
                (item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td style="font-family: monospace;">${item.entryDate}</td>
            <td>
              <strong>${item.category}</strong>
              ${item.note ? `<div style="font-size: 11px; color: #64748b;">${item.note}</div>` : ""}
            </td>
            <td style="text-align: center;">
              <span class="badge ${item.type === "INCOME" ? "badge-income" : "badge-expense"}">
                ${item.type === "INCOME" ? "আয়" : "ব্যয়"}
              </span>
            </td>
            <td style="text-align: right;" class="${item.type === "INCOME" ? "amount-income" : "amount-expense"}">
              ${item.type === "INCOME" ? "+" : "-"}৳${item.amount.toLocaleString()}
            </td>
          </tr>`
              )
              .join("")}
      </tbody>
    </table>

    <div class="footer">
      <div>স্মার্ট সেলুন বুকিং ও হিসাব খাতা প্ল্যাটফর্ম</div>
      <div>www.amarsalon.com</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return NextResponse.json({
      summary: {
        thisMonthIncome,
        thisMonthExpense,
        totalIncome: thisMonthIncome,
        totalExpense: thisMonthExpense,
        netProfit: thisMonthProfit,
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { entryId, type, category, amount, note, entryDate } = body;

    if (!entryId) {
      return NextResponse.json({ error: "লেনদেন আইডি প্রয়োজন।" }, { status: 400 });
    }

    const updated = await prisma.ledgerEntry.update({
      where: { id: entryId, saloonId: id },
      data: {
        type: type !== undefined ? (type === "INCOME" ? "INCOME" : "EXPENSE") : undefined,
        category: category !== undefined ? category : undefined,
        amount: amount !== undefined ? Number(amount) : undefined,
        note: note !== undefined ? note : undefined,
        entryDate: entryDate !== undefined ? entryDate : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "লেনদেন সফলভাবে আপডেট করা হয়েছে।",
      entry: updated,
    });
  } catch (error: any) {
    console.error("Ledger update error:", error);
    return NextResponse.json(
      { error: "লেনদেন আপডেট করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json({ error: "লেনদেন আইডি প্রয়োজন।" }, { status: 400 });
    }

    await prisma.ledgerEntry.delete({
      where: { id: entryId, saloonId: id },
    });

    return NextResponse.json({
      success: true,
      message: "লেনদেন মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    console.error("Ledger delete error:", error);
    return NextResponse.json(
      { error: "লেনদেন মুছতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
