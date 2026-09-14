// src/components/HomeCollection/DetailModal/PrintLabelModal.jsx
import ModalShell from "../../common/Modal/ModalShell";
import SampleLabel from "./SampleLabel";

export default function PrintLabelModal({ hc, onClose }) {
  function handlePrint() {
    window.print();
  }

  return (
    <ModalShell title={`Sample Label — ${hc.id}`} onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5">
        <SampleLabel hc={hc} />

        <div className="flex justify-end gap-3 mt-5 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700"
          >
            🖨️ Print
          </button>
        </div>
      </div>
    </ModalShell>
  );
}