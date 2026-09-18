// src/components/TestMaster/TestsTable/TestsTable.jsx
import { useState, useEffect, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import TestRow from "./TestRow";
import TestCard from "./TestCard";
import DemographicRangeModal from "../../modals/DemographicRangeModal";
import { useAuth } from "../../../../Context/AuthContext";

const PAGE_SIZE = 11;

export default function TestsTable({ categoryName, tests, onAddTest, onEditTest, onRemoveTest }) {
  const [viewingTest, setViewingTest] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const canManage = user?.role !== "front_office";

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [categoryName]);

  const filteredTests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) => t.name.toLowerCase().includes(q));
  }, [tests, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const lastPage = Math.max(1, Math.ceil(filteredTests.length / PAGE_SIZE));
  const pageTests = filteredTests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-900">{categoryName} Tests</h3>
        {canManage && (
          <button
            onClick={onAddTest}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Add Test
          </button>
        )}
      </div>

      {tests.length > 4 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      )}

      {tests.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No tests in this category yet.</p>
      )}

      {tests.length > 0 && filteredTests.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No tests match your search.</p>
      )}

      {filteredTests.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TEST NAME</th>
                  <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">UNIT</th>
                  <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">RANGE</th>
                  <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PRICE</th>
                  <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">FOLLOW-UP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageTests.map((test) => (
                  <TestRow
                    key={test.id}
                    test={test}
                    onEdit={onEditTest}
                    onRemove={onRemoveTest}
                    onViewRange={setViewingTest}
                    canManage={canManage}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {pageTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onEdit={onEditTest}
                onRemove={onRemoveTest}
                onViewRange={setViewingTest}
                canManage={canManage}
              />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {page} of {lastPage} · {filteredTests.length} tests
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {viewingTest && (
        <DemographicRangeModal test={viewingTest} onClose={() => setViewingTest(null)} />
      )}
    </div>
  );
}