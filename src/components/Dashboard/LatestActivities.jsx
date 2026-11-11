// src/components/Dashboard/LatestActivities.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  if (subjectType === "follow_up_reminder") return "followUp"; // CHANGED
  return null;
}

// Old follow-up logs have no subject, so no order number of their own. Borrow it
// from the closest log in the list that mentions the same patient and has "Order #123".
// Only used for old entries; new ones get the order number from the backend.
function findNearbyOrderNo(logs, index) {
  const patientName = /scheduled for (.+?)\s+[—–-]\s/i.exec(
    logs[index].description || ""
  )?.[1];
  if (!patientName) return null;

  let found = null;
  let bestDistance = Infinity;
  logs.forEach((other, i) => {
    if (i === index) return;
    const text = other.description || "";
    const orderNo = /order\s*#(\d+)/i.exec(text)?.[1];
    if (orderNo && text.includes(patientName) && Math.abs(i - index) < bestDistance) {
      found = orderNo;
      bestDistance = Math.abs(i - index);
    }
  });
  return found;
}

export default function LatestActivities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const result = await getActivityLogsApi(5, 1);
        const logs = result.data;

        const mapped = logs.map((log, index) => {
          const isOrder = log.subject_type === "order";
          const isDeletedEntry = /deleted/i.test(log.description || "");
          const subjectGone = log.subject_exists === false;

          // Old "order deleted" entries were saved without a subject. The order number
          // is in the text ("Lab Order #50538 deleted for ..."), so read it from there.
          const orderNoFromText = /order\s*#(\d+)/i.exec(log.description || "")?.[1];
          const isOrderDeletedEntry =
            !log.subject_type && isDeletedEntry && Boolean(orderNoFromText);

          // Follow-up reminders: detected by text OR subject_type.
          const isFollowUpEntry =
            /follow-up reminder/i.test(log.description || "") ||
            log.subject_type === "follow_up_reminder"; // CHANGED

          // CHANGED: order number for the follow-up. New entries get it from the
          // backend (subject_reference); old ones borrow it from a nearby log.
          const followUpOrderNo = isFollowUpEntry
            ? (log.subject_type === "follow_up_reminder"
                ? (log.subject_reference ?? findNearbyOrderNo(logs, index))
                : findNearbyOrderNo(logs, index))
            : null;

          const clickable =
            isOrder ||
            isOrderDeletedEntry ||
            isFollowUpEntry ||
            (!isDeletedEntry && !subjectGone);

          let type = null;
          if (isOrderDeletedEntry) type = "order";
          // With an order number, behave exactly like "Report ready" (order flow).
          else if (isFollowUpEntry) type = followUpOrderNo ? "order" : "followUp";
          else if (clickable) type = mapSubjectType(log.subject_type);

          let targetId;
          if (isOrderDeletedEntry) targetId = orderNoFromText;
          else if (isFollowUpEntry) targetId = followUpOrderNo;
          else targetId = log.subject_reference ?? log.subject_id;

          return {
            date: formatDate(log.created_at),
            text: log.description,
            type,
            targetId,
          };
        });

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
      <div className="flex items-center justify-between mb-3 ">
        <h3 className="font-semibold text-sm text-gray-900">Latest Activities</h3>
        <button
          onClick={() => navigate("/activity-logs")}
          className="text-sm font-medium text-teal-600 hover:underline cursor-pointer"
        >
          View all →
        </button>
      </div>

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