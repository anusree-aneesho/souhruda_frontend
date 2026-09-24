// src/components/Reports/PatientsReport.jsx
import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, UserCheck, ClipboardList } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getPatientsReportApi } from "../../api/api";

const AVATAR_COLORS = [
  "bg-teal-50 text-teal-700",
  "bg-blue-50 text-blue-700",
  "bg-purple-50 text-purple-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

function avatarColor(name) {
  const code = (name || "").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PatientsReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPatientsReportApi({ dateFrom, dateTo, q: search || undefined });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, search]);

  const rows = data?.rows || [];
  const headers = ["Patient ID", "Patient Name", "Phone", "Tests", "Amount", "Date"];
  const csvRows = rows.map((r) => [
    r.patient_id,
    r.patient_name,
    r.phone,
    r.tests,
    r.amount,
    r.date,
  ]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search patient..."
        onExportCsv={() => exportToCsv("patients-report", headers, csvRows)}
        onExportPdf={() => exportToPdf("Patients Report", headers, csvRows)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Patients"
          value={data?.summary?.total_patients ?? "—"}
          sublabel="In selected range"
          icon={Users}
          color="teal"
        />
        <StatCard
          label="New Patients"
          value={data?.summary?.new_patients ?? "—"}
          sublabel="First visit in range"
          icon={UserPlus}
          color="blue"
        />
        <StatCard
          label="Returning"
          value={data?.summary?.returning_patients ?? "—"}
          sublabel="Repeat visits in range"
          icon={UserCheck}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-center">Tests</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm">Loading patients…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList size={28} className="text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">No orders in this range</span>
                      <span className="text-xs text-gray-400">Try widening the dates or clearing your search.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-teal-50/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.patient_id ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(
                            r.patient_name
                          )}`}
                        >
                          {getInitials(r.patient_name)}
                        </span>
                        <span className="font-medium text-gray-900">{r.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {r.tests}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 text-xs text-gray-400">
            Showing {rows.length} {rows.length === 1 ? "record" : "records"}
          </div>
        )}
      </div>
    </div>
  );
}