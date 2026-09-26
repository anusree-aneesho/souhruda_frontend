// src/components/FollowUps/FollowUps.jsx
import { useState, useEffect } from "react";
import FollowUpsHeader from "./FollowUpsHeader";
import FollowUpsTable from "./FollowUpsTable/FollowUpsTable";
import FollowUpDetailModal from "./modals/FollowUpDetailModal";
import { getFollowUpRemindersApi } from "../../api/api";

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function mapReminder(r) {
  return {
    id: r.id,
    patient: [r.patient?.first_name, r.patient?.last_name].filter(Boolean).join(" "),
    test: r.lab_test?.name ?? "-",
    due: r.due_date
      ? new Date(r.due_date).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "-",
    status: capitalize(r.status),
  };
}

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewingId, setViewingId] = useState(null);

  function fetchReminders() {
    setIsLoading(true);
    getFollowUpRemindersApi(page)
      .then((res) => {
        setFollowUps((res.data || []).map(mapReminder));
        setLastPage(res.last_page ?? 1);
        setTotal(res.total ?? 0);
      })
      .catch(() => setFollowUps([]))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchReminders();
  }, [page]);

  return (
    <div className="space-y-6">
      <FollowUpsHeader />

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-6">Loading follow-ups...</p>
      ) : (
        <>
          <FollowUpsTable followUps={followUps} onView={setViewingId} />

          {followUps.length > 0 && lastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {lastPage} · {total} follow-ups
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

      {viewingId && (
        <FollowUpDetailModal
          id={viewingId}
          onClose={() => setViewingId(null)}
          onActionComplete={() => {
            setViewingId(null);
            fetchReminders();
          }}
        />
      )}
    </div>
  );
}