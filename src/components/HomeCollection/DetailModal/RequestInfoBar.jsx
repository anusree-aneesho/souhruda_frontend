// src/components/HomeCollection/DetailModal/RequestInfoBar.jsx
export default function RequestInfoBar({ hc }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
      <div>
        <p className="text-xs text-gray-400 tracking-wide">PATIENT</p>
        <p className="text-sm font-semibold text-gray-900">{hc.patient.name}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 tracking-wide">SLOT</p>
        <p className="text-sm font-semibold text-gray-900">{hc.slot}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 tracking-wide">DISTANCE</p>
        <p className="text-sm font-semibold text-gray-900">{hc.distance}</p>
      </div>
      <div className="sm:col-span-3">
        <p className="text-xs text-gray-400 tracking-wide">ADDRESS</p>
        <p className="text-sm font-semibold text-gray-900">{hc.address}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 tracking-wide">PAYMENT</p>
        <p className="text-sm font-semibold text-gray-900">{hc.payment}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 tracking-wide">COLLECTION CHARGE</p>
        <p className="text-sm font-semibold text-gray-900">₹{hc.collectionCharge.toFixed(2)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 tracking-wide">SAMPLE BARCODE</p>
        <p className="text-sm font-semibold text-gray-900">{hc.sampleBarcode || "Generated on assignment"}</p>
      </div>
    </div>
  );
}