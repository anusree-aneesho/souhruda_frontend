// src/components/LabOrders/Report/Report.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import ReportHeader from "./ReportHeader";
import FollowUpSuggestions from "./FollowUpSuggestions";
import BillModal from "./BillModal";
import WhatsAppSentModal from "./WhatsAppSentModal";
import { findOrderById } from "../../../data/labOrders";
import { calculateFlag } from "../../../utils/calculateFlag";
import { getOrderReportUrlApi, getSettingsApi, getGstSettingsApi } from "../../../api/api";

export default function Report() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const [letterheadOn, setLetterheadOn] = useState(true);
  const [isBillOpen, setBillOpen] = useState(false);
  const [isWhatsAppOpen, setWhatsAppOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [labInfo, setLabInfo] = useState(null);
  const [gstInfo, setGstInfo] = useState(null);
  const iframeRef = useRef(null);

  const existingOrder = findOrderById(orderId);
  const order = existingOrder || (state ? { orderId, ...state } : null);

  const [paymentDone, setPaymentDone] = useState(Boolean(order?.paymentDone));

  useEffect(() => {
    setPaymentDone(Boolean(order?.paymentDone));
  }, [orderId]);

  useEffect(() => {
    Promise.all([getSettingsApi(), getGstSettingsApi()])
      .then(([labRes, gstRes]) => {
        setLabInfo(labRes.data);
        setGstInfo(gstRes.data);
      })
      .catch((err) => console.error("Failed to load lab/GST settings:", err.message));
  }, []);

  const patient = order?.patient || { name: "Aaa ff", age: "11", gender: "Male", regNo: "200128355" };
  const tests = order?.tests || [];

  function formatReportDate(raw) {
    if (!raw) return "16 Sep 2026";
    if (raw.includes(" at ")) return raw.split(" at ")[0];
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const reportDate = formatReportDate(order?.orderedAt);

  const results = state?.results || Object.fromEntries(tests.map((t) => [t.id, t.result || ""]));

  const flags = useMemo(
    () => Object.fromEntries(tests.map((t) => [t.id, calculateFlag(t.range, results[t.id])])),
    [tests, results]
  );

  const testsWithResults = tests.map((t) => ({ ...t, result: results[t.id] }));
  const testsByCategory = testsWithResults.reduce((acc, t) => {
    acc[t.category] = acc[t.category] || [];
    acc[t.category].push(t);
    return acc;
  }, {});

  function handleScheduleReminder(test) {
    console.log("Schedule reminder for", test.name);
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    setDownloadError("");
    try {
      const data = await getOrderReportUrlApi(orderId, letterheadOn);
      window.open(data.url, "_blank");
    } catch (err) {
      console.error("Download PDF failed:", err.message);
      setDownloadError(err.message || "Couldn't prepare the report. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  // Print Function — mirrors the Blade PDF-download template exactly.
  // Kept as a self-contained HTML document (written into a hidden iframe)
  // rather than relying on window.print(), because the iframe approach gives
  // pixel-perfect A4 sizing and doesn't inherit any app-level CSS.
  function handlePrint() {
    if (!labInfo) return;

    const gstEnabled = gstInfo?.is_gst_registered;
    const addressLine = [labInfo.address, labInfo.city, labInfo.state, labInfo.pincode]
      .filter(Boolean)
      .join(", ");

    const panelsHtml = Object.entries(testsByCategory)
      .map(([category, categoryTests]) => {
        const rowsHtml = categoryTests
          .map((t) => {
            const flag = flags[t.id];
            const isAbnormal = ["low", "high", "abnormal"].includes(flag);
            const flagTag =
              flag === "high" ? `<span class="flag-tag">High</span>` : flag === "low" ? `<span class="flag-tag">Low</span>` : "";
            return `
                <tr>
                    <td>${t.name}</td>
                    <td class="result ${isAbnormal ? "abnormal" : ""}">
                        ${results[t.id] || "—"}
                        ${flagTag}
                    </td>
                    <td class="range">${t.range || "—"}</td>
                    <td class="range">${t.unit || ""}</td>
                </tr>`;
          })
          .join("");

        return `
    <div class="panel-title">${category.toUpperCase()}</div>
    <div class="results-wrap">
        <table class="results">
            <thead>
                <tr>
                    <th style="width: 34%;">Investigation</th>
                    <th style="width: 22%;">Result</th>
                    <th style="width: 28%;">Reference Value</th>
                    <th style="width: 16%;">Unit</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}
            </tbody>
        </table>
    </div>`;
      })
      .join("");

    const gstStripHtml =
      gstEnabled || labInfo.license_no
        ? `
    <div class="lab-gst-strip">
        ${gstEnabled ? `GSTIN: <strong>${gstInfo.gstin}</strong>` : ""}
        ${gstEnabled && gstInfo.legal_business_name ? `&nbsp;· ${gstInfo.legal_business_name}` : ""}
        ${gstEnabled && labInfo.license_no ? `&nbsp;&nbsp;|&nbsp;&nbsp;` : ""}
        ${labInfo.license_no ? `Lic. No: ${labInfo.license_no}` : ""}
    </div>`
        : "";

    const logoUrl = labInfo.logo_path
      ? new URL(labInfo.logo_path, window.location.origin).href
      : "";

    const letterheadHtml = letterheadOn
      ? `
    <div class="header">
        <div class="lab-block">
            ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="Logo">` : ""}
            <div>
                <div class="lab-name">${labInfo.lab_name}</div>
                <div class="tagline">Accurate · Caring · Instant</div>
            </div>
        </div>
        <div class="contact">
            ${labInfo.phone ? `<div class="row"><span class="icon">☎</span>${labInfo.phone}</div>` : ""}
            ${labInfo.email ? `<div class="row"><span class="icon">✉</span>${labInfo.email}</div>` : ""}
        </div>
    </div>

    ${addressLine ? `<div class="address-strip">${addressLine}</div>` : ""}

    <div class="accent-bar"></div>
    ${gstStripHtml}`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }

    @page { size: A4; margin: 0; }

    html, body { width: 210mm; height: 297mm; }

    body {
        font-family: 'Noto Sans', 'DejaVu Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 10.5px;
        line-height: 1.35;
        color: #1f2937;
        height: 297mm;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .page { padding: 0; display: flex; flex-direction: column; height: 100%; }

    .header { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px 10px 24px; flex-shrink: 0; }
    .header .lab-block { display: flex; align-items: center; }
    .header .logo { width: 48px; height: 48px; object-fit: contain; margin-right: 12px; }
    .header .lab-name { font-size: 20px; font-weight: 800; letter-spacing: -0.01em; color: #111827; line-height: 1.15; }
    .header .tagline { font-size: 9px; color: #6b7280; letter-spacing: 0.08em; margin-top: 1px; text-transform: uppercase; }
    .header .contact { text-align: right; font-size: 10px; color: #374151; line-height: 1.5; }
    .header .contact .row { white-space: nowrap; }
    .header .contact .icon { color: #0d9488; font-weight: 700; margin-right: 4px; }

    .address-strip { background: #111827; color: #e5e7eb; text-align: center; font-size: 10px; letter-spacing: 0.03em; padding: 4px 12px; flex-shrink: 0; }

    .accent-bar { height: 5px; background: linear-gradient(90deg, #0d9488 0%, #0d9488 60%, #111827 60%, #111827 100%); flex-shrink: 0; }

    .info-block { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 24px; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
    .info-block .col { flex: 1; }
    .info-block .patient-name { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px; }
    .info-block .patient-meta { font-size: 10px; color: #4b5563; line-height: 1.5; }
    .info-block .code-box { width: 62px; height: 62px; border: 1.5px dashed #d1d5db; border-radius: 6px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 8px; color: #9ca3af; margin: 0 18px; flex-shrink: 0; }
    .info-block .right-col { text-align: right; font-size: 10px; color: #4b5563; line-height: 1.5; }
    .info-block .right-col strong { color: #111827; }

    .lab-gst-strip { text-align: center; font-size: 9px; color: #6b7280; padding: 4px 24px 0 24px; flex-shrink: 0; }
    .lab-gst-strip strong { color: #111827; }

    .panel-title { text-align: center; font-size: 11.5px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: #111827; margin: 10px 24px 6px 24px; flex-shrink: 0; }

    .results-wrap { padding: 0 24px; }
    table.results { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    table.results thead { display: table-header-group; }
    table.results thead th { text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #374151; padding: 4px 4px; border-bottom: 2px solid #111827; }
    table.results th.result-col, table.results td.result-col { text-align: left; }
    table.results tbody td { padding: 4px 4px; font-size: 10.5px; border-bottom: 1px solid #f3f4f6; }
    table.results tbody tr { page-break-inside: avoid; }

    td.result { font-weight: 700; color: #111827; }
    td.result.abnormal { color: #d97706; }
    td.result .flag-tag { font-size: 8px; font-weight: 700; margin-left: 3px; }
    td.range { color: #6b7280; }

    .end-line { text-align: center; font-size: 9px; color: #9ca3af; letter-spacing: 0.05em; margin: 2px 24px 4px 24px; flex-shrink: 0; }

    .disclaimer-strip { text-align: center; font-size: 9px; color: #6b7280; font-style: italic; padding: 0 24px 6px 24px; flex-shrink: 0; }

    .footer-meta { display: flex; justify-content: space-between; font-size: 8.5px; color: #9ca3af; padding: 4px 24px; border-top: 1px solid #e5e7eb; flex-shrink: 0; margin-top: auto; }
    .footer-band { background: #0d9488; color: #ffffff; text-align: center; font-size: 10px; font-weight: 700; letter-spacing: 0.03em; padding: 6px 12px; flex-shrink: 0; }
</style>
</head>
<body>
<div class="page">

    ${letterheadHtml}

    <div class="info-block">
        <div class="col">
            <div class="patient-name">${patient.name}</div>
            <div class="patient-meta">
                Age: ${patient.age} Years<br>
                Sex: ${patient.gender}<br>
                PID: ${patient.regNo}
            </div>
        </div>

        <div class="code-box">QR</div>

        <div class="col right-col">
            <div><strong>Order No:</strong> ${orderId}</div>
            <div><strong>Ref. By:</strong> ${order?.referredBy || "Self"}</div>
            <div>Registered: ${reportDate}</div>
            <div>Reported: ${reportDate}</div>
        </div>
    </div>

    ${panelsHtml}

    <div class="end-line">**** End of Report ****</div>

    ${labInfo.footer_note ? `<div class="disclaimer-strip">${labInfo.footer_note}</div>` : `<div class="disclaimer-strip">Reports are not valid for medico-legal purposes.</div>`}

    <div class="footer-meta">
        <span>Generated on: ${new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        <span>Page 1 of 1</span>
    </div>

    <div class="footer-band">${labInfo.lab_name}</div>

</div>
</body>
</html>`;

    const iframe = iframeRef.current;
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => iframe.contentWindow.print(), 250);
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar - Kept as is but not part of the printed visual */}
      <div className="no-print">
        <ReportHeader
          orderId={orderId}
          letterheadOn={letterheadOn}
          onLetterheadToggle={setLetterheadOn}
          onPrint={handlePrint}
          onBillClick={() => setBillOpen(true)}
          onWhatsAppClick={() => setWhatsAppOpen(true)}
          onDownloadClick={handleDownloadPdf}
          downloadingPdf={downloadingPdf}
        />
      </div>

      {downloadError && <p className="text-sm text-red-600 no-print">{downloadError}</p>}

      <div className="no-print">
        <h1 className="text-2xl font-bold text-gray-900">Report — {patient.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Order #{orderId} · {reportDate}</p>
      </div>

      {/* Main Report Container — pure Tailwind, matches the reference image */}
      <div className="bg-white max-w-[210mm] mx-auto border border-gray-200 shadow-sm font-sans text-[#1f2937]">

        {/* ── Header Section ─────────────────────────────────────── */}
        {letterheadOn && (
          <>
            <div className="flex items-center justify-between px-6 pt-4 pb-3">
              <div className="flex items-center">
                {labInfo?.logo_path ? (
                  <img
                    src={labInfo.logo_path}
                    alt="Logo"
                    className="w-12 h-12 object-contain mr-3"
                  />
                ) : (
                  <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-[10px] font-bold">SMC</span>
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
                    {labInfo?.lab_name || "SOUHRUDA MEDICAL CENTRE"}
                  </h1>
                  <p className="text-[9px] text-gray-500 uppercase tracking-[0.08em] mt-0.5">
                    Accurate · Caring · Instant
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-gray-700 leading-relaxed">
                {labInfo?.phone && (
                  <p className="whitespace-nowrap">
                    <span className="text-teal-600 font-bold mr-1">☎</span>
                    {labInfo.phone}
                  </p>
                )}
                {labInfo?.email && (
                  <p className="whitespace-nowrap">
                    <span className="text-teal-600 font-bold mr-1">✉</span>
                    {labInfo.email}
                  </p>
                )}
              </div>
            </div>

            {/* Address strip */}
            <div className="bg-[#111827] text-gray-200 text-center text-[10px] tracking-wide py-1 px-3">
              {labInfo
                ? [labInfo.address, labInfo.city, labInfo.state, labInfo.pincode].filter(Boolean).join(", ")
                : "New City Hospital, Maner Road, Kozhikode, Kerala, 673004"}
            </div>

            {/* Accent bar (teal → dark split) */}
            <div
              className="h-[5px] w-full"
              style={{ background: "linear-gradient(90deg, #0d9488 0%, #0d9488 60%, #111827 60%, #111827 100%)" }}
            />

            {/* GST / license strip */}
            {(gstInfo?.is_gst_registered || labInfo?.license_no) && (
              <div className="text-center text-[9px] text-gray-500 pt-1 px-6">
                {gstInfo?.is_gst_registered && (
                  <>
                    GSTIN: <strong className="text-gray-900">{gstInfo.gstin}</strong>
                    {gstInfo.legal_business_name && <> · {gstInfo.legal_business_name}</>}
                  </>
                )}
                {gstInfo?.is_gst_registered && labInfo?.license_no && <> &nbsp;|&nbsp; </>}
                {labInfo?.license_no && <>Lic. No: {labInfo.license_no}</>}
              </div>
            )}
          </>
        )}

        {/* ── Patient / sample info block ────────────────────────── */}
        <div className="flex justify-between items-start px-6 py-3 border-b border-gray-200">
          <div className="flex-1">
            <p className="text-[13px] font-bold text-gray-900 mb-0.5">{patient.name}</p>
            <div className="text-[10px] text-gray-600 leading-snug">
              <p>Age: {patient.age} Years</p>
              <p>Sex: {patient.gender}</p>
              <p>PID: {patient.regNo}</p>
            </div>
          </div>

          <div className="w-[62px] h-[62px] border-[1.5px] border-dashed border-gray-300 rounded-md flex items-center justify-center text-[8px] text-gray-400 mx-[18px] shrink-0">
            QR
          </div>

          <div className="flex-1 text-right text-[10px] text-gray-600 leading-snug">
            <p><strong className="text-gray-900 font-semibold">Order No:</strong> {orderId}</p>
            <p><strong className="text-gray-900 font-semibold">Ref. By:</strong> {order?.referredBy || "Self"}</p>
            <p>Registered: {reportDate}</p>
            <p>Reported: {reportDate}</p>
          </div>
        </div>

        {/* ── Tests by category ──────────────────────────────────── */}
        {Object.entries(testsByCategory).map(([category, categoryTests]) => (
          <div key={category}>
            <div className="text-center text-[11.5px] font-extrabold uppercase tracking-[0.04em] text-gray-900 mx-6 mt-2.5 mb-1.5">
              {category.toUpperCase()}
            </div>

            <div className="px-6">
              <table className="w-full border-collapse mb-2">
                <thead>
                  <tr>
                    <th className="text-left text-[9px] font-bold uppercase tracking-[0.03em] text-gray-700 px-1 py-1 border-b-2 border-gray-900 w-[34%]">
                      Investigation
                    </th>
                    <th className="text-left text-[9px] font-bold uppercase tracking-[0.03em] text-gray-700 px-1 py-1 border-b-2 border-gray-900 w-[22%]">
                      Result
                    </th>
                    <th className="text-left text-[9px] font-bold uppercase tracking-[0.03em] text-gray-700 px-1 py-1 border-b-2 border-gray-900 w-[28%]">
                      Reference Value
                    </th>
                    <th className="text-left text-[9px] font-bold uppercase tracking-[0.03em] text-gray-700 px-1 py-1 border-b-2 border-gray-900 w-[16%]">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTests.map((t) => {
                    const flag = flags[t.id];
                    const isAbnormal = ["low", "high", "abnormal"].includes(flag);
                    return (
                      <tr key={t.id} className="break-inside-avoid">
                        <td className="px-1 py-1 text-[10.5px] text-gray-800 border-b border-gray-100">
                          {t.name}
                        </td>
                        <td
                          className={`px-1 py-1 text-[10.5px] font-bold border-b border-gray-100 ${
                            isAbnormal ? "text-amber-600" : "text-gray-900"
                          }`}
                        >
                          {results[t.id] || "—"}
                          {flag === "high" && (
                            <span className="text-[8px] font-bold ml-1">High</span>
                          )}
                          {flag === "low" && (
                            <span className="text-[8px] font-bold ml-1">Low</span>
                          )}
                        </td>
                        <td className="px-1 py-1 text-[10.5px] text-gray-500 border-b border-gray-100">
                          {t.range || "—"}
                        </td>
                        <td className="px-1 py-1 text-[10.5px] text-gray-500 border-b border-gray-100">
                          {t.unit || ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* ── End of report / disclaimer ─────────────────────────── */}
        <div className="text-center text-[9px] text-gray-400 tracking-[0.05em] mx-6 mt-0.5 mb-1">
          **** End of Report ****
        </div>

        <div className="text-center text-[9px] text-gray-500 italic px-6 pb-1.5">
          {labInfo?.footer_note || "Reports are not valid for medico-legal purposes."}
        </div>

        {/* ── Footer meta + band ─────────────────────────────────── */}
        <div className="flex justify-between text-[8.5px] text-gray-400 border-t border-gray-200 px-6 py-1 mt-auto">
          <span>
            Generated on:{" "}
            {new Date().toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span>Page 1 of 1</span>
        </div>

        <div className="bg-teal-600 text-white text-center text-[10px] font-bold tracking-[0.03em] py-1.5">
          {labInfo?.lab_name || "SOUHRUDA MEDICAL CENTRE"}
        </div>
      </div>

      <div className="no-print">
        <FollowUpSuggestions
          tests={testsWithResults}
          flags={flags}
          reportDate={reportDate}
          onSchedule={handleScheduleReminder}
        />
      </div>

      {isBillOpen && (
        <BillModal
          orderId={orderId}
          patient={patient}
          tests={testsWithResults}
          paymentDone={paymentDone}
          onClose={() => setBillOpen(false)}
        />
      )}

      {isWhatsAppOpen && (
        <WhatsAppSentModal patientName={patient.name} onClose={() => setWhatsAppOpen(false)} />
      )}

      <iframe ref={iframeRef} title="report-print" style={{ display: "none" }} />
    </div>
  );
}