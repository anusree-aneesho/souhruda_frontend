// src/components/LabOrders/OrderDetail/ResultsTable.jsx
import ResultRow from "./ResultRow";
import { groupTestsByPackage } from "../../../utils/orderPricing";

export default function ResultsTable({ tests, billTotal, homeVisitFee = 0, results, flags, onResultChange, onSaveClose, onMarkCompleted, savingAction }) {
  const { packageGroups, individualTests } = groupTestsByPackage(tests);

  // billTotal comes from the server (order.bill_total) — the amount the
  // patient was actually charged. Fall back to summing catalog prices only
  // if it's ever missing (e.g. an older order), so the page never breaks.
  const fallbackTotal = tests.reduce((sum, t) => sum + t.price, 0);
  const testsTotal = billTotal != null ? billTotal : fallbackTotal;
  // Home collection orders: the home visit fee is billed on top of the tests.
  const total = testsTotal + Number(homeVisitFee || 0);

  const allResultsEntered = tests.every((t) => (results[t.id] || "").trim() !== "");
  const isSaving = savingAction !== null;


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

      {/* Bill breakdown — same package grouping/labels as the Confirm Order
          step of New Order, driven by what the order was actually billed
          under (order_items.test_package_id), not re-detected here. */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between pb-2 mb-1">
          <span className="text-xs font-medium text-gray-400 tracking-wide">BILL</span>
          <span className="text-xs font-medium text-gray-400 tracking-wide">PRICE</span>
        </div>

        {packageGroups.map((pkg) => {
          const individualTotal = pkg.tests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
          const savings = Math.max(0, individualTotal - pkg.price);
          return (
            <div key={`pkg-${pkg.id}`} className="py-2 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  {pkg.name} <span className="text-xs text-gray-400 font-normal">(package)</span>
                </span>
                <span className="text-sm text-gray-700">₹{pkg.price.toFixed(2)}</span>
              </div>
              <p className="pl-3.5 text-xs text-gray-400 mt-0.5">
                {pkg.tests.map((t) => t.name).join(", ")}
              </p>
              {savings > 0 && (
                <p className="pl-3.5 text-xs text-teal-600 font-medium mt-0.5">
                  Offer applied — you saved ₹{savings.toFixed(2)}
                </p>
              )}
            </div>
          );
        })}

        {individualTests.map((test) => (
          <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="flex items-center gap-2 text-sm text-gray-900">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              {test.name}
            </span>
            <span className="text-sm text-gray-700">₹{test.price.toFixed(2)}</span>
          </div>
        ))}

        {homeVisitFee > 0 && (
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="flex items-center gap-2 text-sm text-gray-900">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Home visit fee
            </span>
            <span className="text-sm text-gray-700">₹{Number(homeVisitFee).toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
        <p className="text-sm text-gray-700">
          Bill total: <span className="font-semibold text-gray-900">₹{total.toFixed(2)}</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onSaveClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingAction === "close" ? "Saving…" : "Save & Close"}
          </button>
          <button
            onClick={onMarkCompleted}
            disabled={isSaving || !allResultsEntered}
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingAction === "complete" ? "Saving…" : "Mark Completed & View Report"}
          </button>
        </div>
      </div>
    </div>
  );
}