// src/components/LabOrders/OrderDetail/OrderDetailHeader.jsx
import { Link } from "react-router-dom";
import Barcode from "../../common/Barcode";
import { orderBarcodeValue } from "../../../utils/sampleBarcode";

export default function OrderDetailHeader({
  patientName,
  orderId,
  regNo,
  age,
  gender,
  orderedAt,
  onDelete,
  isHomeCollection = false,
  canCancel = true,
  barcode,
  onPrintLabel,
}) {
  return (
    <div>
      <Link to="/lab-orders" className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
        ← Back to orders
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {patientName.toUpperCase()} <span className="text-gray-400 font-medium">#{orderId}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Reg. no. {regNo} · {age} yrs, {gender} · Ordered {orderedAt}
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4 shrink-0">
          {/* Sample barcode card: order no + patient register number */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 pt-3 pb-2 w-full sm:w-auto sm:max-w-[260px]">
            <div className="overflow-hidden [&_svg]:max-w-full [&_svg]:h-auto">
              <Barcode value={barcode || orderBarcodeValue(orderId, regNo)} height={36} fontSize={10} />
            </div>
            {onPrintLabel && (
              <button
                onClick={onPrintLabel}
                className="mt-1 w-full text-center text-xs font-medium text-teal-600 hover:underline cursor-pointer"
              >
                🖨️ Print sample label
              </button>
            )}
          </div>

          {!isHomeCollection && canCancel && (
            <button
              onClick={onDelete}
              className="px-4 py-2.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full sm:w-auto cursor-pointer"
            >
              Cancel order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}