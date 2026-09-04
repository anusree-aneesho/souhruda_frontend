// src/components/NewOrderModal/steps/SelectTestsStep.jsx
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getTestCategories, getLabTests } from "../../../../api/api";

function mapCategory(c) {
  return { id: c.id, name: c.name };
}

function mapTest(t) {
  return {
    id: t.id,
    name: t.name,
    unit: t.unit || "",
    // range_text covers non-numeric ranges (e.g. "Negative"); range_raw covers numeric ones (e.g. "70-110")
    range: t.range_text || t.range_raw || "",
    price: Number(t.price) || 0,
  };
}

export default function SelectTestsStep({ activeCategory, onCategoryChange, selectedTests, onToggleTest }) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);

  // Load test categories once, and default to the first one.
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

  // Load the tests for whichever category tab is active.
  useEffect(() => {
    if (!activeCategory) return;
    let cancelled = false;
    setTestsLoading(true);
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

  const totalPrice = selectedTests.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex gap-2 flex-wrap min-h-[34px]">
        {categoriesLoading ? (
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading categories...
          </p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-400">No test categories set up yet.</p>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))
        )}
      </div>

      <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
        {testsLoading ? (
          <p className="flex items-center gap-2 py-4 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading tests...
          </p>
        ) : tests.length === 0 ? (
          <p className="py-4 text-sm text-gray-400">No tests found in this category.</p>
        ) : (
          tests.map((test) => {
            const isChecked = selectedTests.some((s) => s.id === test.id);
            return (
              <label
                key={test.id}
                className="block border border-gray-100 rounded-lg p-3.5 cursor-pointer hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleTest({ ...test, category: activeCategory })}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{test.name}</p>
                      {test.range && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Normal: {test.range} {test.unit}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-teal-600 shrink-0">₹{test.price.toFixed(2)}</span>
                </div>
              </label>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between bg-teal-50 rounded-lg px-4 py-3">
        <span className="text-sm font-medium text-teal-700">{selectedTests.length} test(s) selected</span>
        <span className="text-base font-bold text-teal-700">₹{totalPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}