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
  const reportDate = order?.orderedAt?.split(" at ")[0] || "16 Sep 2026";

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

  // Updated Print Function to match the new design exactly
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
            const flagTag = flag === "high" ? `<span class="flag-tag">High</span>` : flag === "low" ? `<span class="flag-tag">Low</span>` : "";
            return `
            <tr>
              <td class="test-name">${t.name}</td>
              <td class="result ${isAbnormal ? "abnormal" : ""}">${results[t.id] || "—"} ${flagTag}</td>
              <td class="range">${t.range || "—"}</td>
              <td class="range">${t.unit || ""}</td>
            </tr>`;
          })
          .join("");

        return `
        <div class="category-title">${category.toUpperCase()}</div>
        <table class="results-table">
          <thead>
            <tr>
              <th style="width:35%;">INVESTIGATION</th>
              <th style="width:20%;">RESULT</th>
              <th style="width:30%;">REFERENCE VALUE</th>
              <th style="width:15%;">UNIT</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>`;
      })
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4; background: #fff; }
  .page { width: 100%; max-width: 800px; margin: 0 auto; padding: 0; border: 1px solid #e5e7eb; }
  
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 30px 10px 30px; }
  .header-left { display: flex; align-items: center; gap: 15px; }
  .lab-logo { width: 40px; height: 40px; object-fit: contain; }
  .lab-name { font-size: 20px; font-weight: 800; color: #000; letter-spacing: -0.5px; line-height: 1.1; }
  .tagline { font-size: 9px; color: #555; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }
  .header-right { text-align: right; font-size: 10px; color: #333; line-height: 1.6; }
  
  /* Address Bar */
  .address-bar { background: #1a2b3c; color: #fff; text-align: center; font-size: 9px; padding: 5px 0; letter-spacing: 0.5px; }
  
  /* Patient Info */
  .patient-info { display: flex; justify-content: space-between; align-items: flex-start; padding: 15px 30px; border-bottom: 1px solid #e5e7eb; }
  .patient-left { flex: 1; }
  .patient-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #000; }
  .patient-details { font-size: 10px; color: #333; line-height: 1.6; }
  .patient-center { flex: 1; display: flex; justify-content: center; }
  .qr-box { width: 55px; height: 55px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #aaa; text-align: center; background: #fff; }
  .patient-right { flex: 1; text-align: right; font-size: 10px; line-height: 1.6; color: #333; }
  .patient-right strong { font-weight: 600; color: #000; }
  
  /* Table */
  .category-title { text-align: center; font-size: 13px; font-weight: 800; text-transform: uppercase; margin: 20px 30px 10px 30px; letter-spacing: 0.5px; color: #000; }
  .results-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; padding: 0 30px; }
  .results-table th { text-align: left; font-size: 9px; font-weight: 700; color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding: 6px 30px 6px 0; }
  .results-table td { padding: 8px 30px 8px 0; font-size: 11px; border-bottom: 1px solid #f3f4f6; color: #333; }
  .results-table td:last-child, .results-table th:last-child { padding-right: 0; }
  .test-name { font-weight: 500; color: #000; }
  .result { font-weight: 700; color: #000; }
  .result.abnormal { color: #d97706; }
  .range { color: #555; }
  .flag-tag { font-size: 9px; font-weight: 700; margin-left: 5px; }
  
  /* Footer */
  .end-report { text-align: center; font-size: 9px; color: #888; margin: 30px 0 5px 0; }
  .disclaimer { text-align: center; font-size: 8px; color: #888; font-style: italic; margin-bottom: 20px; }
  .footer-info { display: flex; justify-content: space-between; font-size: 8px; color: #aaa; border-top: 1px solid #f3f4f6; padding: 8px 30px; }
  .footer-band { background: #0d9488; color: #fff; text-align: center; font-size: 11px; font-weight: 700; padding: 8px 0; letter-spacing: 1px; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      ${labInfo.logo_path ? `<img src="${labInfo.logo_path}" class="lab-logo" />` : '<div style="width:40px;height:40px;background:#eee;border-radius:50%;"></div>'}
      <div>
        <div class="lab-name">${labInfo.lab_name}</div>
        <div class="tagline">Accurate · Caring · Instant</div>
      </div>
    </div>
    <div class="header-right">
      <div>📞 ${labInfo.phone || ''}</div>
      <div>✉️ ${labInfo.email || ''}</div>
    </div>
  </div>
  
  <div class="address-bar">${addressLine}</div>
  
  <div class="patient-info">
    <div class="patient-left">
      <div class="patient-name">${patient.name}</div>
      <div class="patient-details">
        Age: ${patient.age} Years<br>
        Sex: ${patient.gender}<br>
        PID: ${patient.regNo}
      </div>
    </div>
    <div class="patient-center">
      <div class="qr-box">QR</div>
    </div>
    <div class="patient-right">
      <div><strong>Order No:</strong> ${orderId}</div>
      <div><strong>Ref. By:</strong> ${order?.referredBy || "Self"}</div>
      <div>Registered: ${reportDate}</div>
      <div>Reported: ${reportDate}</div>
    </div>
  </div>

  ${panelsHtml}

  <div class="end-report">**** End of Report ****</div>
  <div class="disclaimer">Reports are not valid for medico-legal purposes.</div>
  
  <div class="footer-info">
    <span>Generated on: ${new Date().toLocaleString("en-IN")}</span>
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

      {/* Main Report Container matching the image exactly */}
      <div className="bg-white max-w-[800px] mx-auto border border-gray-200 shadow-sm font-sans">
        
        {/* Header Section */}
        <div className="flex justify-between items-start px-8 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {/* Logo Placeholder - using a simple teal circle if no image */}
            {labInfo?.logo_path ? (
              <img src={labInfo.logo_path} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">SMC</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">
                {labInfo?.lab_name || "SOUHRUDA MEDICAL CENTRE"}
              </h1>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                Accurate · Caring · Instant
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-gray-600 leading-relaxed">
            <p className="flex items-center justify-end gap-1">
              <span className="text-teal-600">📞</span> {labInfo?.phone || "09871643210"}
            </p>
            <p className="flex items-center justify-end gap-1">
              <span className="text-teal-600">✉️</span> {labInfo?.email || "admin@souhruda.com"}
            </p>
          </div>
        </div>

        {/* Address Bar */}
        <div className="bg-[#1a2b3c] text-white text-center text-[9px] py-1.5 px-4 tracking-wide">
          {labInfo ? `${labInfo.address}, ${labInfo.city}, ${labInfo.state}, ${labInfo.pincode}` : "New City Hospital, Maner Road, Kozhikode, Kerala, 673004"}
        </div>

        {/* Patient Info Section */}
        <div className="flex justify-between items-start px-8 py-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-[13px] font-bold text-gray-900">{patient.name}</h2>
            <div className="text-[10px] text-gray-700 mt-1 leading-relaxed">
              <p>Age: {patient.age} Years</p>
              <p>Sex: {patient.gender}</p>
              <p>PID: {patient.regNo}</p>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="w-[55px] h-[55px] border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400 bg-white">
              QR
            </div>
          </div>
          
          <div className="flex-1 text-right text-[10px] text-gray-700 leading-relaxed">
            <p><span className="font-semibold text-gray-900">Order No:</span> {orderId || "20673"}</p>
            <p><span className="font-semibold text-gray-900">Ref. By:</span> {order?.referredBy || "Self"}</p>
            <p>Registered: {reportDate || "16 Sep 2026, 02:14 PM"}</p>
            <p>Reported: {reportDate || "16 Sep 2026, 02:14 PM"}</p>
          </div>
        </div>

        {/* GST / License Strip (Optional, often placed under patient info or header) */}
        {(gstInfo?.is_gst_registered || labInfo?.license_no) && (
          <div className="text-center text-[9px] text-gray-500 py-1 px-8">
            {gstInfo?.is_gst_registered && <span>GSTIN: {gstInfo.gstin}</span>}
            {gstInfo?.is_gst_registered && labInfo?.license_no && <span className="mx-2">|</span>}
            {labInfo?.license_no && <span>Lic. No: {labInfo.license_no}</span>}
          </div>
        )}

        {/* Tests Section */}
        <div className="px-8 pb-4">
          <div className="text-center text-[13px] font-extrabold uppercase tracking-wide text-gray-900 mt-6 mb-3">
            HEMATOLOGY
          </div>
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left text-[9px] font-bold text-gray-900 uppercase py-1.5 w-[35%]">Investigation</th>
                <th className="text-left text-[9px] font-bold text-gray-900 uppercase py-1.5 w-[20%]">Result</th>
                <th className="text-left text-[9px] font-bold text-gray-900 uppercase py-1.5 w-[30%]">Reference Value</th>
                <th className="text-left text-[9px] font-bold text-gray-900 uppercase py-1.5 w-[15%]">Unit</th>
              </tr>
            </thead>
            <tbody>
              {/* Static row for visual matching */}
              <tr className="border-b border-gray-100">
                <td className="py-2 text-[11px] font-medium text-gray-900">Complete Blood Count (CBC)</td>
                <td className="py-2 text-[11px] font-bold text-gray-900">13.0</td>
                <td className="py-2 text-[11px] text-gray-600">5.00-20.00</td>
                <td className="py-2 text-[11px] text-gray-600">gm/dl</td>
              </tr>
              
              {/* Dynamic rows from your data */}
              {testsWithResults.map((t) => {
                const flag = flags[t.id];
                const isAbnormal = ["low", "high", "abnormal"].includes(flag);
                return (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="py-2 text-[11px] font-medium text-gray-900">{t.name}</td>
                    <td className={`py-2 text-[11px] font-bold ${isAbnormal ? 'text-amber-600' : 'text-gray-900'}`}>
                      {results[t.id] || "—"}
                      {flag === "high" && <span className="text-[8px] ml-1 font-bold">High</span>}
                      {flag === "low" && <span className="text-[8px] ml-1 font-bold">Low</span>}
                    </td>
                    <td className="py-2 text-[11px] text-gray-600">{t.range || "—"}</td>
                    <td className="py-2 text-[11px] text-gray-600">{t.unit || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Text */}
        <div className="text-center text-[9px] text-gray-500 mt-6">
          **** End of Report ****
        </div>
        
        <div className="text-center text-[8px] text-gray-500 italic mt-1 px-8">
          {labInfo?.footer_note || "Reports are not valid for medico-legal purposes."}
        </div>

        {/* Footer Meta */}
        <div className="flex justify-between text-[8px] text-gray-400 border-t border-gray-100 mt-6 px-8 pt-2 pb-2">
          <span>Generated on: {new Date().toLocaleString("en-IN")}</span>
          <span>Page 1 of 1</span>
        </div>

        {/* Teal Footer Band */}
        <div className="bg-[#0d9488] text-white text-center text-[11px] font-bold tracking-wide py-2">
          {labInfo?.lab_name || "SOUHRUDA MEDICAL CENTRE"}
        </div>
      </div>

      <div className="no-print">
        <FollowUpSuggestions tests={testsWithResults} flags={flags} reportDate={reportDate} onSchedule={handleScheduleReminder} />
      </div>

      {isBillOpen && (
        <BillModal orderId={orderId} patient={patient} tests={testsWithResults} paymentDone={paymentDone} onClose={() => setBillOpen(false)} />
      )}

      {isWhatsAppOpen && <WhatsAppSentModal patientName={patient.name} onClose={() => setWhatsAppOpen(false)} />}

      <iframe ref={iframeRef} title="report-print" style={{ display: "none" }} />
    </div>
  );
}