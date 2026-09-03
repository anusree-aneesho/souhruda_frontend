// src/components/NewOrderModal/steps/SelectTestsStep.jsx
import { categories, testsByCategory } from "../../../../data/testCatalog";

export default function SelectTestsStep({ activeCategory, onCategoryChange, selectedTests, onToggleTest }) {
  const tests = testsByCategory[activeCategory] || [];
  const totalPrice = selectedTests.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onCategoryChange(cat.name)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.name ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
        {tests.map((test) => {
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
                    <p className="text-xs text-gray-400 mt-0.5">
                      Normal: {test.range} {test.unit}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-teal-600 shrink-0">₹{test.price.toFixed(2)}</span>
              </div>

              {test.lastResult && (
                <div className="mt-2 ml-7 bg-amber-50 text-amber-700 text-xs rounded-md px-3 py-2 flex items-center gap-1.5">
                  <span>🤖</span>
                  Already tested on {test.lastResult.date} — result was {test.lastResult.value}
                </div>
              )}
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between bg-teal-50 rounded-lg px-4 py-3">
        <span className="text-sm font-medium text-teal-700">{selectedTests.length} test(s) selected</span>
        <span className="text-base font-bold text-teal-700">₹{totalPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}