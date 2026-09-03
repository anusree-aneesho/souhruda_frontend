// src/components/LabOrders/Report/ReportHeader.jsx
import { Link } from "react-router-dom";
import { Receipt, MessageCircle, Printer } from "lucide-react";

export default function ReportHeader({ orderId, letterheadOn, onLetterheadToggle, onPrint, onBillClick, onWhatsAppClick }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <Link to={`/lab-orders/${orderId}`} className="text-sm text-teal-600 font-medium hover:underline">
          ← Back to order
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={letterheadOn}
            onChange={(e) => onLetterheadToggle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          Letterhead
        </label>

        <button onClick={onBillClick} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Receipt size={16} />
          Bill
        </button>

        <button onClick={onWhatsAppClick} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <MessageCircle size={16} />
          WhatsApp
        </button>

        <button onClick={onPrint} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700">
          <Printer size={16} />
          Print
        </button>
      </div>
    </div>
  );
}