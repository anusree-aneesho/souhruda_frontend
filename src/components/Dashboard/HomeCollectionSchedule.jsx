// src/components/Dashboard/HomeCollectionSchedule/HomeCollectionSchedule.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ScheduleItem from "./ScheduleItem";
import { getHomeCollectionRequestsApi } from "../../api/api";

// Backend enum -> display label, e.g. "en_route" -> "En Route"
// (same mapping as HomeCollection.jsx / HomeCollectionDetailModal.jsx)
function formatStatus(status) {
  return (status || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Local (browser) calendar date as YYYY-MM-DD — NOT toISOString(), which
// gives UTC's date and can be a day off from IST near midnight.
function todayLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HomeCollectionSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await getHomeCollectionRequestsApi();
        const todayIso = todayLocalDate();

        const todaysRows = (rows || [])
          .filter((r) => r.slot_date === todayIso)
          .sort((a, b) => (a.slot_label || "").localeCompare(b.slot_label || ""))
          .map((r) => ({
            patient: r.patient?.name || "—",
            date: formatDate(r.slot_date),
            slot: r.slot_label,
            person: r.technician?.name || "Unassigned",
            status: formatStatus(r.status),
          }));

        if (!cancelled) setSchedule(todaysRows);
      } catch (err) {
        console.error("Failed to load home collection schedule", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-900">Home Collection Schedule</h3>
        <Link to="/home-collection" className="text-sm text-teal-600 font-medium hover:underline">
          View all →
        </Link>
      </div>
      <div>
        {loading && <p className="text-sm text-gray-400 py-3">Loading…</p>}
        {!loading && schedule.length === 0 && (
          <p className="text-sm text-gray-400 py-3">No home collections scheduled for today.</p>
        )}
        {!loading && schedule.map((item, index) => (
          <ScheduleItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}