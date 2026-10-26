// src/components/TestMaster/modals/DemographicRangeModal.jsx
import ModalShell from "../../common/Modal/ModalShell";
import { GENDERS } from "../../../data/demographicGroups";
import { formatAgeRange, groupApiRows } from "../../../utils/rangeUtils";

const NOT_SET = <span className="text-gray-300">Not set</span>;

export default function DemographicRangeModal({ test, onClose }) {
  // test.rangeMode / test.ranges are the API values, as returned.
  const rows = test?.ranges || [];
  const mode = test?.rangeMode || (rows.length ? "age_gender" : "general");
  const unit = test?.unit ? ` ${test.unit}` : "";

  const hasCriticalLow = test?.criticalLow !== null && test?.criticalLow !== undefined && test?.criticalLow !== "";
  const hasCriticalHigh = test?.criticalHigh !== null && test?.criticalHigh !== undefined && test?.criticalHigh !== "";

  const value = (v) =>
    v ? <span>{v}<span className="text-gray-400">{unit}</span></span> : NOT_SET;

  const genderByValue = Object.fromEntries(rows.filter((r) => r.gender).map((r) => [r.gender, r.range_raw]));
  const groups = mode === "age_gender" ? groupApiRows(rows) : [];

  return (
    <ModalShell title={`${test?.name || "Test"} — Reference Ranges`} onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
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
                {hasCriticalLow ? test.criticalLow : NOT_SET}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm font-medium text-gray-900">Critical High</span>
              <span className="text-sm text-red-600 text-right">
                {hasCriticalHigh ? test.criticalHigh : NOT_SET}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            {mode === "general" && "Reference Range"}
            {mode === "gender" && "Range by Gender"}
            {mode === "age_gender" && "Range by Age & Gender"}
          </h3>

          {mode === "general" && (
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-gray-900">All patients</span>
                <span className="text-sm text-amber-600 text-right">{value(rows[0]?.range_raw)}</span>
              </div>
            </div>
          )}

          {mode === "gender" && (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              {GENDERS.map((g) => (
                <div key={g.value} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{g.label}</span>
                  <span className="text-sm text-amber-600 text-right">{value(genderByValue[g.value])}</span>
                </div>
              ))}
            </div>
          )}

          {mode === "age_gender" && (
            <div className="space-y-3">
              {groups.length === 0 && <p className="text-sm text-gray-300">Not set</p>}

              {groups.map((g) => {
                const ageText = g.special ? "" : formatAgeRange(g.min, g.max);

                return (
                  <div key={g.label} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-50/60">
                      <span className="text-sm font-semibold text-gray-900">{g.label}</span>
                      {ageText && <span className="text-xs text-gray-500 text-right">{ageText}</span>}
                    </div>

                    {!g.split ? (
                      <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-gray-100">
                        <span className="text-sm text-gray-600">All genders</span>
                        <span className="text-sm text-amber-600 text-right">{value(g.range)}</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 border-t border-gray-100">
                        {GENDERS.filter((x) => !x.optional || g.genders[x.value]).map((x) => (
                          <div key={x.value} className="flex items-center justify-between gap-4 px-4 py-3">
                            <span className="text-sm text-gray-600">{x.label}</span>
                            <span className="text-sm text-amber-600 text-right">{value(g.genders[x.value])}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {test?.note && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Note</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{test.note}</p>
          </div>
        )}
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