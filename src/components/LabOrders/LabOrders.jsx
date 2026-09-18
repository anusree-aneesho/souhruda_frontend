// src/components/LabOrders/LabOrders.jsx
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LabOrdersHeader from "./LabOrdersHeader";
import LabOrdersFilters from "./LabOrdersFilters";
import LabOrdersTable from "./LabOrdersTable/LabOrdersTable";
import LabOrderCard from "./LabOrdersTable/LabOrderCard";
import Toast from "../common/Toast/Toast";
import { useToast } from "../common/Toast/useToast";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // OrderDetail navigates here with { justDeleted: { orderId, patientName } }
  // right after a successful order deletion — same pattern as the justBooked
  // / justCreated toasts elsewhere. Refetch so the removed order actually
  // disappears from the list, and clear the state afterward.
  useEffect(() => {
    if (location.state?.justDeleted) {
      const { orderId, patientName } = location.state.justDeleted;
      showToast(`Order #${orderId} deleted for ${patientName || "patient"}`);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, showToast]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getOrdersApi({ status: activeTab, q: search, page })
      .then((res) => {
        if (!cancelled) {
          setOrders((res.data || []).map(mapOrder));
          setLastPage(res.last_page ?? 1);
          setTotal(res.total ?? 0);
        }
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
  }, [activeTab, search, page]);

  // Reset to page 1 whenever the filter or search changes.
  useEffect(() => {
    setPage(1);
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

            {filteredOrders.length > 0 && lastPage > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500">
                  Page {page} of {lastPage} · {total} orders
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    disabled={page >= lastPage}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}