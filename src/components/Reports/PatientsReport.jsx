// src/components/Reports/PatientsReport.jsx

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import {
  formatCurrency,
  todayIso,
  daysAgoIso,
} from "./shared/format";

import {
  exportToCsv,
  exportToPdf,
} from "../../utils/reportExport";

import { getPatientsReportApi } from "../../api/api";

const ROWS_PER_PAGE = 15;

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
    .reduce(
      (sum, ch) => sum + ch.charCodeAt(0),
      0
    );

  return AVATAR_COLORS[
    code % AVATAR_COLORS.length
  ];
}

function formatDate(value) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PatientsReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(
    daysAgoIso(30)
  );

  const [dateTo, setDateTo] = useState(
    todayIso()
  );

  const [search, setSearch] = useState("");

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedCard, setSelectedCard] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  /*
   * ---------------------------------------------------------
   * LOAD REPORT
   * ---------------------------------------------------------
   */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res =
        await getPatientsReportApi({
          dateFrom,
          dateTo,
          q: search || undefined,
          page: currentPage,
        });

      setData(res);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load report."
      );
    } finally {
      setLoading(false);
    }
  }, [
    dateFrom,
    dateTo,
    search,
    currentPage,
  ]);

  /*
   * Load whenever page/date/search changes.
   */
  useEffect(() => {
    const timer = setTimeout(
      load,
      search ? 350 : 0
    );

    return () => clearTimeout(timer);
  }, [load, search]);

  /*
   * Reset page when search or date range changes.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    dateFrom,
    dateTo,
    search,
  ]);

  /*
   * Reset page when changing card.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCard]);

  /*
   * ---------------------------------------------------------
   * SELECT CORRECT DATASET
   * ---------------------------------------------------------
   *
   * No card:
   *     data.rows
   *
   * Total:
   *     data.patient_rows
   *
   * New:
   *     data.new_rows
   *
   * Returning:
   *     data.returning_rows
   * ---------------------------------------------------------
   */
  const displayRows =
    !selectedCard
      ? data?.rows || []
      : selectedCard === "total"
      ? data?.patient_rows || []
      : selectedCard === "new"
      ? data?.new_rows || []
      : selectedCard === "returning"
      ? data?.returning_rows || []
      : [];

  /*
   * ---------------------------------------------------------
   * GET PAGINATION FOR CURRENT VIEW
   * ---------------------------------------------------------
   */
  const pagination =
    !selectedCard
      ? data?.pagination?.normal
      : selectedCard === "total"
      ? data?.pagination?.total
      : selectedCard === "new"
      ? data?.pagination?.new
      : selectedCard === "returning"
      ? data?.pagination?.returning
      : null;

  const totalRows =
    pagination?.total || 0;

  const totalPages =
    pagination?.last_page || 1;

  const safeCurrentPage =
    pagination?.current_page ||
    currentPage;

  /*
   * ---------------------------------------------------------
   * EXPORT
   * ---------------------------------------------------------
   */
  const headers = selectedCard
    ? [
        "Patient ID",
        "Patient Name",
        "Phone",
        "Total Tests",
        "Total Amount",
      ]
    : [
        "Patient ID",
        "Patient Name",
        "Phone",
        "Tests",
        "Amount",
        "Date",
      ];

  const csvRows = displayRows.map(
    (r) => {
      if (selectedCard) {
        return [
          r.patient_id,
          r.patient_name,
          r.phone,
          r.tests,
          r.amount,
        ];
      }

      return [
        r.patient_id,
        r.patient_name,
        r.phone,
        r.tests,
        r.amount,
        r.date,
      ];
    }
  );

  /*
   * ---------------------------------------------------------
   * PAGE CHANGE
   * ---------------------------------------------------------
   */
  const goToPage = (page) => {
    if (page < 1) return;

    if (page > totalPages) return;

    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">

      {/* TOOLBAR */}

      <ReportToolbar
        onBack={onBack}
        fields={[
          {
            label: "Date From",
            value: dateFrom,
            onChange: setDateFrom,
            max: dateTo,
          },
          {
            label: "Date To",
            value: dateTo,
            onChange: setDateTo,
            min: dateFrom,
          },
        ]}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search patient..."
        onExportCsv={() =>
          exportToCsv(
            "patients-report",
            headers,
            csvRows
          )
        }
        onExportPdf={() =>
          exportToPdf(
            "Patients Report",
            headers,
            csvRows
          )
        }
      />

      {/* ERROR */}

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* STAT CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <StatCard
          label="Total Patients"
          value={
            data?.summary?.total_patients ??
            "—"
          }
          sublabel="In selected range"
          icon={Users}
          color="teal"
          onClick={() =>
            setSelectedCard(
              (current) =>
                current === "total"
                  ? null
                  : "total"
            )
          }
          active={
            selectedCard === "total"
          }
        />

        <StatCard
          label="New Patients"
          value={
            data?.summary?.new_patients ??
            "—"
          }
          sublabel="First visit in range"
          icon={UserPlus}
          color="blue"
          onClick={() =>
            setSelectedCard(
              (current) =>
                current === "new"
                  ? null
                  : "new"
            )
          }
          active={
            selectedCard === "new"
          }
        />

        <StatCard
          label="Returning"
          value={
            data?.summary
              ?.returning_patients ??
            "—"
          }
          sublabel="Repeat visits in range"
          icon={UserCheck}
          color="purple"
          onClick={() =>
            setSelectedCard(
              (current) =>
                current === "returning"
                  ? null
                  : "returning"
            )
          }
          active={
            selectedCard === "returning"
          }
        />

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">

        <div className="overflow-x-auto">

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
                  {selectedCard
                    ? "Total Tests"
                    : "Tests"}
                </th>

                <th className="px-4 py-3 text-right">
                  {selectedCard
                    ? "Total Amount"
                    : "Amount"}
                </th>

                {!selectedCard && (
                  <th className="px-4 py-3">
                    Date
                  </th>
                )}

              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={
                      selectedCard ? 5 : 6
                    }
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

              ) : displayRows.length === 0 ? (

                <tr>
                  <td
                    colSpan={
                      selectedCard ? 5 : 6
                    }
                    className="px-4 py-14 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-2">

                      <ClipboardList
                        size={28}
                        className="text-gray-300"
                      />

                      <span className="text-sm font-medium text-gray-500">
                        No patients in this range
                      </span>

                      <span className="text-xs text-gray-400">
                        Try widening the dates or clearing your search.
                      </span>

                    </div>
                  </td>
                </tr>

              ) : (

                displayRows.map(
                  (r, i) => (

                    <tr
                      key={`${r.patient_id}-${i}`}
                      className="border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-teal-50/40 transition-colors"
                    >

                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {r.patient_id ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-2.5">

                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(
                              r.patient_name
                            )}`}
                          >
                            {getInitials(
                              r.patient_name
                            )}
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
                        {formatCurrency(
                          r.amount
                        )}
                      </td>

                      {!selectedCard && (
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(
                            r.date
                          )}
                        </td>
                      )}

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        {!loading &&
          totalRows > 0 && (

            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                {/* RECORD COUNT */}

                <div className="text-xs text-gray-400">

                  Showing{" "}

                  <span className="font-medium text-gray-600">
                    {(
                      safeCurrentPage -
                      1
                    ) *
                      ROWS_PER_PAGE +
                      1}
                  </span>

                  {" – "}

                  <span className="font-medium text-gray-600">
                    {Math.min(
                      safeCurrentPage *
                        ROWS_PER_PAGE,
                      totalRows
                    )}
                  </span>

                  {" of "}

                  <span className="font-medium text-gray-600">
                    {totalRows}
                  </span>

                  {" records"}

                </div>

                {/* PREVIOUS / NEXT */}

                {totalPages > 1 && (

                  <div className="flex items-center gap-1">

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          safeCurrentPage -
                            1
                        )
                      }
                      disabled={
                        safeCurrentPage ===
                        1
                      }
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft
                        size={16}
                      />

                      <span className="ml-1">
                        Previous
                      </span>
                    </button>

                    <span className="px-3 text-xs text-gray-500">
                      Page{" "}
                      <span className="font-semibold text-gray-700">
                        {safeCurrentPage}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-gray-700">
                        {totalPages}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          safeCurrentPage +
                            1
                        )
                      }
                      disabled={
                        safeCurrentPage ===
                        totalPages
                      }
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="mr-1">
                        Next
                      </span>

                      <ChevronRight
                        size={16}
                      />
                    </button>

                  </div>

                )}

              </div>

            </div>

          )}

      </div>

    </div>
  );
}