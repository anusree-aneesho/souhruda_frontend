// src/components/LabOrders/OrderDetail/ResultInsights.jsx
import { getInsight } from "../../../data/resultInsights";

export default function ResultInsights({ tests, flags }) {
  const abnormalTests = tests.filter((t) => ["Low", "High", "Abnormal"].includes(flags[t.id]));

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">🤖</span>
          <h3 className="font-semibold text-sm text-gray-900">Result Insights</h3>
        </div>
        <p className="text-xs text-gray-400">Auto-generated from reference ranges — not a diagnosis</p>
      </div>

      {abnormalTests.length === 0 ? (
        <p className="text-sm text-gray-500">No abnormal results yet — insights will appear here as results are entered.</p>
      ) : (
        <div className="space-y-3">
          {abnormalTests.map((test) => {
            const flag = flags[test.id];
            const insight = getInsight(test.id, flag);
            return (
              <div key={test.id} className="border border-amber-100 bg-amber-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-700">{test.name}</p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {insight || `${flag} result — worth a clinical review.`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}