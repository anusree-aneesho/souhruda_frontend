// src/components/HomeCollection/DetailModal/RequestInfoBar.jsx
import Barcode from "../../common/Barcode";

function Field({ label, children, full }) {
  return (
    <div className={`min-w-0 ${full ? "col-span-2" : ""}`}>
      <p className="text-[10px] text-gray-400 tracking-wide uppercase">{label}</p>
      <div className="text-sm font-semibold text-gray-900 break-words">{children}</div>
    </div>
  );
}

export default function RequestInfoBar({ hc }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-gray-50 rounded-lg p-4">
      <Field label="Patient" full>{hc.patient.name}</Field>
      <Field label="Referred by">{hc.referredBy}</Field>
      <Field label="Payment">{hc.payment || "—"}</Field>
      <Field label="Slot" full>{hc.slot}</Field>
      <Field label="Distance">{hc.distance}</Field>
      <Field label="Collection charge">₹{Number(hc.collectionCharge || 0).toFixed(2)}</Field>
      <Field label="Address" full>{hc.address}</Field>
      <div className="col-span-2 min-w-0">
        <p className="text-[10px] text-gray-400 tracking-wide uppercase mb-1">Sample barcode</p>
        <div className="overflow-hidden [&_svg]:max-w-full [&_svg]:h-auto [&_img]:max-w-full [&_img]:h-auto [&_canvas]:max-w-full [&_canvas]:h-auto">
          <Barcode value={hc.sampleBarcode} height={32} fontSize={10} />
        </div>
      </div>
    </div>
  );
}