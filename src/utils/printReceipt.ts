/**
 * CBT PRO X / SAFSMS Hardcopy Slip & Receipt Printing Engine
 * 
 * Provides pristine, high-fidelity printable documents (Payslips and School Fee Receipts)
 * using an isolated hidden iframe printing method that works reliably even inside
 * nested preview iframes, prevents dashboard UI contamination, and formats
 * cleanly for paper printers or "Save as PDF".
 */

export interface PayslipData {
  id: string;
  staffId: string;
  payPeriod: string;
  netPay: number;
  createdAt: string;
  name?: string;
  role?: string;
  baseSalary?: number;
  allowances?: number;
  deductions?: number;
}

export interface TuitionReceiptData {
  receiptNo: string;
  studentId?: string;
  studentName: string;
  regNo?: string;
  className?: string;
  amount: number;
  date: string;
  time?: string;
  totalBill?: number;
  totalPaid?: number;
  balanceRemaining: number;
  status: string;
  term?: string;
  session?: string;
  paymentMethod?: string;
}

/**
 * Print an HTML document cleanly using an isolated hidden iframe.
 * This completely isolates the print output from the web app's UI,
 * prevents modal clipping, and avoids standard browser popup blockers.
 */
export function printDocumentHtml(htmlContent: string, documentTitle: string = "Official Printout"): void {
  // Remove any previous print iframes
  const existingIframe = document.getElementById("cbt-print-engine-iframe");
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "cbt-print-engine-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback: popup window
    const popup = window.open("", "_blank");
    if (popup) {
      popup.document.open();
      popup.document.write(htmlContent);
      popup.document.close();
      popup.focus();
      popup.print();
    }
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Give resources (fonts/styles) a moment to render before calling print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Iframe print error, falling back to popup:", e);
      const popup = window.open("", "_blank");
      if (popup) {
        popup.document.open();
        popup.document.write(htmlContent);
        popup.document.close();
        popup.focus();
        popup.print();
      }
    }
  }, 350);
}

/**
 * Generates and prints the Official Staff Faculty Payslip Slip
 */
export function printStaffPayslip(payslip: PayslipData, staffMember?: any): void {
  const name = staffMember?.name || payslip.name || "Faculty Member";
  const role = staffMember?.role || payslip.role || "Teacher";
  const staffId = staffMember?.id || payslip.staffId || "TCH-001";
  const base = Number(staffMember?.baseSalary || payslip.baseSalary || (payslip.netPay * 0.75));
  const allow = Number(staffMember?.allowances || payslip.allowances || (payslip.netPay * 0.35));
  const deduct = Number(staffMember?.deductions || payslip.deductions || (payslip.netPay * 0.10));
  const net = Number(payslip.netPay || (base + allow - deduct));
  const formattedDate = new Date(payslip.createdAt || Date.now()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Faculty Payslip - ${name} - ${payslip.payPeriod}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.4;
      font-size: 13px;
      padding: 10px;
    }
    .slip-container {
      max-width: 780px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      border-radius: 8px;
      padding: 24px;
      position: relative;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header-logo-block {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-crest {
      width: 54px;
      height: 54px;
      background: #312e81;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 22px;
      border-radius: 8px;
      letter-spacing: -1px;
    }
    .header-text h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-text p {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .badge-voucher {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 14px;
      text-align: right;
    }
    .badge-voucher .title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #312e81;
      letter-spacing: 0.5px;
    }
    .badge-voucher .code {
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 20px;
    }
    .meta-cell {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .meta-value {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .table-section {
      margin-bottom: 20px;
    }
    .table-section h3 {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 12px;
      text-align: left;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    th.num, td.num {
      text-align: right;
    }
    td {
      padding: 9px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    tr:last-child td {
      border-bottom: 1px solid #cbd5e1;
    }
    .highlight-net {
      background: #eef2ff;
      border: 2px solid #6366f1;
      border-radius: 8px;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .highlight-net .label {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      color: #312e81;
      letter-spacing: 1px;
    }
    .highlight-net .amount {
      font-size: 22px;
      font-weight: 900;
      color: #1e1b4b;
      font-family: monospace;
    }
    .stamp-container {
      position: absolute;
      right: 40px;
      bottom: 100px;
      opacity: 0.85;
      transform: rotate(-10deg);
      pointer-events: none;
    }
    .stamp {
      border: 3px double #15803d;
      color: #15803d;
      padding: 8px 16px;
      border-radius: 6px;
      text-transform: uppercase;
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 2px;
      text-align: center;
    }
    .stamp .stamp-sub {
      font-size: 8px;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      margin-top: 20px;
    }
    .sig-block {
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-bottom: 6px;
      margin-top: 36px;
    }
    .sig-title {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
      font-family: monospace;
    }
    @media print {
      body {
        padding: 0;
      }
      .slip-container {
        border-color: #000;
      }
    }
  </style>
</head>
<body>
  <div class="slip-container">
    <div class="header">
      <div class="header-logo-block">
        <div class="logo-crest">CPX</div>
        <div class="header-text">
          <h1>CBT PRO X ACADEMY</h1>
          <p>Human Resources & Faculty Payroll Ledger</p>
        </div>
      </div>
      <div class="badge-voucher">
        <div class="title">Official Payslip Voucher</div>
        <div class="code">ID: ${payslip.id}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-cell">
        <span class="meta-label">Faculty Member / Employee</span>
        <span class="meta-value">${name}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Staff Registry ID</span>
        <span class="meta-value" style="font-family: monospace;">${staffId}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Designation / Role</span>
        <span class="meta-value">${role}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Payroll Period</span>
        <span class="meta-value">${payslip.payPeriod}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Disbursement Date</span>
        <span class="meta-value">${formattedDate}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Payment Channel</span>
        <span class="meta-value">Direct NIP Bank Transfer (Verified)</span>
      </div>
    </div>

    <div class="table-section">
      <h3>Remuneration & Deduction Analysis</h3>
      <table>
        <thead>
          <tr>
            <th>Component Description</th>
            <th>Classification</th>
            <th class="num">Amount (₦)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Base Monthly Salary</td>
            <td>Basic Compensation</td>
            <td class="num" style="font-family: monospace; font-weight: 600;">₦${base.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Housing & Transport Allowance</td>
            <td>Allowance (+)</td>
            <td class="num" style="font-family: monospace; color: #16a34a; font-weight: 600;">+₦${allow.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Statutory Tax, Pension & Welfare Deductions</td>
            <td>Deduction (-)</td>
            <td class="num" style="font-family: monospace; color: #dc2626; font-weight: 600;">-₦${deduct.toLocaleString()}</td>
          </tr>
          <tr style="font-weight: 700; background: #f8fafc;">
            <td colspan="2">Gross Faculty Compensation (Base + Allowances)</td>
            <td class="num" style="font-family: monospace;">₦${(base + allow).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="highlight-net">
      <div>
        <div class="label">Net Disbursed Take-Home Remuneration</div>
        <div style="font-size: 10px; color: #4338ca; margin-top: 2px;">Fully credited to employee bank account of record</div>
      </div>
      <div class="amount">₦${net.toLocaleString()}</div>
    </div>

    <div class="stamp-container">
      <div class="stamp">
        <div>VERIFIED & PAID</div>
        <div class="stamp-sub">CBT PRO X HRM • ${payslip.payPeriod}</div>
      </div>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-title">Bursar / Accounts Office</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-title">Head of Human Resources</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-title">Employee Signature</div>
      </div>
    </div>

    <div class="footer">
      This is an official system-generated payroll document issued under the EduOS Governance Framework. Document Hash: ${payslip.id}-${Date.now().toString().slice(-4)}
    </div>
  </div>
</body>
</html>`;

  printDocumentHtml(html, `Payslip-${name}-${payslip.payPeriod}`);
}

/**
 * Generates and prints the Official SAFSMS Tuition & School Fee Payment Receipt
 */
export function printTuitionReceipt(receipt: TuitionReceiptData, student?: any, bill?: any): void {
  const studentName = receipt.studentName || student?.name || "Student";
  const regNo = receipt.regNo || student?.regNo || `STU-${Date.now().toString().slice(-4)}`;
  const className = receipt.className || student?.className || "Senior Secondary";
  const total = Number(receipt.totalBill || bill?.total || 120000);
  const paidNow = Number(receipt.amount || 0);
  const balance = Number(receipt.balanceRemaining ?? (bill?.balance ?? (total - paidNow)));
  const totalPaid = Number(receipt.totalPaid || (bill?.paid ?? (total - balance)));
  const term = receipt.term || bill?.term || "2025/2026 Session - 2nd Term";
  const receiptNo = receipt.receiptNo || `SAF-REC-${Date.now().toString().slice(-6)}`;
  const dateStr = receipt.date || new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const timeStr = receipt.time || new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const isCleared = balance <= 0;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SAFSMS Tuition Receipt - ${studentName} - ${receiptNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.4;
      font-size: 13px;
      padding: 10px;
    }
    .receipt-container {
      max-width: 760px;
      margin: 0 auto;
      border: 2px solid #4338ca;
      border-radius: 8px;
      padding: 24px;
      position: relative;
      background: #fff;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #4338ca;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .crest-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .crest {
      width: 50px;
      height: 50px;
      background: #4338ca;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
      border-radius: 8px;
    }
    .school-info h1 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .school-info p {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .receipt-id-box {
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 6px;
      padding: 6px 12px;
      text-align: right;
    }
    .receipt-id-box .lbl {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #6d28d9;
    }
    .receipt-id-box .val {
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .info-card {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 18px;
    }
    .info-field {
      display: flex;
      flex-direction: column;
    }
    .field-lbl {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #7e22ce;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .field-val {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      text-align: left;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    th.num, td.num {
      text-align: right;
    }
    td {
      padding: 9px 10px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    .total-row td {
      font-weight: 700;
      background: #f8fafc;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .highlight-card {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-box {
      border-radius: 6px;
      padding: 12px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .stat-box.paid {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }
    .stat-box.paid .lbl { color: #065f46; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .stat-box.paid .amt { color: #047857; font-size: 17px; font-weight: 900; font-family: monospace; }
    
    .stat-box.curr {
      background: #eef2ff;
      border-color: #c7d2fe;
    }
    .stat-box.curr .lbl { color: #3730a3; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .stat-box.curr .amt { color: #4338ca; font-size: 17px; font-weight: 900; font-family: monospace; }

    .stat-box.bal {
      background: ${isCleared ? "#f0fdf4" : "#fff1f2"};
      border-color: ${isCleared ? "#bbf7d0" : "#fecdd3"};
    }
    .stat-box.bal .lbl { color: ${isCleared ? "#166534" : "#9f1239"}; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .stat-box.bal .amt { color: ${isCleared ? "#15803d" : "#be123c"}; font-size: 17px; font-weight: 900; font-family: monospace; }

    .clearance-banner {
      padding: 10px 14px;
      border-radius: 6px;
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
      background: ${isCleared ? "#dcfce7" : "#fef3c7"};
      border: 1px solid ${isCleared ? "#86efac" : "#fde68a"};
      color: ${isCleared ? "#166534" : "#92400e"};
    }

    .stamp-box {
      position: absolute;
      right: 36px;
      bottom: 90px;
      opacity: 0.88;
      transform: rotate(-8deg);
      pointer-events: none;
    }
    .stamp-inner {
      border: 3px double #4338ca;
      color: #4338ca;
      padding: 8px 16px;
      border-radius: 6px;
      text-align: center;
      font-weight: 900;
      font-size: 13px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .signatures {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      margin-top: 14px;
    }
    .sig-block {
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-top: 36px;
      margin-bottom: 4px;
    }
    .sig-title {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
      font-family: monospace;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="top-bar">
      <div class="crest-wrap">
        <div class="crest">SAF</div>
        <div class="school-info">
          <h1>CBT PRO X ACADEMY</h1>
          <p>SAFSMS Bursary Desk • Revenue & Tuition Collection</p>
        </div>
      </div>
      <div class="receipt-id-box">
        <div class="lbl">Official Receipt No</div>
        <div class="val">${receiptNo}</div>
      </div>
    </div>

    <div class="info-card">
      <div class="info-field">
        <span class="field-lbl">Student Full Name</span>
        <span class="field-val">${studentName}</span>
      </div>
      <div class="info-field">
        <span class="field-lbl">Admission / Reg No</span>
        <span class="field-val" style="font-family: monospace;">${regNo}</span>
      </div>
      <div class="info-field">
        <span class="field-lbl">Enrolled Class & Stream</span>
        <span class="field-val">${className}</span>
      </div>
      <div class="info-field">
        <span class="field-lbl">Academic Billing Term</span>
        <span class="field-val">${term}</span>
      </div>
      <div class="info-field">
        <span class="field-lbl">Transaction Date & Time</span>
        <span class="field-val">${dateStr} at ${timeStr}</span>
      </div>
      <div class="info-field">
        <span class="field-lbl">Payment Method</span>
        <span class="field-val">SAFSMS Direct Bursary / Cash Tender</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Particulars / Fee Breakdown</th>
          <th>Session</th>
          <th class="num">Assessed (₦)</th>
          <th class="num">Paid Now (₦)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Term Tuition, Science Laboratory & ICT Infrastructure Levy</td>
          <td>${term}</td>
          <td class="num" style="font-family: monospace;">₦${total.toLocaleString()}</td>
          <td class="num" style="font-family: monospace; font-weight: 700; color: #16a34a;">₦${paidNow.toLocaleString()}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">Amount Tendered & Processed in this Transaction</td>
          <td colspan="2" class="num" style="font-family: monospace; font-size: 14px; color: #4338ca;">
            ₦${paidNow.toLocaleString()}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="highlight-card">
      <div class="stat-box curr">
        <div class="lbl">Tendered In This Receipt</div>
        <div class="amt">₦${paidNow.toLocaleString()}</div>
      </div>
      <div class="stat-box paid">
        <div class="lbl">Cumulative Paid To Date</div>
        <div class="amt">₦${totalPaid.toLocaleString()}</div>
      </div>
      <div class="stat-box bal">
        <div class="lbl">${isCleared ? "Debtor Status" : "Outstanding Balance"}</div>
        <div class="amt">${isCleared ? "CLEARED" : `₦${balance.toLocaleString()}`}</div>
      </div>
    </div>

    <div class="clearance-banner">
      ${isCleared 
        ? "✓ OFFICIAL CLEARANCE GRANTED: All tuition liabilities for this term are fully satisfied. Eligible for all examinations." 
        : `⚠ PARTIAL PAYMENT ACKNOWLEDGED: Outstanding balance of ₦${balance.toLocaleString()} remaining on ledger.`}
    </div>

    <div class="stamp-box">
      <div class="stamp-inner">
        <div>SAFSMS VERIFIED</div>
        <div style="font-size: 8px; letter-spacing: 1px; margin-top: 2px;">BURSARY AUDIT STAMP</div>
      </div>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-title">School Bursar & Cashier Officer</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-title">Registrar / Accounts Signature</div>
      </div>
    </div>

    <div class="footer">
      Generated automatically via SAFSMS Financial Module. Valid without physical alteration. Audit Key: ${receiptNo}
    </div>
  </div>
</body>
</html>`;

  printDocumentHtml(html, `Tuition-Receipt-${studentName}-${receiptNo}`);
}
