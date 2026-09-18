// src/components/LabOrders/TodaysOrders.jsx
import { useState, useEffect, useMemo } from "react";
import LabOrdersTable from "./LabOrdersTable/LabOrdersTable";
import LabOrderCard from "./LabOrdersTable/LabOrderCard";
import { getTodaysOrdersApi } from "../../api/api";
import { mapOrder } from "../../utils/orders";

const PAGE_SIZE = 10;

export default function TodaysOrders() {
  const [search, setSearch] = useState("");
  const [allTodays, setAllTodays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getTodaysOrdersApi()
      .then((res) => {
        // res.data if paginated by Laravel, else res itself if it's a plain array
        const rows = res.data ?? res ?? [];
        if (!cancelled) setAllTodays(rows.map(mapOrder));
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
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTodays;
    return allTodays.filter(
      (o) =>
        o.patient.toLowerCase().includes(q) ||
        o.regNo.toLowerCase().includes(q) ||
        String(o.orderId).toLowerCase().includes(q)
    );
  }, [allTodays, search]);

  const total = filteredOrders.length;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredOrders, page]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lab Orders</h1>
        <p className="text-sm text-gray-500 mt-1">All orders placed today.</p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order, patient, ID..."
          className="w-full max-w-xs rounded-lg border border-gray-200 pl-4 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        {loadError && (
          <p className="text-sm text-red-500 text-center py-2">{loadError}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading orders…</p>
        ) : (
          <>
            <div className="hidden md:block">
              <LabOrdersTable orders={pagedOrders} />
            </div>
            <div className="md:hidden space-y-3">
              {pagedOrders.map((order) => (
                <LabOrderCard key={order.orderId} {...order} />
              ))}
            </div>

            {total === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No orders today.</p>
            )}

            {total > 0 && lastPage > 1 && (
              <div className="flex items-center justify-between !mt-2">
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
    </div>
  );
}