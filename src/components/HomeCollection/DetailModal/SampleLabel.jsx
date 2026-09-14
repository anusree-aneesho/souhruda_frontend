// src/components/HomeCollection/DetailModal/SampleLabel.jsx
//
// SCRUM-141 / SCRUM-142: the physical label stuck on the sample tube —
// a real scannable Code128 barcode plus a QR code (encoding the hc_code)
// so lab-processing staff can scan straight to the record instead of
// keying in the hc_code by hand. Follows the same print-target/no-print
// convention as Report.jsx and BillModal.jsx.
import Barcode from "../../common/Barcode";
import QrCode from "../../common/QrCode";

export default function SampleLabel({ hc }) {
  if (!hc) return null;

  return (
    <div className="print-target">
      <div className="max-w-sm mx-auto border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900">Souhruda Lab</p>
          <p className="text-xs text-gray-400">{hc.id}</p>
        </div>

        <p className="text-sm text-gray-900">{hc.patient?.name}</p>
        {hc.patient?.regNo && (
          <p className="text-xs text-gray-400 mb-3">Reg. {hc.patient.regNo}</p>
        )}

        <div className="flex items-center justify-between gap-4 mt-2">
          <Barcode value={hc.sampleBarcode} height={44} />
          <QrCode value={hc.sampleBarcode || hc.id} size={72} />
        </div>
      </div>
    </div>
  );
}