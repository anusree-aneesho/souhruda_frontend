// src/components/Dashboard/LatestActivities.jsx
import { useEffect, useState } from "react";
import ActivityItem from "./ActivityItem";
import { getActivityLogsApi } from "../../api/api";

// Formats a full ISO timestamp like "2026-09-03T05:24:04+00:00"
// into a short display string like "03 Sep", matching the demo's style.
function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// The backend's subject_type ("order", "patient", "home_collection_request")
// needs to map onto the values ActivityItem's click-handler understands.
function mapSubjectType(subjectType) {
  if (subjectType === "order") return "order";
  if (subjectType === "home_collection_request") return "homeCollection";
  if (subjectType === "patient") return "patient";
  return null;
}

export default function LatestActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const result = await getActivityLogsApi(5);

        const mapped = result.data.map((log) => ({
          date: formatDate(log.created_at),
          text: log.description,
          type: mapSubjectType(log.subject_type),
          targetId: log.subject_id,
        }));

        setActivities(mapped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <h3 className="font-semibold text-sm text-gray-900 mb-2">Latest Activities</h3>

      {loading && <p className="text-xs text-gray-400">Loading...</p>}
      {error && <p className="text-xs text-red-500">Failed to load activities.</p>}

      {!loading && !error && activities.length === 0 && (
        <p className="text-xs text-gray-400">No recent activity.</p>
      )}

      {!loading && !error && activities.length > 0 && (
        <div>
          {activities.map((activity, index) => (
            <ActivityItem key={index} {...activity} isLatest={index === 0} />
          ))}
        </div>
      )}
    </div>
  );
}