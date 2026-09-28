// src/components/Reports/OperationalQuickView.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDayReportApi } from "../../api/api";
import { todayIso } from "./shared/format";

const ROWS = [
  { key: "patients", label: "Patients", source: "summary" },
  { key: "orders", label: "Orders", source: "summary" },
  { key: "tests", label: "Tests", source: "summary" },
  { key: "home_collections", label: "Home Collections", source: "summary" },
  { key: "reports_completed", label: "Reports Completed", source: "summary" },
  { key: "cancelled_orders", label: "Cancelled Orders", source: "activity" },
];

export default function OperationalQuickView({ onViewAll }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDayReportApi(todayIso())
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Today's Snapshot</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <Link
          to="/reports/operational/daily"
          onClick={onViewAll}
          className="text-sm text-teal-600 font-medium hover:underline"
        >
          View full report →
        </Link>
      </div>

      <div className="divide-y divide-gray-50">
        {ROWS.map(({ key, label, source }) => (
          <div key={key} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-900">
              {loading ? "—" : data?.[source]?.[key] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}