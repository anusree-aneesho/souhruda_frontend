// src/components/HomeCollection/HomeCollection.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import HomeCollectionHeader from "./HomeCollectionHeader";
import HomeCollectionStats from "./HomeCollectionStats";
import HomeCollectionTable from "./HomeCollectionTable/HomeCollectionTable";
import HomeCollectionCard from "./HomeCollectionTable/HomeCollectionCard";
import Pagination from "../common/Pagination";
import Toast from "../common/Toast/Toast";
import { useToast } from "../common/Toast/useToast";
import { getHomeCollectionRequestsApi } from "../../api/api";
import { useHomeCollectionModal } from "../../Context/HomeCollectionModalContext";

// Backend enum -> display label, e.g. "en_route" -> "En Route"
function formatStatus(status) {
  return (status || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Backend payment_mode ("upi"/"cash"/"card") -> display label used by the badge styles
function formatPayment(mode) {
  if (mode === "upi") return "UPI";
  if (mode === "cash") return "Cash";
  if (mode === "card") return "Card";
  return mode;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Local (browser) calendar date as YYYY-MM-DD — matches DashboardStats.jsx's
// todayLocalDate(), avoiding a UTC day-off-by-one near midnight.
function todayLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Backend already returns requests newest-first (`->latest()`), so no
// re-sorting is needed here — just cap and paginate what comes in.
const MAX_DISPLAYED = 50;
const PAGE_SIZE = 8;

function mapRequest(r) {
  return {
    requestId: r.hc_code,
    patient: r.patient?.name || "—",
    tests: r.tests?.length || 0,
    distance: r.distance_km != null ? `${r.distance_km} km` : "—",
    date: formatDate(r.slot_date),
    slotDateRaw: r.slot_date,
    slot: r.slot_label,
    payment: formatPayment(r.payment_mode),
    technician: r.technician?.name || "Unassigned",
    status: formatStatus(r.status),
    // Which stat card this row belongs to, so clicking a card can filter
    // the table by the same grouping the counts already use — null for
    // anything not shown on a card (e.g. cancelled).
    bucket: bucketStatus(r.status),
  };
}

// Same 4 buckets as the stat cards, for the "Showing: X" chip's label.
const FILTER_LABELS = {
  requested: "Requested",
  inProgress: "In Progress",
  reportReady: "Report Ready",
  sentToPatient: "Sent to Patient",
};

// Bucket the raw statuses into the four summary cards
function bucketStatus(status) {
  const inProgressStatuses = ["assigned", "en_route", "collected", "processing"];
  if (status === "requested") return "requested";
  if (inProgressStatuses.includes(status)) return "inProgress";
  if (status === "report_ready") return "reportReady";
  if (status === "sent") return "sentToPatient";
  return null; // cancelled, or anything else — excluded from the stat cards
}

function computeCounts(rows) {
  return rows.reduce(
    (acc, r) => {
      const bucket = bucketStatus(r.status);
      if (bucket) acc[bucket] += 1;
      return acc;
    },
    { requested: 0, inProgress: 0, reportReady: 0, sentToPatient: 0 }
  );
}

export default function HomeCollection() {
  const [rawRequests, setRawRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(null);
  const { toast, showToast, hideToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateFilter, setDateFilter] = useState(
    searchParams.get("filter") === "today" ? "today" : null
  );
  const { activeId } = useHomeCollectionModal();
  const prevActiveIdRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getHomeCollectionRequestsApi();
      setRawRequests(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message || "Couldn't load home collection requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // NewOrderModal navigates back here with { justBooked: created } right
  // after a successful booking (same route, so React Router won't remount
  // this component on its own) — refetch so the new request shows up
  // without the user having to manually reload the page.
  useEffect(() => {
    if (location.state?.justBooked) {
      const { hc_code, patient } = location.state.justBooked;
      load();
      showToast(`${hc_code || "Request"} booked for ${patient?.name || "patient"}`);
      // Clear the state so a later back-navigation or manual refresh to
      // this page doesn't keep re-triggering a refetch on stale state.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, load, showToast]);

  // The detail modal (Assign Technician, Confirm Collected, Mark
  // Processing, Send WhatsApp, etc.) lives globally via
  // HomeCollectionModalContext, not inside this page — so it has no way to
  // tell this list "something changed." Instead, refetch whenever the modal
  // transitions from open to closed, which covers every action inside it
  // in one place rather than wiring a refresh into each button.
  useEffect(() => {
    if (prevActiveIdRef.current && !activeId) {
      load();
    }
    prevActiveIdRef.current = activeId;
  }, [activeId, load]);

  const requests = rawRequests.map(mapRequest);
  const counts = computeCounts(rawRequests);

  const today = todayLocalDate();
  const term = search.trim().toLowerCase();
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !term ||
      [r.requestId, r.patient, r.technician, r.status]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term));
    const matchesStatus = !statusFilter || r.bucket === statusFilter;
    const matchesDate = !dateFilter || r.slotDateRaw === today;
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Clicking an already-active stat card clears the filter back to "All".
  function handleFilterChange(key) {
    setStatusFilter((prev) => (prev === key ? null : key));
    setPage(1);
  }

  function clearDateFilter() {
    setDateFilter(null);
    setPage(1);
    if (searchParams.get("filter")) {
      const next = new URLSearchParams(searchParams);
      next.delete("filter");
      setSearchParams(next, { replace: true });
    }
  }

  // Newest-first, capped to the latest 50, 8 per page.
  const displayedRequests = filteredRequests.slice(0, MAX_DISPLAYED);
  const totalPages = Math.max(1, Math.ceil(displayedRequests.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRequests = displayedRequests.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Any time the search term or date filter changes, start back at page 1 —
  // otherwise a narrower result set can leave the user stranded on a
  // now-empty page.
  useEffect(() => {
    setPage(1);
  }, [search, dateFilter]);

  return (
    <div className="space-y-6">
      <HomeCollectionHeader />
      <HomeCollectionStats counts={counts} activeFilter={statusFilter} onFilterChange={handleFilterChange} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, request ID, technician, or status..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:bg-white transition-colors"
          />
        </div>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter(null)}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium pl-3 pr-2 py-1.5 hover:bg-teal-100"
          >
            Showing: {FILTER_LABELS[statusFilter]}
            <X size={14} />
          </button>
        )}

        {dateFilter && (
          <button
            onClick={clearDateFilter}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium pl-3 pr-2 py-1.5 hover:bg-teal-100"
          >
            Showing: Today
            <X size={14} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        {isLoading && <p className="text-sm text-gray-400">Loading home collection requests…</p>}
        {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}
        {!isLoading && !error && requests.length === 0 && (
          <p className="text-sm text-gray-400">No home collection requests yet.</p>
        )}
        {!isLoading && !error && requests.length > 0 && filteredRequests.length === 0 && (
          <p className="text-sm text-gray-400">
            {term && (statusFilter || dateFilter)
              ? `No requests match "${search}" in this category.`
              : term
              ? `No requests match "${search}".`
              : "No requests in this category."}{" "}
            {statusFilter && (
              <button onClick={() => setStatusFilter(null)} className="text-teal-600 font-medium hover:underline">
                Clear filter
              </button>
            )}
            {dateFilter && (
              <button onClick={clearDateFilter} className="text-teal-600 font-medium hover:underline">
                Clear filter
              </button>
            )}
          </p>
        )}

        {!isLoading && !error && pageRequests.length > 0 && (
          <>
            <div className="hidden md:block">
              <HomeCollectionTable requests={pageRequests} onCancelled={load} />
            </div>
            <div className="md:hidden space-y-3">
              {pageRequests.map((req) => (
                <HomeCollectionCard key={req.requestId} {...req} onCancelled={load} />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <p className="text-xs text-gray-400">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, displayedRequests.length)} of {displayedRequests.length}
              </p>
              <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}