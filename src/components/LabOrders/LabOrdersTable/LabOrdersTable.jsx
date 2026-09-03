// src/components/LabOrders/LabOrdersTable/LabOrdersTable.jsx
import LabOrderRow from "./LabOrderRow";

export default function LabOrdersTable({ orders }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">ORDER ID</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PATIENT</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">REG. NO</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TESTS</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">STATUS</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">DATE</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">BILL</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <LabOrderRow key={order.orderId} {...order} />
          ))}
        </tbody>
      </table>
    </div>
  );
}