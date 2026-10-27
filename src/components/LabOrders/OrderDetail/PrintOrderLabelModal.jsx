// src/components/LabOrders/OrderDetail/PrintOrderLabelModal.jsx
//
// Sample label for a lab order (walk-in). Same layout as the home collection
// label: barcode text is "<order no>|<register no>", and the QR opens the
// live scan page (/scan/<order no>).
import ModalShell from "../../common/Modal/ModalShell";
import Barcode from "../../common/Barcode";
import QrCode from "../../common/QrCode";
import { orderBarcodeValue } from "../../../utils/sampleBarcode";

export default function PrintOrderLabelModal({ orderNo, barcode, patient, testNames = [], orderedAt, onClose }) {
  const ageGender = [patient?.age && patient.age !== "-" ? `${patient.age}Y` : "", patient?.gender?.[0]?.toUpperCase()]
    .filter(Boolean)
    .join("/");
  const scanUrl = `${window.location.origin}/scan/${encodeURIComponent(orderNo)}`;

  return (
    <ModalShell title={`Sample Label — #${orderNo}`} onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5">
        <div className="print-target">
          <div className="max-w-sm mx-auto border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">Souhruda Lab</p>
              <p className="text-xs text-gray-400">#{orderNo}</p>
            </div>

            <p className="text-sm text-gray-900">
              {patient?.name}
              {ageGender && <span className="text-xs text-gray-500"> · {ageGender}</span>}
            </p>
            {patient?.regNo && <p className="text-xs text-gray-400">Patient ID: {patient.regNo}</p>}
            {orderedAt && <p className="text-xs text-gray-500 mt-1">{orderedAt}</p>}
            {testNames.length > 0 && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{testNames.join(", ")}</p>
            )}

            <div className="mt-2 overflow-hidden [&_svg]:w-full [&_svg]:h-auto">
              <Barcode value={barcode || orderBarcodeValue(orderNo, patient?.regNo)} height={44} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <QrCode value={scanUrl} size={72} className="shrink-0" />
              <p className="text-[10px] text-gray-400 leading-snug">
                Scan QR for patient, test and status details
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700"
          >
            🖨️ Print
          </button>
        </div>
      </div>
    </ModalShell>
  );
}