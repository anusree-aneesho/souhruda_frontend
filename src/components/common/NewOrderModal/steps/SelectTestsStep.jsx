// src/components/NewOrderModal/steps/SelectTestsStep.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import { getTestCategories, getLabTests } from "../../../../api/api";

function mapCategory(c) {
  return { id: c.id, name: c.name };
}

function mapTest(t, categoryId) {
  return {
    id: t.id,
    name: t.name,
    unit: t.unit || "",
    range: t.range_text || t.range_raw || "",
    price: Number(t.price) || 0,
    categoryId, // which category this test belongs to
  };
}

export default function SelectTestsStep({ activeCategory, onCategoryChange, selectedTests, onToggleTest, doctors, referredBy, onReferredByChange, referredByError })
{
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [allTests, setAllTests] = useState([]); // tests from EVERY category
  const [testsLoading, setTestsLoading] = useState(true);
  const [testSearch, setTestSearch] = useState("");
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const listRef = useRef(null);
  const pillRefs = useRef({});

  // Load categories, then the tests of every category once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getTestCategories();
        const mapped = (res.data || []).map(mapCategory);
        if (cancelled) return;
        setCategories(mapped);
        if (!activeCategory && mapped.length > 0) {
          onCategoryChange(mapped[0].id);
        }
        setCategoriesLoading(false);

        const results = await Promise.all(
          mapped.map((c) =>
            getLabTests(c.id)
              .then((r) => (r.data || []).map((t) => mapTest(t, c.id)))
              .catch((err) => {
                console.error(`Failed to load tests for category ${c.id}:`, err.message);
                return [];
              })
          )
        );
        if (!cancelled) setAllTests(results.flat());
      } catch (err) {
        console.error("Failed to load test categories:", err.message);
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
          setTestsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  // how many ticked tests each category has, e.g. { 3: 2, 7: 1 }
  const selectedCountByCategory = useMemo(() => {
    const counts = {};
    selectedTests.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [selectedTests]);

  const query = testSearch.trim().toLowerCase();

  // While searching: matches from ALL categories
  const searchResults = useMemo(() => {
    if (!query) return [];
    return allTests.filter((t) => t.name.toLowerCase().includes(query));
  }, [allTests, query]);

  // What the list shows: search results (all categories) or the active category
  const visibleTests = useMemo(() => {
    if (query) return searchResults;
    return allTests.filter((t) => t.categoryId === activeCategory);
  }, [query, searchResults, allTests, activeCategory]);

  // Move the highlighted category pill to where the match lives
  useEffect(() => {
    if (!query || searchResults.length === 0) return;
    const alreadyHere = searchResults.some((t) => t.categoryId === activeCategory);
    if (!alreadyHere) onCategoryChange(searchResults[0].categoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults]);

  // Keep the active pill visible in the horizontally scrolling row
  useEffect(() => {
    pillRefs.current[activeCategory]?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeCategory]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    const list = q
      ? categories.filter((c) => c.name.toLowerCase().includes(q))
      : categories;

    // categories with selected tests go first; everything else keeps its original order
    const withSelection = list.filter((c) => selectedCountByCategory[c.id]);
    const withoutSelection = list.filter((c) => !selectedCountByCategory[c.id]);
    return [...withSelection, ...withoutSelection];
  }, [categories, categorySearch, selectedCountByCategory]);

  function updateScrollHint() {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4;
    setHasMoreBelow(el.scrollHeight > el.clientHeight && !atBottom);
  }

  useEffect(() => {
    updateScrollHint();
  }, [visibleTests, testsLoading]);

  const totalPrice = selectedTests.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="px-6 py-5 space-y-4">
      <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Referred By</label>
              <select
              value={referredBy}
              onChange={(e) => onReferredByChange(e.target.value)}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                referredByError
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
              }`}
              >
            <option value="" disabled>Select</option>
            <option value="Self">Self</option>
              {doctors.map((doc) => (
            <option key={doc.id} value={`Dr. ${doc.name}`}>
              Dr. {doc.name}
            </option>
          ))}
          </select>
          {referredByError && (
            <p className="text-xs text-red-500 mt-1">This field is required.</p>
          )}
          </div>
      {categories.length > 4 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {categoriesLoading ? (
          <p className="text-sm text-gray-400 flex items-center gap-2 shrink-0">
            <Loader2 size={14} className="animate-spin" /> Loading categories...
          </p>
        ) : filteredCategories.length === 0 ? (
          <p className="text-sm text-gray-400 shrink-0">
            {categorySearch ? "No categories match your search." : "No test categories set up yet."}
          </p>
        ) : (
          filteredCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = selectedCountByCategory[cat.id] || 0;

            return (
              <button
                key={cat.id}
                ref={(el) => (pillRefs.current[cat.id] = el)}
                onClick={() => {
                  setTestSearch("");
                  onCategoryChange(cat.id);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5 ${
                  isActive
                    ? "bg-teal-600 text-white"
                    : count > 0
                    ? "bg-teal-50 text-teal-700 border border-teal-300 hover:bg-teal-100"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat.name}
                {count > 0 && (
                  <span
                    className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                      isActive ? "bg-white/25 text-white" : "bg-teal-600 text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {!testsLoading && allTests.length > 4 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={testSearch}
            onChange={(e) => setTestSearch(e.target.value)}
            placeholder="Search tests in all categories..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      )}

      <div className="relative">
        <div
          ref={listRef}
          onScroll={updateScrollHint}
          className="max-h-44 overflow-y-auto pr-1 divide-y divide-gray-100 border border-gray-100 rounded-lg [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {testsLoading ? (
            <p className="flex items-center gap-2 py-4 px-3.5 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Loading tests...
            </p>
          ) : visibleTests.length === 0 ? (
            <p className="py-4 px-3.5 text-sm text-gray-400">
              {query ? "No tests match your search." : "No tests found in this category."}
            </p>
          ) : (
            visibleTests.map((test) => {
              const isChecked = selectedTests.some((s) => s.id === test.id);
              return (
                <label
                  key={test.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleTest({ ...test, category: test.categoryId })}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                    {test.name}
                    {query && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {categoryNameById[test.categoryId]}
                      </span>
                    )}
                  </span>
                  {test.range && (
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">{test.range} {test.unit}</span>
                  )}
                  <span className="text-sm font-semibold text-teal-600 shrink-0 w-16 text-right">₹{test.price.toFixed(2)}</span>
                </label>
              );
            })
          )}
        </div>

        {hasMoreBelow && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-1 h-8 rounded-b-lg bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      <div className="flex items-center justify-between bg-teal-50 rounded-lg px-4 py-3">
        <span className="text-sm font-medium text-teal-700">{selectedTests.length} test(s) selected</span>
        <span className="text-base font-bold text-teal-700">₹{totalPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}