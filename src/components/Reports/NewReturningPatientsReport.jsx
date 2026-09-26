import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import StatCard from "../common/StatCard";
import { todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";

const MOCK_DATA = [
  { period: "May 1", newPatients: 18, returningPatients: 12 },
  { period: "May 8", newPatients: 24, returningPatients: 16 },
  { period: "May 15", newPatients: 20, returningPatients: 21 },
  { period: "May 22", newPatients: 29, returningPatients: 18 },
  { period: "May 29", newPatients: 25, returningPatients: 24 },
  { period: "Jun 5", newPatients: 31, returningPatients: 27 },
  { period: "Jun 12", newPatients: 28, returningPatients: 30 },
  { period: "Jun 19", newPatients: 35, returningPatients: 26 },
  { period: "Jun 26", newPatients: 32, returningPatients: 34 },
];

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
          {data.map((item) => {
            const newHeight =
              Math.max(4, (item.newPatients / maxValue) * 180);

            const returningHeight =
              Math.max(4, (item.returningPatients / maxValue) * 180);

            return (
              <div
                key={item.period}
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
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());

  /*
   * Frontend-only data for now.
   *
   * Later this will come from:
   * GET /reports/patients/new-returning
   */
  const data = MOCK_DATA;

  const summary = useMemo(() => {
    const newPatients = data.reduce(
      (sum, item) => sum + item.newPatients,
      0
    );

    const returningPatients = data.reduce(
      (sum, item) => sum + item.returningPatients,
      0
    );

    return {
      newPatients,
      returningPatients,
      totalPatients: newPatients + returningPatients,
    };
  }, [data]);

  const headers = [
    "Period",
    "New Patients",
    "Returning Patients",
    "Total Patients",
  ];

  const csvRows = data.map((item) => [
    item.period,
    item.newPatients,
    item.returningPatients,
    item.newPatients + item.returningPatients,
  ]);

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 w-fit"
      >
        <ArrowLeft size={16} />
        Back to Reports
      </button>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          New & Returning Patients
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Track first-time and repeat patients over the selected period.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Date From
            </label>

            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Date To
            </label>

            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportToPdf(
                "New and Returning Patients",
                headers,
                csvRows
              )
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export PDF
          </button>

          <button
            onClick={() =>
              exportToCsv(
                "new-returning-patients",
                headers,
                csvRows
              )
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Patients"
          value={summary.totalPatients}
          sublabel="In selected range"
          icon={Users}
          color="teal"
        />

        <StatCard
          label="New Patients"
          value={summary.newPatients}
          sublabel="First-time patients"
          icon={UserPlus}
          color="blue"
        />

        <StatCard
          label="Returning Patients"
          value={summary.returningPatients}
          sublabel="Repeat patients"
          icon={UserCheck}
          color="purple"
        />
      </div>

      {/* Chart */}
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

          <TrendingUp
            size={18}
            className="text-gray-400"
          />
        </div>

        <GroupedBarChart data={data} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Period Breakdown
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Patient counts for each period
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">Period</th>
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
              {data.map((item) => (
                <tr
                  key={item.period}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}