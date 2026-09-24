// src/components/LabOrders/Report/BillModal.jsx
import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Download } from "lucide-react";
import ModalShell from "../../common/Modal/ModalShell";
import { getOrderBillUrlApi, getSettingsApi, getGstSettingsApi } from "../../../api/api";
import { groupTestsByPackage } from "../../../utils/orderPricing";

export default function BillModal({ orderId, patient, tests, billTotal, paymentDone, onClose }) {
  // Group by the package each test was actually billed under — same
  // grouping used on the Confirm Order step and the order-detail Bill
  // section — instead of listing every test flat at its own price.
  const { packageGroups, individualTests } = groupTestsByPackage(tests);

  // The offer/savings note for each applied package: what it would have
  // cost buying the tests individually vs. the package price.
  const offers = packageGroups.map((pkg) => {
    const individualTotal = pkg.tests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    return {
      id: pkg.id,
      name: pkg.name,
      savings: Math.max(0, individualTotal - pkg.price),
    };
  });

  // billTotal comes from the server (order.bill_total) — the amount the
  // patient was actually charged. Fall back to summing catalog prices only
  // if it's ever missing (e.g. an older order), so the modal never breaks.
  const fallbackSubtotal = tests.reduce((sum, t) => sum + t.price, 0);
  const subtotal = billTotal != null ? billTotal : fallbackSubtotal;

  const [labInfo, setLabInfo] = useState(null);
  const [gstInfo, setGstInfo] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [downloadingBill, setDownloadingBill] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const iframeRef = useRef(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [labRes, gstRes] = await Promise.all([
          getSettingsApi(),
          getGstSettingsApi(),
        ]);
        setLabInfo(labRes.data);
        setGstInfo(gstRes.data);
      } catch (err) {
        console.error("Failed to load bill header settings:", err.message);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const gstEnabled = gstInfo?.is_gst_registered;
  const gstRate = gstEnabled ? Number(gstInfo.gst_rate) || 0 : 0;
  const gstAmount = gstEnabled ? (subtotal * gstRate) / 100 : 0;
  const grandTotal = subtotal + gstAmount;

  const invoiceNumber =
    gstEnabled && gstInfo?.invoice_prefix
      ? `${gstInfo.invoice_prefix}-${orderId}`
      : `#${orderId}`;

  async function handleDownloadBill() {
    setDownloadingBill(true);
    setDownloadError("");
    try {
      const data = await getOrderBillUrlApi(orderId);
      window.open(data.url, "_blank");
    } catch (err) {
      console.error("Download bill failed:", err.message);
      setDownloadError(err.message || "Couldn't prepare the bill. Please try again.");
    } finally {
      setDownloadingBill(false);
    }
  }

  // Prints an isolated iframe containing ONLY the bill markup — completely
  // decoupled from the rest of the app's DOM, so nothing else on the page
  // (modals, sidebars, other print-target elements) can leak into the
  // printed output or cause duplicate/blank pages.
  function handlePrint() {
    if (!labInfo) return;

    const addressLine = [labInfo.address, labInfo.city, labInfo.state, labInfo.pincode]
      .filter(Boolean)
      .join(", ");
    const contactLine = [labInfo.phone, labInfo.email].filter(Boolean).join("  ·  ");

    const packageRowsHtml = packageGroups
      .map(
        (pkg) => `
        <tr>
          <td>
            ${pkg.name} <span class="tag">Package</span>
            <div class="included-tests">${pkg.tests.map((t) => t.name).join(", ")}</div>
          </td>
          <td class="amount">${pkg.price.toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const individualRowsHtml = individualTests
      .map(
        (t) => `
        <tr>
          <td>${t.name}</td>
          <td class="amount">${t.price.toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const offersHtml = offers.length
      ? `
    <div class="offers">
      <div class="offers-title">Offers Applied</div>
      ${offers
        .map(
          (o) => `
        <div class="offer-row">
          <span>${o.name}</span>
          <span>${o.savings > 0 ? `You saved Rs. ${o.savings.toFixed(2)}` : "Applied"}</span>
        </div>`
        )
        .join("")}
    </div>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
  body {
    font-family: 'Noto Sans', 'DejaVu Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    color: #1f2937;
    padding: 36px 44px;
    line-height: 1.5;
  }
  .letterhead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    border-bottom: 3px solid #0d9488;
    padding-bottom: 18px;
    margin-bottom: 22px;
  }
  .letterhead .logo { width: 56px; height: 56px; object-fit: contain; margin-right: 14px; border-radius: 6px; }
  .letterhead .lab-block { display: flex; align-items: flex-start; }
  .letterhead .lab-name { font-size: 21px; font-weight: 700; color: #0f766e; letter-spacing: -0.01em; }
  .letterhead .lab-meta { font-size: 10.5px; color: #6b7280; margin-top: 3px; line-height: 1.6; }
  .letterhead .lab-gst { font-size: 10.5px; color: #374151; margin-top: 5px; }
  .letterhead .lab-gst strong { color: #111827; }
  .letterhead .lab-license { font-size: 10px; color: #9ca3af; margin-top: 3px; }
  .letterhead .doc-label { text-align: right; flex-shrink: 0; }
  .letterhead .doc-title { font-size: 15px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.04em; }
  .letterhead .doc-number { font-size: 11px; color: #0d9488; font-weight: 600; margin-top: 4px; }
  .meta-bar { display: flex; justify-content: space-between; background: #f9fafb; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
  .meta-bar .block .label { font-size: 9.5px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
  .meta-bar .block .value { font-size: 13px; font-weight: 600; color: #111827; }
  .meta-bar .block .sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .meta-bar .right { text-align: right; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  table.items thead th {
    background: #f0fdfa; text-align: left; padding: 10px 12px; font-size: 10px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e;
    border-top: 1px solid #99f6e4; border-bottom: 1px solid #99f6e4;
  }
  table.items thead th:first-child { border-radius: 6px 0 0 0; }
  table.items thead th:last-child { border-radius: 0 6px 0 0; }
  table.items th.amount, table.items td.amount { text-align: right; }
  table.items tbody td { padding: 10px 12px; font-size: 12.5px; border-bottom: 1px solid #f3f4f6; }
  table.items tbody tr:nth-child(even) td { background: #fafafa; }
  table.items .tag { font-size: 9.5px; font-weight: 600; color: #0d9488; text-transform: uppercase; letter-spacing: 0.03em; margin-left: 6px; }
  table.items .included-tests { font-size: 10.5px; color: #9ca3af; margin-top: 2px; }
  .offers { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 14px; margin: 10px 0 14px; }
  .offers .offers-title { font-size: 9.5px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .offers .offer-row { font-size: 11.5px; color: #115e59; display: flex; justify-content: space-between; }
  .totals { width: 100%; margin-top: 6px; }
  .totals td { padding: 5px 12px; font-size: 12px; }
  .totals .label { color: #6b7280; text-align: right; }
  .totals .value { color: #374151; text-align: right; width: 110px; font-weight: 500; }
  .totals .grand-row td { border-top: 2px solid #0d9488; padding-top: 12px; font-size: 15px; font-weight: 700; }
  .totals .grand-row .label { color: #0f766e; }
  .totals .grand-row .value { color: #0f766e; }
  .paid-badge {
    display: inline-block; background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 999px; margin-top: 8px;
  }
  .footer { text-align: center; margin-top: 40px; padding-top: 14px; border-top: 1px solid #f3f4f6; }
  .footer .disclaimer { font-size: 9.5px; color: #9ca3af; margin-bottom: 4px; font-style: italic; }
  .footer .generated { font-size: 9px; color: #d1d5db; }
</style>
</head>
<body>
  <div class="letterhead">
    <div class="lab-block">
      ${labInfo.logo_path ? `<img class="logo" src="${labInfo.logo_path}" alt="Logo">` : ""}
      <div>
        <div class="lab-name">${labInfo.lab_name}</div>
        <div class="lab-meta">${addressLine}<br>${contactLine}</div>
        ${
          gstEnabled
            ? `<div class="lab-gst">GSTIN: <strong>${gstInfo.gstin}</strong>${
                gstInfo.legal_business_name ? ` &nbsp;· ${gstInfo.legal_business_name}` : ""
              }</div>`
            : ""
        }
        ${labInfo.license_no ? `<div class="lab-license">Lic. No: ${labInfo.license_no}</div>` : ""}
      </div>
    </div>
    <div class="doc-label">
      <div class="doc-title">${gstEnabled ? "Tax Invoice" : "Bill"}</div>
      <div class="doc-number">${invoiceNumber}</div>
    </div>
  </div>

  <div class="meta-bar">
    <div class="block">
      <div class="label">Billed To</div>
      <div class="value">${patient.name}</div>
      <div class="sub">Reg No: ${patient.regNo || "-"}</div>
    </div>
    <div class="block right">
      <div class="label">Billed On</div>
      <div class="value">${new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}</div>
      ${paymentDone ? `<div class="paid-badge">Paid</div>` : ""}
    </div>
  </div>

  <table class="items">
    <thead><tr><th>Test</th><th class="amount">Amount (Rs.)</th></tr></thead>
    <tbody>${packageRowsHtml}${individualRowsHtml}</tbody>
  </table>

  ${offersHtml}

  <table class="totals">
    ${
      gstEnabled
        ? `<tr><td class="label" style="width:auto;">Subtotal</td><td class="value">Rs. ${subtotal.toFixed(2)}</td></tr>
           <tr><td class="label" style="width:auto;">GST (${gstRate}%)</td><td class="value">Rs. ${gstAmount.toFixed(2)}</td></tr>`
        : ""
    }
    <tr class="grand-row"><td class="label" style="width:auto;">Total Payable</td><td class="value">Rs. ${grandTotal.toFixed(2)}</td></tr>
  </table>

  <div class="footer">
    ${labInfo.footer_note ? `<p class="disclaimer">${labInfo.footer_note}</p>` : ""}
    <p class="generated">This is a computer-generated bill · ${labInfo.lab_name} · Generated on ${new Date().toLocaleString("en-IN")}</p>
  </div>
</body>
</html>`;

    const iframe = iframeRef.current;
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
    }, 250);
  }

  return (
    <ModalShell
      title={`Bill — Order ${invoiceNumber}`}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="px-6 py-5">
        {/* ── Letterhead ─────────────────────────────────────── */}
        {!loadingSettings && labInfo && (
          <div className="flex items-start justify-between border-b-[3px] border-teal-600 pb-4 mb-4">
            <div className="flex items-start">
              {labInfo.logo_path && (
                <img
                  src={labInfo.logo_path}
                  alt="Logo"
                  className="w-12 h-12 object-contain mr-3 rounded"
                />
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{labInfo.lab_name}</h2>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  {[labInfo.address, labInfo.city, labInfo.state, labInfo.pincode]
                    .filter(Boolean)
                    .join(", ")}
                  <br />
                  {[labInfo.phone, labInfo.email].filter(Boolean).join("  ·  ")}
                </p>
                {gstEnabled && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    GSTIN: <span className="font-semibold text-gray-900">{gstInfo.gstin}</span>
                    {gstInfo.legal_business_name && (
                      <span className="text-gray-400"> · {gstInfo.legal_business_name}</span>
                    )}
                  </p>
                )}
                {labInfo.license_no && (
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    Lic. No: {labInfo.license_no}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-900">
                {gstEnabled ? "Tax Invoice" : "Bill"}
              </p>
              <p className="text-xs font-semibold text-teal-600 mt-1">{invoiceNumber}</p>
            </div>
          </div>
        )}

        {/* ── Billed To block ────────────────────────────────── */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 mb-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
              Billed To
            </p>
            <p className="text-sm font-semibold text-gray-900">{patient.name}</p>
          </div>
          {paymentDone && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={13} />
              Paid
            </span>
          )}
        </div>

        {/* ── Items list — grouped by applied package, same as Confirm
              Order, instead of every test flat ────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
          <span className="text-xs font-medium text-gray-400 tracking-wide">ITEM</span>
          <span className="text-xs font-medium text-gray-400 tracking-wide">AMOUNT</span>
        </div>
        {packageGroups.map((pkg) => (
          <div key={`pkg-${pkg.id}`} className="py-2 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">
                {pkg.name} <span className="text-xs text-gray-400">(package)</span>
              </span>
              <span className="text-sm text-gray-700">Rs. {pkg.price.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {pkg.tests.map((t) => t.name).join(", ")}
            </p>
          </div>
        ))}
        {individualTests.map((test) => (
          <div
            key={test.id}
            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
          >
            <span className="text-sm text-gray-900">{test.name}</span>
            <span className="text-sm text-gray-700">Rs. {test.price.toFixed(2)}</span>
          </div>
        ))}

        {/* ── Offers applied ─────────────────────────────────── */}
        {offers.length > 0 && (
          <div className="mt-3 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
              Offers Applied
            </p>
            {offers.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between text-xs text-teal-800">
                <span>{offer.name}</span>
                <span className="font-medium">
                  {offer.savings > 0 ? `You saved ₹${offer.savings.toFixed(2)}` : "Applied"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── GST breakdown ──────────────────────────────────── */}
        {gstEnabled && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>GST ({gstRate}%)</span>
              <span>Rs. {gstAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* ── Grand total ────────────────────────────────────── */}
        <div
          className={`flex items-center justify-between rounded-lg px-4 py-3 mt-3 ${
            paymentDone ? "bg-green-50" : "bg-teal-50"
          }`}
        >
          <span
            className={`text-sm font-medium ${
              paymentDone ? "text-green-700" : "text-teal-700"
            }`}
          >
            {paymentDone ? "Paid" : "Total payable"}
          </span>
          <span
            className={`text-lg font-bold ${
              paymentDone ? "text-green-700" : "text-teal-700"
            }`}
          >
            Rs. {grandTotal.toFixed(2)}
          </span>
        </div>

        {labInfo?.footer_note && (
          <p className="text-[9px] italic text-gray-400 text-center mt-6">
            {labInfo.footer_note}
          </p>
        )}
      </div>

      {downloadError && <p className="text-sm text-red-600 mt-3 px-6">{downloadError}</p>}

      {/* ── Action bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          Close
        </button>
        <button
          onClick={handlePrint}
          disabled={loadingSettings}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-60"
        >
          Print Bill
        </button>
        <button
          onClick={handleDownloadBill}
          disabled={downloadingBill}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer disabled:opacity-60"
        >
          <Download size={16} />
          {downloadingBill ? "Preparing…" : "Download Bill PDF"}
        </button>
      </div>

      {/* Hidden iframe used purely as a print target — nothing else on the
          page can leak into its output, so no duplicate pages, no
          interference from app layout/CSS. */}
      <iframe ref={iframeRef} title="bill-print" style={{ display: "none" }} />
    </ModalShell>
  );
}