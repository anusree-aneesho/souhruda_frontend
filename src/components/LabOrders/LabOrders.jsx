// src/components/LabOrders/LabOrders.jsx
import { useState, useMemo } from "react";
import LabOrdersHeader from "./LabOrdersHeader";
import LabOrdersFilters from "./LabOrdersFilters";
import LabOrdersTable from "./LabOrdersTable/LabOrdersTable";
import LabOrderCard from "./LabOrdersTable/LabOrderCard";

const allOrders = [
  { orderId: "28342", patient: "Suma Raj", regNo: "20018483", tests: 2, status: "Completed", date: "04 Aug 2026, 9:35 AM", bill: "180.00" },
  { orderId: "28341", patient: "Damodharan", regNo: "20018481", tests: 1, status: "Completed", date: "04 Aug 2026, 9:20 AM", bill: "150.00" },
  { orderId: "28340", patient: "Omana", regNo: "20018480", tests: 1, status: "Completed", date: "04 Aug 2026, 9:05 AM", bill: "150.00" },
  { orderId: "28339", patient: "Damodharan", regNo: "20018481", tests: 3, status: "Pending", date: "04 Aug 2026, 8:52 AM", bill: "200.00" },
  { orderId: "28338", patient: "Karunakaran", regNo: "20018482", tests: 2, status: "Completed", date: "04 Aug 2026, 7:38 AM", bill: "110.00" },
  { orderId: "28337", patient: "Damodharan", regNo: "20018481", tests: 1, status: "Completed", date: "04 Aug 2026, 7:28 AM", bill: "30.00" },
  { orderId: "28336", patient: "Omana", regNo: "20018480", tests: 4, status: "Completed", date: "04 Aug 2026, 7:15 AM", bill: "410.00" },
];

export default function LabOrders() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesTab = activeTab === "All" || order.status === activeTab;
      const matchesSearch =
        order.patient.toLowerCase().includes(search.toLowerCase()) ||
        order.orderId.includes(search) ||
        order.regNo.includes(search);
      return matchesTab && matchesSearch;
    });
  }, [search, activeTab]);

  return (
    <div className="space-y-6">
      <LabOrdersHeader />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <LabOrdersFilters
          search={search}
          onSearchChange={setSearch}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Desktop: table. Mobile: stacked cards */}
        <div className="hidden md:block">
          <LabOrdersTable orders={filteredOrders} />
        </div>
        <div className="md:hidden space-y-3">
          {filteredOrders.map((order) => (
            <LabOrderCard key={order.orderId} {...order} />
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No orders found.</p>
        )}
      </div>
    </div>
  );
}