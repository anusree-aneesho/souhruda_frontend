// src/components/LabOrders/Report/BillModal.jsx
import { useState, useEffect } from "react";
import { CheckCircle2, Download } from "lucide-react";
import ModalShell from "../../common/Modal/ModalShell";
import { getOrderBillUrlApi, getSettingsApi, getGstSettingsApi } from "../../../api/api";

export default function BillModal({ orderId, patient, tests, paymentDone, onClose }) {
  const subtotal = tests.reduce((sum, t) => sum + t.price, 0);

  const [labInfo, setLabInfo] = useState(null);
  const [gstInfo, setGstInfo] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [downloadingBill, setDownloadingBill] = useState(false);
  const [downloadError, setDownloadError] = useState("");

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

  const invoiceNumber = gstEnabled && gstInfo?.invoice_prefix
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

  return (
    <ModalShell title={`Bill — Order ${invoiceNumber}`} onClose={onClose} maxWidth="max-w-md">
      <div className="print-target">
        <div className="px-6 py-5">
          {/* Lab identity header — pulled from Lab Settings + GST Settings */}
          {!loadingSettings && labInfo && (
            <div className="border-b border-gray-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-900">{labInfo.lab_name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {[labInfo.address, labInfo.city, labInfo.state, labInfo.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-xs text-gray-500">
                {[labInfo.phone, labInfo.email].filter(Boolean).join(" · ")}
              </p>
              {gstEnabled && (
                <p className="text-xs text-gray-500 mt-1">
                  GSTIN: <span className="font-medium text-gray-700">{gstInfo.gstin}</span>
                  {gstInfo.legal_business_name && (
                    <span className="ml-2 text-gray-400">({gstInfo.legal_business_name})</span>
                  )}
                </p>
              )}
              {labInfo.license_no && (
                <p className="text-xs text-gray-400 mt-0.5">Lic. No: {labInfo.license_no}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Billed to <span className="font-semibold text-gray-900">{patient.name}</span>
            </p>
            {paymentDone && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full no-print">
                <CheckCircle2 size={13} />
                Paid
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
            <span className="text-xs font-medium text-gray-400 tracking-wide">ITEM</span>
            <span className="text-xs font-medium text-gray-400 tracking-wide">AMOUNT</span>
          </div>
          {tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-900">{test.name}</span>
              <span className="text-sm text-gray-700">₹{test.price.toFixed(2)}</span>
            </div>
          ))}

          {/* Subtotal + GST breakdown — only shown when GST-registered */}
          {gstEnabled && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>GST ({gstRate}%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div
            className={`flex items-center justify-between rounded-lg px-4 py-3 mt-3 ${
              paymentDone ? "bg-green-50" : "bg-teal-50"
            }`}
          >
            <span className={`text-sm font-medium ${paymentDone ? "text-green-700" : "text-teal-700"}`}>
              {paymentDone ? "Paid" : "Total payable"}
            </span>
            <span className={`text-lg font-bold ${paymentDone ? "text-green-700" : "text-teal-700"}`}>
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          {labInfo?.footer_note && (
            <p className="text-xs text-gray-400 text-center mt-4">{labInfo.footer_note}</p>
          )}
        </div>
      </div>

      {downloadError && (
        <p className="text-sm text-red-600 mt-3 px-6 no-print">{downloadError}</p>
      )}

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 no-print">
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
          Close
        </button>
        <button onClick={() => window.print()} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
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
    </ModalShell>
  );
}