// src/components/LabOrders/Report/ReportLetterhead.jsx
import { useState, useEffect } from "react";
import { getSettingsApi, getGstSettingsApi } from "../../../api/api";

export default function ReportLetterhead() {
  const [labInfo, setLabInfo] = useState(null);
  const [gstInfo, setGstInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [labRes, gstRes] = await Promise.all([
          getSettingsApi(),
          getGstSettingsApi(),
        ]);
        setLabInfo(labRes.data);
        setGstInfo(gstRes.data);
      } catch (err) {
        console.error("Failed to load letterhead settings:", err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !labInfo) {
    return (
      <div className="text-center border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-xl font-bold text-teal-700">Loading...</h2>
      </div>
    );
  }

  const addressLine = [labInfo.address, labInfo.city, labInfo.state, labInfo.pincode]
    .filter(Boolean)
    .join(", ");
  const contactLine = [labInfo.phone, labInfo.email].filter(Boolean).join(" · ");
  const gstEnabled = gstInfo?.is_gst_registered;

  return (
    <div className="text-center border-b border-gray-200 pb-4 mb-4">
      <h2 className="text-xl font-bold text-teal-700">{labInfo.lab_name}</h2>
      {addressLine && <p className="text-xs text-gray-400 mt-1">{addressLine}</p>}
      {contactLine && <p className="text-xs text-gray-400">{contactLine}</p>}
      {gstEnabled && (
        <p className="text-xs text-gray-500 mt-1">
          GSTIN: <span className="font-medium">{gstInfo.gstin}</span>
          {gstInfo.legal_business_name && (
            <span className="text-gray-400"> ({gstInfo.legal_business_name})</span>
          )}
        </p>
      )}
      {labInfo.license_no && (
        <p className="text-xs text-gray-400">Lic. No: {labInfo.license_no}</p>
      )}
    </div>
  );
}