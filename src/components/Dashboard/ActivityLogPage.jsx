// src/components/Dashboard/ActivityLogPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActivityLogsApi } from "../../api/api";

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
        setLogs(result.data);
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
          className="text-xs text-gray-500 hover:underline"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {loading && <p className="text-sm text-gray-400 p-5">Loading...</p>}
        {error && <p className="text-sm text-red-500 p-5">Failed to load activity log.</p>}
        {!loading && !error && logs.length === 0 && (
          <p className="text-sm text-gray-400 p-5">No activity found.</p>
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-4">
                <span className="text-xs text-gray-400 w-40 shrink-0 mt-0.5">
                  {formatDateTime(log.created_at)}
                </span>
                <span className="text-gray-300 mt-0.5">→</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{log.description}</p>
                  {log.user_name && (
                    <p className="text-xs text-gray-400 mt-0.5">by {log.user_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}