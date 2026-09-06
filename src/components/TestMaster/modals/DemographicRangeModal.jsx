// src/components/TestMaster/modals/DemographicRangeModal.jsx
import ModalShell from "../../common/Modal/ModalShell";
import { DEMOGRAPHIC_GROUPS } from "../../../data/demographicGroups";

export default function DemographicRangeModal({ test, onClose }) {
  const ranges = test?.demographicRanges || {};

  const hasCriticalLow = test?.criticalLow !== null && test?.criticalLow !== undefined && test?.criticalLow !== "";
  const hasCriticalHigh = test?.criticalHigh !== null && test?.criticalHigh !== undefined && test?.criticalHigh !== "";

  return (
    <ModalShell title={`${test?.name || "Test"} — Range by Category`} onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Test Criteria</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {test?.criteria ? test.criteria : <span className="text-gray-300">Not set</span>}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Critical Range</h3>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm font-medium text-gray-900">Critical Low</span>
              <span className="text-sm text-red-600 text-right">
                {hasCriticalLow ? test.criticalLow : <span className="text-gray-300">Not set</span>}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm font-medium text-gray-900">Critical High</span>
              <span className="text-sm text-red-600 text-right">
                {hasCriticalHigh ? test.criticalHigh : <span className="text-gray-300">Not set</span>}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Range by Category</h3>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {DEMOGRAPHIC_GROUPS.map((group) => (
              <div key={group} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-gray-900">{group}</span>
                <span className="text-sm text-amber-600 text-right">
                  {ranges[group] ? ranges[group] : <span className="text-gray-300">Not set</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}