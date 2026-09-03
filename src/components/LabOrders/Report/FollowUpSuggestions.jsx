// src/components/LabOrders/Report/FollowUpSuggestions.jsx
import { getFollowUpWeeks } from "../../../data/followUpConfig";
import { addWeeksToDate } from "../../../utils/addWeeks";

export default function FollowUpSuggestions({ tests, flags, reportDate, onSchedule }) {
  const abnormal = tests.filter((t) => ["Low", "High", "Abnormal"].includes(flags[t.id]));

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">🤖</span>
          <h3 className="font-semibold text-sm text-gray-900">Follow-up Suggestions</h3>
        </div>
        <p className="text-xs text-gray-400">Based on today's abnormal results</p>
      </div>

      {abnormal.length === 0 ? (
        <p className="text-sm text-gray-500">No follow-ups suggested — all parameters are within range.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {abnormal.map((test) => {
            const weeks = getFollowUpWeeks(test.id);
            const dueDate = addWeeksToDate(reportDate, weeks);
            return (
              <div key={test.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{test.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Recommended re-test around {dueDate} ({weeks} weeks)
                  </p>
                </div>
                <button
                  onClick={() => onSchedule(test)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shrink-0"
                >
                  Schedule Reminder
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}