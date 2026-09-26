// src/components/Reports/DayToDayReport.jsx
import { useState, useEffect, useCallback } from "react";
import { Users, ClipboardList, FlaskConical, Truck, FileCheck2 } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { todayIso } from "./shared/format";
import { getDayReportApi } from "../../api/api";

const ACTIVITY_ROWS = [
  { key: "new_patients", label: "New Patients" },
  { key: "lab_orders", label: "Lab Orders" },
  { key: "tests_completed", label: "Tests Completed" },
  { key: "home_collections", label: "Home Collections" },
  { key: "reports_ready", label: "Reports Ready" },
  { key: "cancelled_orders", label: "Cancelled Orders" },
];

export default function DayToDayReport({ onBack }) {
  const [date, setDate] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDayReportApi(date);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[{ label: "Select Date", value: date, onChange: setDate, max: todayIso() }]}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Patients" value={loading ? "—" : data?.summary?.patients ?? 0} icon={Users} color="teal" />
        <StatCard label="Orders" value={loading ? "—" : data?.summary?.orders ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Tests" value={loading ? "—" : data?.summary?.tests ?? 0} icon={FlaskConical} color="purple" />
        <StatCard
          label="Home Collections"
          value={loading ? "—" : data?.summary?.home_collections ?? 0}
          icon={Truck}
          color="amber"
        />
        <StatCard
          label="Reports Completed"
          value={loading ? "—" : data?.summary?.reports_completed ?? 0}
          icon={FileCheck2}
          color="green"
        />
      </div>

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Today's Activity</h3>
        <div className="divide-y divide-gray-50">
          {ACTIVITY_ROWS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-900">
                {loading ? "—" : data?.activity?.[key] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}