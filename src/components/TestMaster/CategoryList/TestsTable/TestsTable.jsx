// src/components/TestMaster/TestsTable/TestsTable.jsx
import { useState } from "react";
import { Plus } from "lucide-react";
import TestRow from "./TestRow";
import TestCard from "./TestCard";
import DemographicRangeModal from "../../modals/DemographicRangeModal";

export default function TestsTable({ categoryName, tests, onAddTest, onEditTest, onRemoveTest }) {
  const [viewingTest, setViewingTest] = useState(null);

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-900">{categoryName} Tests</h3>
        <button
          onClick={onAddTest}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Add Test
        </button>
      </div>

      {tests.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No tests in this category yet.</p>
      )}

      {tests.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TEST NAME</th>
                  <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">UNIT</th>
                  <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">RANGE</th>
                  <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PRICE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <TestRow
                    key={test.id}
                    test={test}
                    onEdit={onEditTest}
                    onRemove={onRemoveTest}
                    onViewRange={setViewingTest}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {tests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onEdit={onEditTest}
                onRemove={onRemoveTest}
                onViewRange={setViewingTest}
              />
            ))}
          </div>
        </>
      )}

      {viewingTest && (
        <DemographicRangeModal test={viewingTest} onClose={() => setViewingTest(null)} />
      )}
    </div>
  );
}
