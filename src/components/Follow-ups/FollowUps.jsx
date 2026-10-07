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
    patientNumber: r.patient?.patient_number ?? "-",
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
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewingId, setViewingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getFollowUpRemindersApi(page)
      .then((res) => {
        if (cancelled) return;
        const last = res.last_page ?? res.meta?.last_page ?? 1;
        setFollowUps((res.data || []).map(mapReminder));
        setLastPage(last);
        setTotal(res.total ?? res.meta?.total ?? 0);

        // If the last item on the final page was just actioned, the page
        // no longer exists, so step back instead of showing an empty list.
        if (page > last) setPage(Math.max(1, last));
      })
      .catch((err) => {
        if (!cancelled) {
          setFollowUps([]);
          setLoadError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  return (
    <div className="space-y-6">
      <FollowUpsHeader />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        {loadError && (
          <p className="text-sm text-red-500 text-center py-2">{loadError}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading follow-ups…</p>
        ) : (
          <>
            <FollowUpsTable followUps={followUps} onView={setViewingId} />

            {followUps.length > 0 && lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-2 !mt-1">
                <p className="text-xs text-gray-500">
                  Page {page} of {lastPage} · {total} follow-ups
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    disabled={page >= lastPage}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {viewingId && (
        <FollowUpDetailModal
          id={viewingId}
          onClose={() => setViewingId(null)}
          onActionComplete={() => {
            setViewingId(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}