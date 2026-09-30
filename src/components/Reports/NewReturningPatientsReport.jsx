import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { todayIso, daysAgoIso, formatCurrency } from "./shared/format";
import Pagination from "./shared/Pagination";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getNewReturningPatientsReportApi } from "../../api/api";

const PAGE_SIZE = 5;

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

  const initials =
    parts.length > 1
      ? parts[0][0] + parts[1][0]
      : parts[0].slice(0, 2);

  return initials.toUpperCase();
}

function avatarColor(name) {
  const code = (name || "")
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function GroupedBarChart({ data }) {
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [
      item.newPatients,
      item.returningPatients,
    ])
  );

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[650px]">
        <div className="flex items-end gap-3 h-64 px-4 pt-6">
          {data.map((item, i) => {
            const newHeight = Math.max(
              4,
              (item.newPatients / maxValue) * 180
            );

            const returningHeight = Math.max(
              4,
              (item.returningPatients / maxValue) * 180
            );

            return (
              <div
                key={`${item.period}-${i}`}
                className="flex-1 min-w-[50px] h-full flex flex-col items-center justify-end"
              >
                <div className="flex items-end justify-center gap-1 h-[200px]">
                  <div className="relative group">
                    <div
                      className="w-5 rounded-t-md bg-teal-500"
                      style={{ height: `${newHeight}px` }}
                    />

                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                      <div className="rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white whitespace-nowrap">
                        New: {item.newPatients}
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div
                      className="w-5 rounded-t-md bg-purple-500"
                      style={{ height: `${returningHeight}px` }}
                    />

                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                      <div className="rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white whitespace-nowrap">
                        Returning: {item.returningPatients}
                      </div>
                    </div>
                  </div>
                </div>

                <span className="mt-2 text-[11px] text-gray-400 whitespace-nowrap">
                  {item.period}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-teal-500" />
            New Patients
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-purple-500" />
            Returning Patients
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewReturningPatientsReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(56));
  const [dateTo, setDateTo] = useState(todayIso());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Which stat card is active — null means show the period trend table.
  const [selectedCard, setSelectedCard] = useState(null);

  // Current page of the patient list (client-side pagination)
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getNewReturningPatientsReportApi({
        dateFrom,
        dateTo,
      });

      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelectedCard(null);
    setPage(1);
  }, [dateFrom, dateTo]);

  const trendRows = data?.rows || [];

  /*
   * ---------------------------------------------------------
   * SELECT CORRECT DATASET, SAME PATTERN AS PatientsReport.jsx
   *
   * No card:    trendRows (period breakdown)
   * Total:      data.patient_rows
   * New:        data.new_rows
   * Returning:  data.returning_rows
   * ---------------------------------------------------------
   */
  const patientRows =
    selectedCard === "total" || selectedCard === "retention"
      ? data?.patient_rows || []
      : selectedCard === "new"
      ? data?.new_rows || []
      : selectedCard === "returning"
      ? data?.returning_rows || []
      : [];

  // Pagination — only the visible slice is rendered, exports use all rows
  const totalPages = Math.max(1, Math.ceil(patientRows.length / PAGE_SIZE));
  const pagedRows = patientRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const summary = useMemo(() => {
    if (data?.summary) {
      return {
        newPatients: data.summary.new_patients,
        returningPatients: data.summary.returning_patients,
        totalPatients: data.summary.total_patients,
        retentionRate: data.summary.retention_rate,
      };
    }

    return {
      newPatients: 0,
      returningPatients: 0,
      totalPatients: 0,
      retentionRate: 0,
    };
  }, [data]);

  const toggleCard = (card) => {
    setPage(1);
    setSelectedCard((current) =>
      current === card ? null : card
    );
  };

  const cardTitles = {
    total: "All Patients",
    new: "New Patients",
    returning: "Returning Patients",
    retention: "Retention — Who Came Back",
  };

  const isRetention = selectedCard === "retention";

  /*
   * ---------------------------------------------------------
   * EXPORT — follows whichever view is currently on screen
   * ---------------------------------------------------------
   */
  const headers = selectedCard
    ? [
        "Patient ID",
        "Patient Name",
        "Phone",
        "Total Tests",
        "Total Amount",
        ...(isRetention ? ["Status"] : []),
      ]
    : [
        "Period",
        "New Patients",
        "Returning Patients",
        "Total Patients",
      ];

  const csvRows = selectedCard
    ? patientRows.map((r) => [
        r.patient_id,
        r.patient_name,
        r.phone,
        r.tests,
        r.amount,
        ...(isRetention
          ? [r.is_returning ? "Returned" : "First visit only"]
          : []),
      ])
    : trendRows.map((item) => [
        item.period,
        item.newPatients,
        item.returningPatients,
        item.newPatients + item.returningPatients,
      ]);

  const exportTitle = selectedCard
    ? `${cardTitles[selectedCard]} — New & Returning Patients`
    : "New and Returning Patients";

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, max: dateTo, onChange: setDateFrom },
          { label: "Date To", value: dateTo, min: dateFrom, onChange: setDateTo },
        ]}
        onExportPdf={() => exportToPdf(exportTitle, headers, csvRows)}
        onExportCsv={() => exportToCsv("new-returning-patients", headers, csvRows)}
      />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          New & Returning Patients
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Track first-time and repeat patients over the selected period.
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Summary cards — click to drill into the patient list below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Patients"
          value={loading ? "—" : summary.totalPatients}
          sublabel="In selected range"
          icon={Users}
          color="teal"
          onClick={() => toggleCard("total")}
          active={selectedCard === "total"}
        />

        <StatCard
          label="New Patients"
          value={loading ? "—" : summary.newPatients}
          sublabel="First-ever visit in range"
          icon={UserPlus}
          color="blue"
          onClick={() => toggleCard("new")}
          active={selectedCard === "new"}
        />

        <StatCard
          label="Returning Patients"
          value={loading ? "—" : summary.returningPatients}
          sublabel="Repeat visit in range"
          icon={UserCheck}
          color="purple"
          onClick={() => toggleCard("returning")}
          active={selectedCard === "returning"}
        />

        <StatCard
          label="Retention Rate"
          value={
            loading
              ? "—"
              : `${summary.retentionRate}%`
          }
          sublabel="Returning ÷ total patients"
          icon={TrendingUp}
          color="amber"
          onClick={() => toggleCard("retention")}
          active={selectedCard === "retention"}
        />
      </div>

      {/* Chart — always shows the trend, regardless of card selection */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Patient Trend
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              New vs. returning patients over time
            </p>
          </div>

          <TrendingUp size={18} className="text-gray-400" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 h-64 text-gray-400">
            <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
            <span className="text-sm">
              Loading trend…
            </span>
          </div>
        ) : trendRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 h-64 text-gray-400">
            <BarChart3 size={28} className="text-gray-300" />

            <span className="text-sm font-medium text-gray-500">
              No data in this range
            </span>
          </div>
        ) : (
          <GroupedBarChart data={trendRows} />
        )}
      </div>

      {/* Table — period breakdown by default, patient list when a card is selected */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {selectedCard
                ? cardTitles[selectedCard]
                : "Period Breakdown"}
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              {isRetention
                ? "All patients in range — those marked Returned make up the retention rate"
                : selectedCard
                ? "Patients in this group, tests and amount combined across their orders"
                : "Patient counts for each period"}
            </p>
          </div>

          {selectedCard && (
            <button
              onClick={() => {
                setSelectedCard(null);
                setPage(1);
              }}
              className="text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              Show period breakdown
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {selectedCard ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                  <th className="px-4 py-3">
                    Patient ID
                  </th>

                  <th className="px-4 py-3">
                    Patient Name
                  </th>

                  <th className="px-4 py-3">
                    Phone
                  </th>

                  <th className="px-4 py-3 text-center">
                    Total Tests
                  </th>

                  <th className="px-4 py-3 text-right">
                    Total Amount
                  </th>

                  {isRetention && (
                    <th className="px-4 py-3 text-center">
                      Status
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isRetention ? 6 : 5}
                      className="px-4 py-14 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />

                        <span className="text-sm">
                          Loading patients…
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : patientRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isRetention ? 6 : 5}
                      className="px-4 py-14 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList size={28} className="text-gray-300" />

                        <span className="text-sm font-medium text-gray-500">
                          No patients in this group
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((r, i) => (
                    <tr
                      key={`${r.patient_id}-${i}`}
                      className="border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-teal-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {r.patient_id ?? "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(
                              r.patient_name
                            )}`}
                          >
                            {getInitials(r.patient_name)}
                          </span>

                          <span className="font-medium text-gray-900">
                            {r.patient_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {r.phone ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {r.tests}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(r.amount)}
                      </td>

                      {isRetention && (
                        <td className="px-4 py-3 text-center">
                          {r.is_returning ? (
                            <span className="inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                              Returned
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                              First visit only
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                  <th className="px-4 py-3">
                    Period
                  </th>

                  <th className="px-4 py-3 text-right">
                    New Patients
                  </th>

                  <th className="px-4 py-3 text-right">
                    Returning Patients
                  </th>

                  <th className="px-4 py-3 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-14 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />

                        <span className="text-sm">
                          Loading…
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : trendRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-14 text-center text-gray-400"
                    >
                      <span className="text-sm font-medium text-gray-500">
                        No data in this range
                      </span>
                    </td>
                  </tr>
                ) : (
                  trendRows.map((item, i) => (
                    <tr
                      key={`${item.period}-${i}`}
                      className="border-b border-gray-50 last:border-0 hover:bg-teal-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.period}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                          {item.newPatients}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                          {item.returningPatients}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {item.newPatients + item.returningPatients}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {selectedCard && !loading && (
          <div className="flex items-center justify-end px-5 py-3 border-t border-gray-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}