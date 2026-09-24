// src/components/Reports/ReportCardGrid.jsx
import { Users, IndianRupee, CalendarDays, CalendarRange, Calendar, BarChart3 } from "lucide-react";

const REPORT_CARDS = [
  {
    key: "patients",
    title: "Patients Report",
    description: "Patients seen, new vs. returning, and per-order detail.",
    icon: Users,
    color: "bg-teal-50 text-teal-600",
  },
  {
    key: "finance",
    title: "Finance Report",
    description: "Revenue, paid and pending amounts by day.",
    icon: IndianRupee,
    color: "bg-amber-50 text-amber-600",
  },
  {
    key: "daily",
    title: "Day to Day Report",
    description: "A quick view of everything that happened today.",
    icon: Calendar,
    color: "bg-blue-50 text-blue-600",
  },
  {
    key: "weekly",
    title: "Weekly Report",
    description: "Patients, orders and revenue across the week.",
    icon: CalendarDays,
    color: "bg-purple-50 text-purple-600",
  },
  {
    key: "monthly",
    title: "Monthly Report",
    description: "Monthly totals broken down week by week.",
    icon: CalendarRange,
    color: "bg-green-50 text-green-600",
  },
  {
    key: "yearly",
    title: "Yearly Report",
    description: "Full-year totals broken down month by month.",
    icon: BarChart3,
    color: "bg-rose-50 text-rose-600",
  },
];

export default function ReportCardGrid({ onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {REPORT_CARDS.map(({ key, title, description, icon: Icon, color }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className="text-left bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500"
        >
          <span className={`inline-flex h-10 w-10 rounded-lg items-center justify-center mb-3 ${color}`}>
            <Icon size={18} />
          </span>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </button>
      ))}
    </div>
  );
}