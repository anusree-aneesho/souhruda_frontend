// src/components/LabOrders/OrderDetail/ResultsTable.jsx  (cleaner version — use this one)
import ResultRow from "./ResultRow";

export default function ResultsTable({ tests, results, flags, onResultChange, onSaveClose, onMarkCompleted }) {
  const billTotal = tests.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
        <h3 className="font-semibold text-sm text-gray-900">Enter Results</h3>
        <p className="text-xs text-gray-400">Flags calculate automatically from the normal range set in Test Master</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TEST</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">UNIT</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">NORMAL RANGE</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">RESULT</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">FLAG</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PRICE</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <ResultRow
                key={test.id}
                test={test}
                result={results[test.id] || ""}
                flag={flags[test.id]}
                onResultChange={onResultChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
        <p className="text-sm text-gray-700">
          Bill total: <span className="font-semibold text-gray-900">₹{billTotal.toFixed(2)}</span>
        </p>
        <div className="flex gap-3">
          <button onClick={onSaveClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            Save & Close
          </button>
          <button onClick={onMarkCompleted} className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer">
            Mark Completed & View Report
          </button>
        </div>
      </div>
    </div>
  );
}