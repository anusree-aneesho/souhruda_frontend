// src/components/Reports/DailyBreakdownTable.jsx
//
// Day-wise rows for the branch reports: one row per (date, branch), newest
// first, with the Date column styled like the Patient Summary report
// (e.g. "25 Sept 2026").
import { useState } from "react";
import { formatCurrency } from "./shared/format";
import Pagination from "./shared/Pagination";

const PAGE_SIZE = 10;

// "2026-09-25" -> "25 Sept 2026". Built from a local-time Date so the day
// never shifts with the browser's timezone.
export function formatRowDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * columns: [{ key, label, currency?: boolean }]  (Date + Branch are added for you)
 */
export default function DailyBreakdownTable({ title = "Day-wise Breakdown", rows = [], columns = [], loading }) {
  const [page, setPage] = useState(1);

  // Back to page 1 whenever a different result set arrives (new dates / branch).
  const last = rows[rows.length - 1];
  const signature = `${rows.length}|${rows[0]?.date}|${rows[0]?.branch_id}|${last?.date}|${last?.branch_id}`;
  const [seen, setSeen] = useState(signature);
  if (signature !== seen) {
    setSeen(signature);
    setPage(1);
  }

  if (loading) return null;

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Branch</th>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-400">
                  No activity in this range.
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr key={`${r.date}-${r.branch_id}`} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatRowDate(r.date)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.branch_name}</td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-gray-700">
                      {c.currency ? formatCurrency(r[c.key]) : (r[c.key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-gray-400">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}{" "}
            {rows.length === 1 ? "entry" : "entries"}
          </span>
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}