// src/components/LabOrders/LabOrders.jsx
import { useState, useEffect, useMemo } from "react";
import LabOrdersHeader from "./LabOrdersHeader";
import LabOrdersFilters from "./LabOrdersFilters";
import LabOrdersTable from "./LabOrdersTable/LabOrdersTable";
import LabOrderCard from "./LabOrdersTable/LabOrderCard";
import { getOrdersApi } from "../../api/api";

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function mapOrder(o) {
  return {
    orderId: o.order_no,
    patient: [o.patient?.first_name, o.patient?.last_name].filter(Boolean).join(" "),
    regNo: o.patient?.patient_number || "",
    tests: o.items_count ?? o.items?.length ?? 0,
    status: capitalize(o.status),
    date: o.ordered_at
      ? new Date(o.ordered_at).toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        })
      : "",
    bill: Number(o.bill_total || 0).toFixed(2),
  };
}

export default function LabOrders() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getOrdersApi({ status: activeTab, q: search })
      .then((res) => {
        if (!cancelled) setOrders((res.data || []).map(mapOrder));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, search]);

  const filteredOrders = useMemo(() => orders, [orders]);

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

        {loadError && (
          <p className="text-sm text-red-500 text-center py-2">{loadError}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading orders…</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}