// src/components/Reports/ReportPeriod.jsx
//
// Shows the date range a report is covering, e.g.
//   "Period: 29 Aug 2026 – 28 Sep 2026"
// Also exports formatPeriod() so report titles/filenames can carry the
// same range in CSV/PDF exports.
import { CalendarRange } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-08-29" -> "29 Aug 2026". Parsed by hand (not new Date()) so the
// day can never shift because of the browser's timezone.
export function formatDisplayDate(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  const month = MONTHS[Number(m) - 1];
  if (!y || !month || !d) return iso;
  return `${Number(d)} ${month} ${y}`;
}

export function formatPeriod(dateFrom, dateTo) {
  const from = formatDisplayDate(dateFrom);
  const to = formatDisplayDate(dateTo);
  if (from && to) return from === to ? from : `${from} – ${to}`;
  return from || to || "";
}

export default function ReportPeriod({ dateFrom, dateTo }) {
  const period = formatPeriod(dateFrom, dateTo);
  if (!period) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <CalendarRange size={15} className="text-gray-400" />
      <span>Period:</span>
      <span className="font-medium text-gray-900">{period}</span>
    </div>
  );
}