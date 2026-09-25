// src/components/Reports/CancelledCollectionsReport.jsx
import { useState, useEffect, useCallback } from "react";
import { XCircle, IndianRupee, FileX } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getHomeCollectionCancelledReportApi } from "../../api/api";
import { formatHcDate } from "./shared/hcStatus";

export default function CancelledCollectionsReport({ onBack }) {
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
      const res = await getHomeCollectionCancelledReportApi({ dateFrom, dateTo, q: search || undefined });
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
  const headers = ["HC Code", "Patient", "Phone", "Slot Date", "Requested On", "Cancelled On", "Charge"];
  const csvRows = rows.map((r) => [
    r.hc_code,
    r.patient_name,
    r.phone,
    r.slot_date,
    r.requested_at,
    r.cancelled_at,
    r.collection_charge,
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
        searchPlaceholder="Search HC code or patient..."
        onExportCsv={() => exportToCsv("cancelled-collections", headers, csvRows)}
        onExportPdf={() => exportToPdf("Cancelled Collections", headers, csvRows)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {data && data.reason_tracked === false && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cancellation reasons aren't captured when a request is cancelled yet, so that column isn't shown here.
          Every request below can only be cancelled while it's still unassigned — once a technician is
          assigned, cancellation is no longer possible.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Cancelled Requests"
          value={data?.summary?.total_cancelled ?? "—"}
          sublabel="In selected range"
          icon={XCircle}
          color="gray"
        />
        <StatCard
          label="Charge Value Lost"
          value={formatCurrency(data?.summary?.lost_collection_charge)}
          sublabel="Collection charges never billed"
          icon={IndianRupee}
          color="amber"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">HC Code</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Slot Date</th>
                <th className="px-4 py-3">Requested On</th>
                <th className="px-4 py-3">Cancelled On</th>
                <th className="px-4 py-3 text-right">Charge</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm">Loading cancelled requests…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileX size={28} className="text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">No cancellations in this range</span>
                      <span className="text-xs text-gray-400">Try widening the dates or clearing your search.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.hc_code || i}
                    className="border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-rose-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.hc_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.patient_name || "—"}</div>
                      <div className="text-xs text-gray-400">{r.phone || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatHcDate(r.slot_date)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatHcDate(r.requested_at)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatHcDate(r.cancelled_at)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(r.collection_charge)}
                    </td>
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