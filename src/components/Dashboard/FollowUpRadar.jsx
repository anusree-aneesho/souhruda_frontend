// src/components/Dashboard/FollowUpRadar.jsx
// Pending abnormal follow-ups (overdue / due today / upcoming) from the AI service.
import { Link } from "react-router-dom";
import AICard from "../common/AIcard";
import { getFollowUpRadarApi } from "../../api/insightsApi";
import useInsight from "./useInsight";

const GROUP_STYLE = {
  overdue: "bg-red-100 text-red-700",
  due_today: "bg-amber-100 text-amber-700",
  upcoming: "bg-green-100 text-green-700",
};

export default function FollowUpRadar() {
  const { data, error, loading } = useInsight(() => getFollowUpRadarApi(5));

  let body;
  if (loading) {
    body = (
      <div className="space-y-2" aria-busy="true">
        <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  } else if (!data) {
    body = <p className="text-gray-400">{error}</p>;
  } else if ((data.items || []).length === 0) {
    body = (
      <p className="text-teal-700">
        {data.message ||
          "No follow-ups scheduled yet — they're suggested automatically from abnormal reports."}
      </p>
    );
  } else {
    const s = data.summary || {};
    body = (
      <>
        <p className="text-xs text-gray-400 mb-2">
          {s.overdue > 0 && `${s.overdue} overdue · `}
          {s.due_today > 0 && `${s.due_today} due today · `}
          {s.total} pending for {s.patients} patient{s.patients === 1 ? "" : "s"}
        </p>
        <div className="divide-y divide-gray-100">
          {data.items.map((it) => (
            <Link
              key={it.reminder_id}
              to={`/follow-ups/patient/${encodeURIComponent(it.patient_number)}`}
              className="flex items-center justify-between py-3 first:pt-0 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {it.patient_name} · {it.test_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {it.abnormal_type
                    ? `${it.abnormal_type}${it.abnormal_value ? ` (${it.abnormal_value})` : ""} · `
                    : ""}
                  Order {it.order_no}
                </p>
              </div>
              <span
                className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  GROUP_STYLE[it.group] || GROUP_STYLE.upcoming
                }`}
              >
                {it.due_label}
              </span>
            </Link>
          ))}
        </div>
      </>
    );
  }

  return (
    <AICard title="Follow-up Radar" rightSlot={<Link to="/follow-ups" className="hover:underline">View all</Link>}>
      {body}
    </AICard>
  );
}