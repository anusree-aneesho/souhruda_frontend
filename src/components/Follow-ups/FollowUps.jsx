// src/components/FollowUps/FollowUps.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import FollowUpsHeader from "./FollowUpsHeader";
import FollowUpsTable from "./FollowUpsTable/FollowUpsTable";
import FollowUpDetailModal from "./modals/FollowUpDetailModal";
import { getFollowUpRemindersApi } from "../../api/api";

const PER_PAGE = 9;
const TABS = ["All", "Pending", "Completed"];

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function mapReminder(r) {
  return {
    id: r.id,
    patientNumber: r.patient?.patient_number ?? "-",
    title: r.patient?.title ?? "",
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [followUps, setFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewingId, setViewingId] = useState(null);
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Wait for a short pause in typing before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Back to page 1 whenever the filter or search changes.
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getFollowUpRemindersApi({
      status: activeTab,
      q: debouncedSearch,
      page,
      per_page: PER_PAGE,
    })
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
  }, [activeTab, debouncedSearch, page, refreshKey]);

  return (
    <div className="space-y-6">
      <FollowUpsHeader />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 w-full sm:w-72">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, test, reg no..."
              className="flex-1 text-sm outline-none placeholder:text-gray-400 min-w-0"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-teal-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loadError && (
          <p className="text-sm text-red-500 text-center py-2">{loadError}</p>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading follow-ups…</p>
        ) : (
          <>
            <FollowUpsTable
              followUps={followUps}
              isFiltered={activeTab !== "All" || debouncedSearch !== ""}
              onView={setViewingId}
              onViewPatient={(patientNumber) => navigate(`/follow-ups/patient/${patientNumber}`)}
            />

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