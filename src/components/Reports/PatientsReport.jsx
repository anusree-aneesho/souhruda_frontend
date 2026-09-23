// src/components/Reports/PatientsReport.jsx
import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, UserCheck } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getPatientsReportApi } from "../../api/api";

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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Patients" value={data?.summary?.total_patients ?? "—"} icon={Users} color="teal" />
        <StatCard label="New Patients" value={data?.summary?.new_patients ?? "—"} icon={UserPlus} color="blue" />
        <StatCard label="Returning" value={data?.summary?.returning_patients ?? "—"} icon={UserCheck} color="purple" />
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Patient ID</th>
                <th className="px-4 py-3 font-medium">Patient Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Tests</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No orders in this range.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{r.patient_id ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-900">{r.patient_name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{r.tests}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(r.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{r.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}