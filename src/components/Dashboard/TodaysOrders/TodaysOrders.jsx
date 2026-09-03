// src/components/Dashboard/TodaysOrders/TodaysOrders.jsx
import { Link } from "react-router-dom";
import OrdersTableRow from "./OrdersTableRow";

const orders = [
  { order: "28342", patient: "Suma Raj", tests: 2, status: "Completed", time: "9:35 AM" },
  { order: "28341", patient: "Damodharan", tests: 1, status: "Completed", time: "9:20 AM" },
  { order: "28340", patient: "Omana", tests: 1, status: "Completed", time: "9:05 AM" },
  { order: "28339", patient: "Damodharan", tests: 3, status: "Pending", time: "8:52 AM" },
  { order: "28338", patient: "Karunakaran", tests: 2, status: "Completed", time: "7:38 AM" },
  { order: "28337", patient: "Damodharan", tests: 1, status: "Completed", time: "7:28 AM" },
  { order: "28336", patient: "Omana", tests: 4, status: "Completed", time: "7:15 AM" },
];

export default function TodaysOrders() {
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