// src/components/HomeCollection/DetailModal/TestsList.jsx
export default function TestsList({ tests }) {
  const total = tests.reduce((sum, t) => sum + t.price, 0);
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 mb-2">Tests ({tests.length})</p>
      <div className="space-y-2">
        {tests.map((test) => (
          <div key={test.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{test.name}</p>
              <p className="text-xs text-gray-400">{test.category}</p>
            </div>
            <span className="text-sm font-semibold text-teal-600">₹{test.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between bg-teal-50 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-teal-700">Tests total</span>
          <span className="text-base font-bold text-teal-700">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}