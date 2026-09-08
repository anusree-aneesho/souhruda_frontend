// src/components/HomeCollection/HomeCollection.jsx
import { useEffect, useState } from "react";
import HomeCollectionHeader from "./HomeCollectionHeader";
import HomeCollectionStats from "./HomeCollectionStats";
import HomeCollectionTable from "./HomeCollectionTable/HomeCollectionTable";
import HomeCollectionCard from "./HomeCollectionTable/HomeCollectionCard";
import { getHomeCollectionRequestsApi } from "../../api/api";

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

function mapRequest(r) {
  return {
    requestId: r.hc_code,
    patient: r.patient?.name || "—",
    tests: r.tests?.length || 0,
    distance: r.distance_km != null ? `${r.distance_km} km` : "—",
    date: formatDate(r.slot_date),
    slot: r.slot_label,
    payment: formatPayment(r.payment_mode),
    technician: r.technician?.name || "Unassigned",
    status: formatStatus(r.status),
  };
}

// Bucket the raw statuses into the four summary cards
function computeCounts(rows) {
  const inProgressStatuses = ["assigned", "en_route", "collected", "processing"];
  return rows.reduce(
    (acc, r) => {
      if (r.status === "requested") acc.requested += 1;
      else if (inProgressStatuses.includes(r.status)) acc.inProgress += 1;
      else if (r.status === "report_ready") acc.reportReady += 1;
      else if (r.status === "sent") acc.sentToPatient += 1;
      return acc;
    },
    { requested: 0, inProgress: 0, reportReady: 0, sentToPatient: 0 }
  );
}

export default function HomeCollection() {
  const [rawRequests, setRawRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getHomeCollectionRequestsApi();
        if (!cancelled) setRawRequests(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Couldn't load home collection requests.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const requests = rawRequests.map(mapRequest);
  const counts = computeCounts(rawRequests);

  return (
    <div className="space-y-6">
      <HomeCollectionHeader />
      <HomeCollectionStats counts={counts} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        {isLoading && <p className="text-sm text-gray-400">Loading home collection requests…</p>}
        {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}
        {!isLoading && !error && requests.length === 0 && (
          <p className="text-sm text-gray-400">No home collection requests yet.</p>
        )}

        {!isLoading && !error && requests.length > 0 && (
          <>
            <div className="hidden md:block">
              <HomeCollectionTable requests={requests} />
            </div>
            <div className="md:hidden space-y-3">
              {requests.map((req) => (
                <HomeCollectionCard key={req.requestId} {...req} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}