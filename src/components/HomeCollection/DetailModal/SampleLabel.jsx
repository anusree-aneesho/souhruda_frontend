// src/components/HomeCollection/DetailModal/SampleLabel.jsx
//
// SCRUM-141 / SCRUM-142: the physical label stuck on the sample tube.
//
//  • Barcode (Code128) -> the request code + register number (HC1037|20010003). Scan it into the
//    "Sample scan" page box with a normal barcode scanner.
//  • QR code -> the details as plain text (patient, register no, tests, slot,
//    technician, status) plus a link to /scan/<code> for the live status.
import Barcode from "../../common/Barcode";
import QrCode from "../../common/QrCode";
import { barcodeValue } from "../../../utils/sampleBarcode";
import { buildQrText } from "../../../utils/qrDetails";

function formatAgeGender(patient) {
  const age =
    patient?.age != null && patient.age !== ""
      ? /^\d+$/.test(String(patient.age))
        ? `${patient.age}Y`
        : String(patient.age)
      : "";
  const g = patient?.gender ? String(patient.gender).charAt(0).toUpperCase() : "";
  return [age, g].filter(Boolean).join("/");
}

export default function SampleLabel({ hc }) {
  if (!hc) return null;

  const ageGender = formatAgeGender(hc.patient);
  const testNames = (hc.tests || []).map((t) => t.name).filter(Boolean);
  const scanUrl = `${window.location.origin}/scan/${encodeURIComponent(hc.id)}`;
  // QR shows the details as plain text when scanned (link to live status last)
  const qrText = buildQrText({
    code: barcodeValue(hc),
    patient: hc.patient,
    testNames,
    when: hc.slot ? `Slot: ${hc.slot}` : "",
    staff: hc.technician?.name,
    status: hc.status,
    url: scanUrl,
  });

  return (
    <div className="print-target">
      <div className="max-w-sm mx-auto border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900">Souhruda Lab</p>
          <p className="text-xs text-gray-400">{hc.id}</p>
        </div>

        <p className="text-sm text-gray-900">
          {hc.patient?.name}
          {ageGender && <span className="text-xs text-gray-500"> · {ageGender}</span>}
        </p>
        {hc.patient?.regNo && <p className="text-xs text-gray-400">Patient ID: {hc.patient.regNo}</p>}
        {hc.slot && <p className="text-xs text-gray-500 mt-1">{hc.slot}</p>}
        {testNames.length > 0 && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{testNames.join(", ")}</p>
        )}

        <div className="mt-2 overflow-hidden [&_svg]:w-full [&_svg]:h-auto">
          <Barcode value={barcodeValue(hc)} height={44} />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <QrCode value={qrText} size={72} className="shrink-0" />
          <p className="text-[10px] text-gray-400 leading-snug">
            Scan QR for patient, test and status details
          </p>
        </div>
      </div>
    </div>
  );
}