// src/components/TestMaster/TestsTable/TestsTable.jsx
import { useState, useEffect, useMemo, Fragment } from "react";
import { Plus, Search, ArrowLeft } from "lucide-react";
import TestRow from "./TestRow";
import TestCard from "./TestCard";
import DemographicRangeModal from "../../modals/DemographicRangeModal";
import { useAuth } from "../../../../Context/AuthContext";

const PAGE_SIZE = 9;
const ROW_HEIGHT = 45;
const HEADER_HEIGHT = 30;
const TABLE_MIN_HEIGHT = HEADER_HEIGHT + PAGE_SIZE * ROW_HEIGHT;

const thClass = "pb-2 text-xs font-semibold text-gray-500 tracking-wider uppercase";

// `searchableTests` is every test from every category (each with its own
// `category`), so the search box can look beyond the selected category.
export default function TestsTable({
  categoryName,
  tests,
  searchableTests = [],
  testsById = {},
  onAddTest,
  onEditTest,
  onRemoveTest,
}) {
  const [viewingTest, setViewingTest] = useState(null);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const canManage = user?.role !== "front_office";

  useEffect(() => {
    setPage(1);
    setSearch("");
    setOpenGroupId(null);
  }, [categoryName]);

  // The group being viewed (e.g. CBC). Looked up from every test (not just this
  // category) so it still opens when it was found through a cross-category
  // search, stays fresh after an edit, and falls back to the normal list if it
  // was removed.
  const openGroup = openGroupId ? testsById[openGroupId] || null : null;

  // What the table lists: this category's tests, or — inside a group — that
  // group's parameters, in the order they were set, resolved from every category.
  const listedTests = useMemo(() => {
    if (!openGroup) return tests;
    return (openGroup.parameterIds || []).map((id) => testsById[id]).filter(Boolean);
  }, [openGroup, tests, testsById]);

  // Searching outside a group looks through ALL categories; inside a group it
  // only searches that group's parameters.
  const isGlobalSearch = !openGroup && search.trim() !== "";

  const filteredTests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return listedTests;
    const source = openGroup || searchableTests.length === 0 ? listedTests : searchableTests;
    return source.filter((t) => t.name.toLowerCase().includes(q));
  }, [listedTests, searchableTests, openGroup, search]);

  function openGroupView(test) {
    setOpenGroupId(test.id);
    setSearch("");
    setPage(1);
  }

  function closeGroupView() {
    setOpenGroupId(null);
    setSearch("");
    setPage(1);
  }

  useEffect(() => {
    setPage(1);
  }, [search]);

  const lastPage = Math.max(1, Math.ceil(filteredTests.length / PAGE_SIZE));
  const pageTests = filteredTests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // While searching across categories, show a category label above each run of
  // results so it's clear where a test lives.
  function startsNewCategory(index) {
    return isGlobalSearch && (index === 0 || pageTests[index - 1].category !== pageTests[index].category);
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col">
      <div className="flex items-center justify-between mb-5">
        {openGroup ? (
          <div>
            <button
              type="button"
              onClick={closeGroupView}
              className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline mb-1.5 cursor-pointer"
            >
              <ArrowLeft size={13} /> Back to {categoryName}
            </button>
            <h3 className="text-base font-semibold text-gray-900">{openGroup.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {listedTests.length} {listedTests.length === 1 ? "parameter" : "parameters"} in this test
            </p>
          </div>
        ) : isGlobalSearch ? (
          <div>
            <h3 className="text-base font-semibold text-gray-900">Search Results</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {filteredTests.length} {filteredTests.length === 1 ? "test" : "tests"} found across all categories
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-base font-semibold text-gray-900">{categoryName} Tests</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {tests.length} {tests.length === 1 ? "test" : "tests"} in this category
            </p>
          </div>
        )}
        {canManage && !openGroup && (
          <button
            onClick={onAddTest}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <Plus size={16} /> Add Test
          </button>
        )}
      </div>

      {/* Always available outside a group, so a test in another category can be
          found even from a category with only a few tests. */}
      {(!openGroup || listedTests.length > 4) && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={openGroup ? "Search parameters..." : "Search tests in all categories..."}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      )}

      <div className="flex-1" style={{ minHeight: `${TABLE_MIN_HEIGHT}px` }}>
        {listedTests.length === 0 && !isGlobalSearch && (
          <p className="text-sm text-gray-400 text-center py-8">
            {openGroup ? "No parameters found for this test." : "No tests in this category yet."}
          </p>
        )}

        {filteredTests.length === 0 && (isGlobalSearch || listedTests.length > 0) && (
          <p className="text-sm text-gray-400 text-center py-8">
            {isGlobalSearch ? "No tests match your search in any category." : "No tests match your search."}
          </p>
        )}

        {filteredTests.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className={thClass}>{openGroup ? "Test Parameter" : "Test Name"}</th>
                    <th className={thClass}>Unit</th>
                    <th className={thClass}>Range</th>
                    <th className={thClass}>Price</th>
                    <th className={thClass}>Follow-up</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageTests.map((test, i) => (
                    <Fragment key={test.id}>
                      {startsNewCategory(i) && (
                        <tr>
                          <td
                            colSpan={6}
                            className="pt-4 pb-1 text-[11px] font-semibold text-teal-700 tracking-wider uppercase"
                          >
                            {test.category}
                          </td>
                        </tr>
                      )}
                      <TestRow
                        test={test}
                        onEdit={onEditTest}
                        onRemove={onRemoveTest}
                        onViewRange={setViewingTest}
                        onOpenGroup={openGroupView}
                        canManage={canManage}
                        canRemove={!openGroup}
                      />
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {pageTests.map((test, i) => (
                <Fragment key={test.id}>
                  {startsNewCategory(i) && (
                    <p className="pt-2 text-[11px] font-semibold text-teal-700 tracking-wider uppercase">
                      {test.category}
                    </p>
                  )}
                  <TestCard
                    test={test}
                    onEdit={onEditTest}
                    onRemove={onRemoveTest}
                    onViewRange={setViewingTest}
                    onOpenGroup={openGroupView}
                    canManage={canManage}
                    canRemove={!openGroup}
                  />
                </Fragment>
              ))}
            </div>
          </>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Page {page} of {lastPage} · {filteredTests.length} tests
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {viewingTest && (
        <DemographicRangeModal test={viewingTest} onClose={() => setViewingTest(null)} />
      )}
    </div>
  );
}