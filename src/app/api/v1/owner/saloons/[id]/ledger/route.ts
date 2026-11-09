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

    // Handle PDF export (Print-ready Bank Statement Format)
    if (exportFormat === "pdf") {
      const salon = await prisma.saloon.findUnique({
        where: { id },
        select: {
          nameBn: true,
          nameEn: true,
          code: true,
          address: true,
          phone: true,
          owner: { select: { name: true, phone: true } },
        },
      });

      // Write in only English; if only available in Bangla then fallback to that
      const salonName = salon?.nameEn || salon?.nameBn || "AmarSalon";
      const salonAddress = salon?.address || "Bangladesh";
      const salonPhone = salon?.phone || salon?.owner?.phone || "N/A";
      const salonCode = salon?.code || (id ? id.slice(0, 6).toUpperCase() : "1051");
      const salonOwnerName = salon?.owner?.name || (salon?.nameEn ? `${salon.nameEn} Management` : "Proprietor");

      // Date formatter helper (e.g. 2026-11-09 -> 09 Nov 2026)
      const formatDisplayDate = (d: string | Date | null | undefined): string => {
        if (!d) return "";
        try {
          if (typeof d === "string") {
            const parts = d.split("-");
            if (parts.length === 3) {
              const year = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              const day = parseInt(parts[2], 10);
              const dt = new Date(year, month, day);
              return dt.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
            }
          }
          const dt = typeof d === "string" ? new Date(d) : d;
          return dt.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } catch {
          return String(d);
        }
      };

      const statementDate = formatDisplayDate(now);

      // Range description in English
      let rangeLabelEn = "This Month";
      if (range === "7days") {
        const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        const past7Str = past7.toISOString().split("T")[0];
        rangeLabelEn = `${formatDisplayDate(past7Str)} – ${formatDisplayDate(todayStr)}`;
      } else if (range === "15days") {
        const past15 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const past15Str = past15.toISOString().split("T")[0];
        rangeLabelEn = `${formatDisplayDate(past15Str)} – ${formatDisplayDate(todayStr)}`;
      } else if (range === "30days") {
        const past30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        const past30Str = past30.toISOString().split("T")[0];
        rangeLabelEn = `${formatDisplayDate(past30Str)} – ${formatDisplayDate(todayStr)}`;
      } else if (range === "custom") {
        if (startDate && endDate) {
          rangeLabelEn = `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
        } else if (startDate) {
          rangeLabelEn = `From ${formatDisplayDate(startDate)}`;
        } else if (endDate) {
          rangeLabelEn = `Up to ${formatDisplayDate(endDate)}`;
        }
      } else if (period === "daily") {
        rangeLabelEn = formatDisplayDate(todayStr);
      } else if (period === "yearly") {
        rangeLabelEn = `Year ${currentYear}`;
      } else {
        rangeLabelEn = now.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
      }

      const statementRef = `AS-STM-${salonCode}-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Sort entries chronologically (earliest to latest) for bank running balance calculation
      const statementEntries = [...entries].sort((a, b) => {
        const dateA = new Date(a.entryDate).getTime();
        const dateB = new Date(b.entryDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const formatCurrency = (val: number) =>
        "৳" + Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      let runningBalance = 0;
      const rowsHtml = statementEntries.length === 0
        ? `<tr><td colspan="5" class="empty-state">No transactions recorded for this period.</td></tr>`
        : statementEntries.map((item) => {
          const isIncome = item.type === "INCOME";
          const debitAmount = !isIncome ? item.amount : 0;
          const creditAmount = isIncome ? item.amount : 0;
          runningBalance += (creditAmount - debitAmount);

          return `
            <tr>
              <td class="col-date font-mono">${formatDisplayDate(item.entryDate)}</td>
              <td class="col-desc">
                <div class="desc-main">${item.category}</div>
                ${item.note ? `<div class="desc-sub">${item.note}</div>` : ""}
              </td>
              <td class="col-amount text-danger font-mono">
                ${debitAmount > 0 ? formatCurrency(debitAmount) : `<span class="dash">-</span>`}
              </td>
              <td class="col-amount text-success font-mono">
                ${creditAmount > 0 ? formatCurrency(creditAmount) : `<span class="dash">-</span>`}
              </td>
              <td class="col-amount font-mono font-bold ${runningBalance >= 0 ? "text-dark" : "text-danger"}">
                ${runningBalance < 0 ? "-" : ""}${formatCurrency(Math.abs(runningBalance))}
              </td>
            </tr>
          `;
        }).join("");

      const html = `< !DOCTYPE html >
            <html lang="en" >
              <head>
              <meta charset="UTF-8" >
                <meta name="viewport" content = "width=device-width, initial-scale=1.0" >
                  <title>Account Statement - ${salonName} </title>
                    < link rel = "preconnect" href = "https://fonts.googleapis.com" >
                      <link rel="preconnect" href = "https://fonts.gstatic.com" crossorigin >
                        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel = "stylesheet" >
                          <style>
    * {
                            box- sizing: border - box;
          margin: 0;
          padding: 0;
        }
    body {
          font- family: 'Hind Siliguri', -apple - system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans - serif;
      color: #0f172a;
      background: #f8fafc;
      padding: 24px;
      line - height: 1.45;
      -webkit - print - color - adjust: exact;
      print - color - adjust: exact;
    }
    .btn - bar {
      max - width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify - content: flex - end;
      gap: 10px;
    }
    .btn {
      padding: 8px 16px;
      border - radius: 6px;
      font - size: 13px;
      font - weight: 600;
      cursor: pointer;
      display: inline - flex;
      align - items: center;
      gap: 6px;
      border: 1px solid transparent;
      transition: background 0.15s ease;
    }
    .btn - primary {
      background: #0f172a;
      color: #ffffff;
    }
    .btn - primary:hover {
      background: #1e293b;
    }
    .btn - outline {
      background: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .btn - outline:hover {
      background: #f1f5f9;
    }
    .statement - container {
      max - width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border - radius: 8px;
      box - shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      justify - content: space - between;
      align - items: flex - start;
      padding - bottom: 24px;
      border - bottom: 1px solid #e2e8f0;
      margin - bottom: 24px;
    }
    .brand - title {
      font - size: 22px;
      font - weight: 800;
      color: #0f172a;
      letter - spacing: -0.5px;
    }
    .brand - sub {
      font - size: 13px;
      color: #64748b;
      font - weight: 500;
      margin - top: 2px;
    }
    .header - details {
      text - align: right;
      font - size: 12px;
      color: #334155;
      line - height: 1.6;
    }
    .salon - name {
      font - size: 15px;
      font - weight: 700;
      color: #0f172a;
    }
    .summary - strip {
      display: grid;
      grid - template - columns: repeat(3, 1fr);
      gap: 12px;
      margin - bottom: 24px;
    }
    .summary - card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border - radius: 6px;
      padding: 12px 14px;
    }
    .summary - label {
      font - size: 11px;
      font - weight: 600;
      color: #64748b;
      text - transform: uppercase;
      letter - spacing: 0.5px;
      margin - bottom: 4px;
    }
    .summary - amount {
      font - size: 18px;
      font - weight: 700;
      font - variant - numeric: tabular - nums;
    }
    table.statement - table {
      width: 100 %;
      border - collapse: collapse;
      font - size: 12.5px;
      margin - bottom: 28px;
    }
    table.statement - table thead th {
      border - bottom: 1.5px solid #0f172a;
      padding: 8px 10px;
      font - size: 11px;
      font - weight: 700;
      text - transform: uppercase;
      letter - spacing: 0.5px;
      color: #0f172a;
      text - align: left;
    }
    table.statement - table td {
      padding: 9px 10px;
      border - bottom: 1px solid #f1f5f9;
      vertical - align: middle;
      color: #1e293b;
    }
    table.statement - table tr {
      page -break-inside: avoid;
    }
    .col - date {
      color: #475569;
      font - size: 12px;
    }
    .desc - main {
      font - weight: 600;
      color: #0f172a;
    }
    .desc - sub {
      font - size: 11px;
      color: #64748b;
      margin - top: 1px;
    }
    .col - right {
      text - align: right;
    }
    .col - amount {
      text - align: right;
      font - weight: 600;
      font - variant - numeric: tabular - nums;
    }
    .font - mono {
      font - family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    .font - bold {
      font - weight: 700;
    }
    .text - success {
      color: #16a34a;
    }
    .text - danger {
      color: #dc2626;
    }
    .text - dark {
      color: #0f172a;
    }
    .text - muted {
      color: #64748b;
    }
    .dash {
      color: #cbd5e1;
    }
    .empty - state {
      text - align: center;
      padding: 32px;
      color: #64748b;
      font - style: italic;
    }
    .totals - row td {
      border - top: 1.5px solid #0f172a!important;
      border - bottom: 1.5px solid #0f172a!important;
      font - size: 13px;
      padding: 10px;
      background: #f8fafc;
    }
    .statement - footer {
      border - top: 1px solid #e2e8f0;
      padding - top: 12px;
      display: flex;
      justify - content: space - between;
      align - items: center;
      font - size: 11px;
      color: #94a3b8;
    }
    @media print {
      body {
        background: #ffffff!important;
        padding: 0!important;
      }
      .statement - container {
        max - width: 100 % !important;
        padding: 0!important;
        border: none!important;
        box - shadow: none!important;
      }
      .btn - bar {
        display: none!important;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 14mm 14mm 14mm;
      }
    }
    </style>
      </head>
      < body >
      <div class="btn-bar" >
        <button class="btn btn-primary" onclick = "window.print()" > Print / Save as PDF</ button >
          <button class="btn btn-outline" onclick = "window.close()" > Close </button>
            </div>

            < div class="statement-container" >
              <div class="header" >
                <div>
                <div class="brand-title" > AmarSalon </div>
                  < div class="brand-sub" > Account Statement </div>
                    </div>
                    < div class="header-details" >
                      <div class="salon-name" > ${salonName} </div>
                        < div > Period: ${rangeLabelEn} </div>
                          < div > Date: ${statementDate} </div>
                            </div>
                            </div>

                            < div class="summary-strip" >
                              <div class="summary-card" >
                                <div class="summary-label" > Total Inflow </div>
                                  < div class="summary-amount text-success font-mono" > +${formatCurrency(exportIncome)} </div>
                                    </div>
                                    < div class="summary-card" >
                                      <div class="summary-label" > Total Outflow </div>
                                        < div class="summary-amount text-danger font-mono" > -${formatCurrency(exportExpense)} </div>
                                          </div>
                                          < div class="summary-card" >
                                            <div class="summary-label" > Net Balance </div>
                                              < div class="summary-amount font-mono font-bold ${exportNet >= 0 ? "text - dark" : "text - danger"}" >
                                                ${exportNet < 0 ? "-" : ""}${formatCurrency(Math.abs(exportNet))}
    </div>
      </div>
      </div>

      < table class="statement-table" >
        <thead>
        <tr>
        <th style="width: 100px;" > Date </th>
          < th > Description </th>
          < th style = "width: 120px;" class="col-right" > Debit(৳) </th>
            < th style = "width: 120px;" class="col-right" > Credit(৳) </th>
              < th style = "width: 130px;" class="col-right" > Balance(৳) </th>
                </tr>
                </thead>
                <tbody>
        ${rowsHtml}
    </tbody>
      < tfoot >
      <tr class="totals-row" >
        <td colspan="2" class="font-bold" > Total </td>
          < td class="col-amount text-danger font-mono font-bold" > ${formatCurrency(exportExpense)} </td>
            < td class="col-amount text-success font-mono font-bold" > ${formatCurrency(exportIncome)} </td>
              < td class="col-amount font-mono font-bold ${exportNet >= 0 ? "text - dark" : "text - danger"}" >
                ${exportNet < 0 ? "-" : ""}${formatCurrency(Math.abs(exportNet))}
    </td>
      </tr>
      </tfoot>
      </table>

      < div class="statement-footer" >
        <div>AmarSalon • amarsalon.xyz </div>
          < div class="font-mono" > Ref: ${statementRef} </div>
            </div>
            </div>

            <script>
    window.onload = function () {
      setTimeout(function () {
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
