// src/components/LabOrders/Report/ReportLetterhead.jsx
import { useState, useEffect } from "react";
import { getGstSettingsApi } from "../../../api/api";

export default function ReportLetterhead({ labInfo }) {
  const [gstInfo, setGstInfo] = useState(null);

  useEffect(() => {
    getGstSettingsApi()
      .then((res) => setGstInfo(res.data))
      .catch((err) => console.error("Failed to load GST settings:", err.message));
  }, []);

  if (!labInfo) {
    return (
      <div className="text-center border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-xl font-bold text-teal-700">Loading...</h2>
      </div>
    );
  }

  const addressLine = [labInfo.address, labInfo.city, labInfo.state, labInfo.pincode]
    .filter(Boolean)
    .join(", ");
  const contactLine = [labInfo.phone, labInfo.email].filter(Boolean).join("  ·  ");
  const gstEnabled = gstInfo?.is_gst_registered;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-2 py-3">
        <div className="flex items-center">
          {labInfo.logo_path && (
            <img
              src={labInfo.logo_path}
              alt="Logo"
              className="w-11 h-11 object-contain mr-3"
            />
          )}
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
              {labInfo.lab_name}
            </h2>
            <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">
              Accurate · Caring · Instant
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] text-gray-600 leading-relaxed">
          {labInfo.phone && <div>☎ {labInfo.phone}</div>}
          {labInfo.email && <div>✉ {labInfo.email}</div>}
        </div>
      </div>

      {addressLine && (
        <div className="bg-gray-900 text-gray-200 text-center text-[9px] tracking-wide py-1">
          {addressLine}
        </div>
      )}

      <div
        className="h-[5px]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #0d9488 0%, #0d9488 60%, #111827 60%, #111827 100%)",
        }}
      />

      {(gstEnabled || labInfo.license_no) && (
        <div className="text-center text-[9.5px] text-gray-500 pt-1">
          {gstEnabled && (
            <>
              GSTIN: <span className="font-semibold text-gray-800">{gstInfo.gstin}</span>
              {gstInfo.legal_business_name && <span> · {gstInfo.legal_business_name}</span>}
            </>
          )}
          {labInfo.license_no && (
            <>
              {gstEnabled && <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>}
              Lic. No: {labInfo.license_no}
            </>
          )}
        </div>
      )}
    </div>
  );
}