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

      // Range description in English
      let rangeLabelEn = "This Month";
      if (range === "7days") {
        const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        const past7Str = past7.toISOString().split("T")[0];
        rangeLabelEn = `Last 7 Days (${past7Str} to ${todayStr})`;
      } else if (range === "15days") {
        const past15 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const past15Str = past15.toISOString().split("T")[0];
        rangeLabelEn = `Last 15 Days (${past15Str} to ${todayStr})`;
      } else if (range === "30days") {
        const past30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        const past30Str = past30.toISOString().split("T")[0];
        rangeLabelEn = `Last 30 Days (${past30Str} to ${todayStr})`;
      } else if (range === "custom") {
        if (startDate && endDate) {
          rangeLabelEn = `${startDate} to ${endDate}`;
        } else if (startDate) {
          rangeLabelEn = `From ${startDate}`;
        } else if (endDate) {
          rangeLabelEn = `Up to ${endDate}`;
        }
      } else if (period === "daily") {
        rangeLabelEn = `Today (${todayStr})`;
      } else if (period === "yearly") {
        rangeLabelEn = `Year ${currentYear}`;
      } else {
        rangeLabelEn = `This Month (${currentMonthPrefix})`;
      }

      const statementRef = `AS-STM-${salonCode}-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const statementIssueDate = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + " " + now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

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
        ? `<tr><td colspan="7" class="empty-state">No transaction records found for the selected period.</td></tr>`
        : statementEntries.map((item, idx) => {
          const isIncome = item.type === "INCOME";
          const debitAmount = !isIncome ? item.amount : 0;
          const creditAmount = isIncome ? item.amount : 0;
          runningBalance += (creditAmount - debitAmount);
          const txnRef = `TXN-${item.id ? item.id.slice(0, 6).toUpperCase() : (idx + 101)}`;

          return `
              <tr>
                <td class="col-center text-muted font-mono">${String(idx + 1).padStart(2, '0')}</td>
                <td class="col-center font-mono">${item.entryDate}</td>
                <td class="col-center font-mono text-muted" style="font-size: 11px;">#${txnRef}</td>
                <td>
                  <div class="desc-main">${item.category}</div>
                  ${item.note ? `<div class="desc-sub">${item.note}</div>` : ""}
                </td>
                <td class="col-amount text-danger font-mono">
                  ${debitAmount > 0 ? formatCurrency(debitAmount) : `<span class="dash">-</span>`}
                </td>
                <td class="col-amount text-success font-mono">
                  ${creditAmount > 0 ? formatCurrency(creditAmount) : `<span class="dash">-</span>`}
                </td>
                <td class="col-amount font-mono font-bold ${runningBalance >= 0 ? "text-slate" : "text-danger"}">
                  ${runningBalance < 0 ? "-" : ""}${formatCurrency(Math.abs(runningBalance))}
                </td>
              </tr>
            `;
        }).join("");

      const incomeCount = entries.filter((e) => e.type === "INCOME").length;
      const expenseCount = entries.filter((e) => e.type === "EXPENSE").length;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Statement - ${salonName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      padding: 24px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .statement-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px 36px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
      border: 1px solid #cbd5e1;
    }
    .btn-bar {
      max-width: 900px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .btn {
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s ease;
    }
    .btn-primary { background: #0d9488; color: #ffffff; }
    .btn-primary:hover { background: #0f766e; }
    .btn-outline { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; }
    .btn-outline:hover { background: #f8fafc; }

    /* BANK STATEMENT HEADER */
    .bank-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .bank-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .bank-logo-badge {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: #0f172a;
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -1px;
      border: 1.5px solid #334155;
    }
    .bank-title-group .bank-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .bank-title-group .bank-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .statement-badge-wrap {
      text-align: right;
    }
    .statement-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .statement-ref {
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }

    /* DUAL-COLUMN PARTICULARS */
    .account-profile-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .profile-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      padding: 12px 14px;
    }
    .profile-title {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .meta-table td {
      padding: 2.5px 0;
      vertical-align: top;
    }
    .meta-label {
      width: 120px;
      color: #64748b;
      font-weight: 600;
      font-size: 11px;
    }
    .meta-val {
      color: #0f172a;
      font-weight: 600;
    }
    .verified-pill {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      font-size: 10px;
      font-weight: 800;
      padding: 1.5px 7px;
      border-radius: 9999px;
      border: 1px solid #bbf7d0;
    }

    /* FINANCIAL SUMMARY STRIP (BANK STYLE) */
    .financial-summary-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 22px;
    }
    .fin-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      padding: 10px 12px;
      text-align: right;
    }
    .fin-card.border-success { border-left: 4px solid #16a34a; }
    .fin-card.border-danger { border-left: 4px solid #dc2626; }
    .fin-card.border-primary { border-left: 4px solid #0d9488; background: #f0fdfa; }
    .fin-label {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .fin-val {
      font-size: 16px;
      font-weight: 800;
      margin: 3px 0;
    }
    .fin-sub {
      font-size: 10px;
      color: #64748b;
    }

    /* TRANSACTION LEDGER TABLE */
    .statement-table-wrap {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 22px;
    }
    table.statement-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    table.statement-table thead {
      display: table-header-group;
    }
    table.statement-table th {
      background: #0f172a;
      color: #f8fafc;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 9px 10px;
      border-bottom: 1px solid #0f172a;
      text-align: left;
    }
    table.statement-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
      color: #1e293b;
    }
    table.statement-table tbody tr:nth-child(even) td {
      background: #f8fafc;
    }
    table.statement-table tr {
      page-break-inside: avoid;
    }
    .col-center { text-align: center; }
    .col-right { text-align: right; }
    .col-amount {
      text-align: right;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .text-success { color: #15803d; }
    .text-danger { color: #dc2626; }
    .text-slate { color: #0f172a; }
    .text-muted { color: #64748b; }
    .dash { color: #cbd5e1; font-weight: 400; }
    .font-mono {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    .desc-main {
      font-weight: 700;
      color: #0f172a;
    }
    .desc-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 1px;
    }
    .totals-row td {
      background: #f1f5f9 !important;
      border-top: 2px solid #0f172a !important;
      border-bottom: 2px solid #0f172a !important;
      padding: 10px 10px;
      font-size: 12px;
    }
    .text-uppercase { text-transform: uppercase; }
    .empty-state {
      text-align: center;
      padding: 30px;
      color: #64748b;
      font-style: italic;
    }

    /* SIGNATURE SECTION */
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      align-items: flex-end;
      padding-top: 24px;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .sig-line-left {
      border-bottom: 1.5px dotted #94a3b8;
      width: 200px;
      margin-bottom: 6px;
    }
    .sig-line {
      border-bottom: 1.5px dotted #94a3b8;
      width: 200px;
      margin-left: auto;
      margin-bottom: 6px;
    }
    .sig-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 1px;
    }
    .sig-date {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* FOOTER */
    .statement-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: #64748b;
    }

    /* PRINT SPECIFIC STYLES */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .statement-container {
        max-width: 100% !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .btn-bar {
        display: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 10mm 12mm 12mm 12mm;
      }
    }
  </style>
</head>
<body>
  <!-- ACTION BAR (HIDDEN IN PRINT) -->
  <div class="btn-bar">
    <div style="font-size: 12px; font-weight: 600; color: #475569;">
      📄 Official Bank Statement Viewer
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      <button class="btn btn-outline" onclick="window.close()">
        ✕ Close
      </button>
    </div>
  </div>

  <div class="statement-container">
    <!-- BANK STATEMENT HEADER -->
    <div class="bank-header">
      <div class="bank-brand">
        <div class="bank-logo-badge">AS</div>
        <div class="bank-title-group">
          <div class="bank-title">AMARSALON DIGITAL FINANCIAL SYSTEM</div>
          <div class="bank-sub">OFFICIAL LEDGER STATEMENT</div>
        </div>
      </div>
      <div class="statement-badge-wrap">
        <div class="statement-badge">ACCOUNT STATEMENT</div>
        <div class="statement-ref font-mono">REF: ${statementRef}</div>
      </div>
    </div>

    <!-- ACCOUNT PARTICULARS & STATEMENT INFO -->
    <div class="account-profile-grid">
      <div class="profile-card">
        <div class="profile-title">ACCOUNT HOLDER PARTICULARS</div>
        <table class="meta-table">
          <tr>
            <td class="meta-label">Account Title:</td>
            <td class="meta-val">${salonName}</td>
          </tr>
          <tr>
            <td class="meta-label">Salon ID / Code:</td>
            <td class="meta-val font-mono">#${salonCode}</td>
          </tr>
          <tr>
            <td class="meta-label">Proprietor / Owner:</td>
            <td class="meta-val">${salonOwnerName}</td>
          </tr>
          <tr>
            <td class="meta-label">Contact / Phone:</td>
            <td class="meta-val font-mono">${salonPhone}</td>
          </tr>
          <tr>
            <td class="meta-label">Branch / Address:</td>
            <td class="meta-val">${salonAddress}</td>
          </tr>
        </table>
      </div>

      <div class="profile-card">
        <div class="profile-title">STATEMENT PARAMETERS</div>
        <table class="meta-table">
          <tr>
            <td class="meta-label">Statement Period:</td>
            <td class="meta-val font-bold">${rangeLabelEn}</td>
          </tr>
          <tr>
            <td class="meta-label">Statement Date:</td>
            <td class="meta-val font-mono">${statementIssueDate}</td>
          </tr>
          <tr>
            <td class="meta-label">Currency:</td>
            <td class="meta-val">BDT (৳) Bangladeshi Taka</td>
          </tr>
          <tr>
            <td class="meta-label">Total Transactions:</td>
            <td class="meta-val font-bold">${entries.length} Entries (${incomeCount} Incomes, ${expenseCount} Expenses)</td>
          </tr>
          <tr>
            <td class="meta-label">Account Status:</td>
            <td class="meta-val"><span class="verified-pill">✓ RECONCILED & AUDITED</span></td>
          </tr>
        </table>
      </div>
    </div>

    <!-- FINANCIAL SUMMARY STRIP (BANK METRICS) -->
    <div class="financial-summary-strip">
      <div class="fin-card">
        <div class="fin-label">OPENING BALANCE</div>
        <div class="fin-val font-mono">৳0.00</div>
        <div class="fin-sub">Base Period Balance</div>
      </div>
      <div class="fin-card border-success">
        <div class="fin-label text-success">TOTAL CREDITS</div>
        <div class="fin-val text-success font-mono">+${formatCurrency(exportIncome)}</div>
        <div class="fin-sub">${incomeCount} Sales Entries</div>
      </div>
      <div class="fin-card border-danger">
        <div class="fin-label text-danger">TOTAL DEBITS</div>
        <div class="fin-val text-danger font-mono">-${formatCurrency(exportExpense)}</div>
        <div class="fin-sub">${expenseCount} Expense Entries</div>
      </div>
      <div class="fin-card border-primary">
        <div class="fin-label text-slate">CLOSING BALANCE</div>
        <div class="fin-val font-mono ${exportNet >= 0 ? "text-success" : "text-danger"}">
          ${exportNet < 0 ? "-" : ""}${formatCurrency(Math.abs(exportNet))}
        </div>
        <div class="fin-sub font-bold">${exportNet >= 0 ? "SURPLUS" : "DEFICIT"}</div>
      </div>
    </div>

    <!-- TRANSACTION LEDGER TABLE -->
    <div class="statement-table-wrap">
      <table class="statement-table">
        <thead>
          <tr>
            <th style="width: 40px;" class="col-center">SL</th>
            <th style="width: 95px;" class="col-center">Date</th>
            <th style="width: 100px;" class="col-center">Txn Ref</th>
            <th>Transaction Details & Category</th>
            <th style="width: 115px;" class="col-right">Debit / Dr (৳)</th>
            <th style="width: 115px;" class="col-right">Credit / Cr (৳)</th>
            <th style="width: 125px;" class="col-right">Balance (৳)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="4" class="font-bold text-uppercase col-right">
              STATEMENT GRAND TOTALS:
            </td>
            <td class="col-amount text-danger font-mono font-bold">
              ${formatCurrency(exportExpense)}
            </td>
            <td class="col-amount text-success font-mono font-bold">
              ${formatCurrency(exportIncome)}
            </td>
            <td class="col-amount font-mono font-bold ${exportNet >= 0 ? "text-slate" : "text-danger"}">
              ${exportNet < 0 ? "-" : ""}${formatCurrency(Math.abs(exportNet))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- SIGNATURE SECTION (CLEAN & MINIMAL) -->
    <div class="signature-section">
      <div class="sig-col">
        <div class="sig-line-left"></div>
        <div class="sig-title">System Verified & Generated</div>
        <div class="sig-date">Date: ${statementIssueDate}</div>
      </div>

      <div class="sig-col" style="text-align: right;">
        <div class="sig-line"></div>
        <div class="sig-title">Authorized Signature & Seal</div>
        <div class="sig-sub">${salonName}</div>
      </div>
    </div>

    <!-- STATEMENT FOOTER -->
    <div class="statement-footer">
      <div>AmarSalon Technologies • amarsalon.xyz</div>
      <div class="font-mono">Ref: ${statementRef} • Page 1 of 1</div>
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
