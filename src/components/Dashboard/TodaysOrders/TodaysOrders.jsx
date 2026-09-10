// src/components/Dashboard/TodaysOrders/TodaysOrders.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import OrdersTableRow from "./OrdersTableRow";
import { getTodaysOrdersApi } from "../../../api/api";

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function mapOrder(o) {
  return {
    order: o.order_no,
    patient: [o.patient?.first_name, o.patient?.last_name].filter(Boolean).join(" "),
    tests: o.items_count ?? o.items?.length ?? 0,
    status: capitalize(o.status),
    time: o.ordered_at
      ? new Date(o.ordered_at).toLocaleTimeString("en-US", {
          hour: "numeric", minute: "2-digit",
        })
      : "",
  };
}

export default function TodaysOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getTodaysOrdersApi()
      .then((res) => {
        if (!cancelled) setOrders((res.data || []).map(mapOrder));
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || orders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-900">Today's Orders</h3>
        <Link to="/lab-orders" className="text-sm text-teal-600 font-medium hover:underline">
          View all orders →
        </Link>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">ORDER</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PATIENT</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TESTS</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">STATUS</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TIME</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <OrdersTableRow key={o.order} {...o} />
          ))}
        </tbody>
      </table>
    </div>
  );
}