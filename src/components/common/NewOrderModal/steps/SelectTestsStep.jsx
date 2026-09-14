// src/components/NewOrderModal/steps/SelectTestsStep.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import { getTestCategories, getLabTests } from "../../../../api/api";

function mapCategory(c) {
  return { id: c.id, name: c.name };
}

function mapTest(t) {
  return {
    id: t.id,
    name: t.name,
    unit: t.unit || "",
    range: t.range_text || t.range_raw || "",
    price: Number(t.price) || 0,
  };
}

export default function SelectTestsStep({ activeCategory, onCategoryChange, selectedTests, onToggleTest }) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testSearch, setTestSearch] = useState("");
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const listRef = useRef(null);

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
      } catch (err) {
        console.error("Failed to load test categories:", err.message);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    let cancelled = false;
    setTestsLoading(true);
    setTestSearch("");
    (async () => {
      try {
        const res = await getLabTests(activeCategory);
        if (!cancelled) setTests((res.data || []).map(mapTest));
      } catch (err) {
        if (!cancelled) setTests([]);
        console.error("Failed to load lab tests:", err.message);
      } finally {
        if (!cancelled) setTestsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const filteredTests = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) => t.name.toLowerCase().includes(q));
  }, [tests, testSearch]);

  // Check whether the list is scrollable and, if so, whether we're at the bottom.
  function updateScrollHint() {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4;
    setHasMoreBelow(el.scrollHeight > el.clientHeight && !atBottom);
  }

  useEffect(() => {
    updateScrollHint();
  }, [filteredTests, testsLoading]);

  const totalPrice = selectedTests.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="px-6 py-5 space-y-4">
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
          filteredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                activeCategory === cat.id ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))
        )}
      </div>

      {!testsLoading && tests.length > 4 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={testSearch}
            onChange={(e) => setTestSearch(e.target.value)}
            placeholder="Search tests in this category..."
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
          ) : filteredTests.length === 0 ? (
            <p className="py-4 px-3.5 text-sm text-gray-400">
              {testSearch ? "No tests match your search." : "No tests found in this category."}
            </p>
          ) : (
            filteredTests.map((test) => {
              const isChecked = selectedTests.some((s) => s.id === test.id);
              return (
                <label
                  key={test.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleTest({ ...test, category: activeCategory })}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-900 flex-1 truncate">{test.name}</span>
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