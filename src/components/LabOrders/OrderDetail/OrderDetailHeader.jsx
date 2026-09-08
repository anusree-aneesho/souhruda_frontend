// src/components/LabOrders/OrderDetail/OrderDetailHeader.jsx
import { Link } from "react-router-dom";

export default function OrderDetailHeader({ patientName, orderId, regNo, age, gender, orderedAt, onDelete }) {
  return (
    <div>
      <Link to="/lab-orders" className="text-sm text-teal-600 font-medium hover:underline">
        ← Back to orders
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {patientName.toUpperCase()} <span className="text-gray-400 font-medium">#{orderId}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Reg. no. {regNo} · {age} yrs, {gender} · Ordered {orderedAt}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="px-4 py-2.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full sm:w-auto cursor-pointer"
        >
          Delete order
        </button>
      </div>
    </div>
  );
}