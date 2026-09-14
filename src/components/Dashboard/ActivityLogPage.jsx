// src/components/Dashboard/ActivityLogPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActivityItem from "./ActivityItem";
import { getActivityLogsApi } from "../../api/api";

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// Same mapping used in LatestActivities.jsx — keep these in sync.
// The backend's subject_type ("order", "patient", "home_collection_request")
// needs to map onto the values ActivityItem's click-handler understands.
function mapSubjectType(subjectType) {
  if (subjectType === "order") return "order";
  if (subjectType === "home_collection_request") return "homeCollection";
  if (subjectType === "patient") return "patient";
  return null;
}

export default function ActivityLogPage() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const result = await getActivityLogsApi(20, page);

        const mapped = result.data.map((log) => ({
          id: log.id,
          date: formatDate(log.created_at),
          text: log.description,
          userName: log.user_name,
          type: mapSubjectType(log.subject_type),
          // subject_reference is the human-facing key (order_no, hc_code)
          // that routes actually use — subject_id is just the internal
          // database id and doesn't match any route parameter.
          targetId: log.subject_reference ?? log.subject_id,
        }));

        setLogs(mapped);
        setMeta(result.meta);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [page]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Activity Log</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-gray-500 hover:underline cursor-pointer"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-1">
        {loading && <p className="text-sm text-gray-400 p-5">Loading...</p>}
        {error && <p className="text-sm text-red-500 p-5">Failed to load activity log.</p>}
        {!loading && !error && logs.length === 0 && (
          <p className="text-sm text-gray-400 p-5">No activity found.</p>
        )}

        {!loading && !error && logs.length > 0 && (
          <div>
            {logs.map((log) => (
              <ActivityItem
                key={log.id}
                date={log.date}
                text={log.text}
                type={log.type}
                targetId={log.targetId}
                isLatest={false}
              />
            ))}
          </div>
        )}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}