// src/components/HomeCollection/DetailModal/TestsList.jsx
//
// Same layout as the booking "Confirm" step: each applied package is one
// row (package name + price, its tests listed underneath), and every test not
// covered by a package is its own row at its individual price.

function groupByPackage(tests) {
  const packageGroups = [];
  const byId = new Map();
  const individualTests = [];

  for (const test of tests) {
    if (test.test_package_id != null) {
      let group = byId.get(test.test_package_id);
      if (!group) {
        group = {
          id: test.test_package_id,
          name: test.package_name || "Package",
          price: Number(test.package_price) || 0,
          tests: [],
        };
        byId.set(test.test_package_id, group);
        packageGroups.push(group);
      }
      group.tests.push(test);
    } else {
      individualTests.push(test);
    }
  }

  return { packageGroups, individualTests };
}

export default function TestsList({ tests, total, collectionCharge = 0, grandTotal }) {
  const { packageGroups, individualTests } = groupByPackage(tests);

  // `total` comes from the backend and is already package-aware. Fallback only
  // covers a stale response that predates it.
  const fallbackTotal =
    packageGroups.reduce((sum, p) => sum + p.price, 0) +
    individualTests.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const testsTotal = total != null ? Number(total) : fallbackTotal;
  const payable = grandTotal != null ? Number(grandTotal) : testsTotal + collectionCharge;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 mb-2">Tests ({tests.length})</p>

      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
        <span className="text-xs font-medium text-gray-400 tracking-wide">TEST</span>
        <span className="text-xs font-medium text-gray-400 tracking-wide">PRICE</span>
      </div>

      {packageGroups.map((pkg) => (
        <div key={`pkg-${pkg.id}`} className="py-2 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              {pkg.name} <span className="text-xs text-gray-400 font-normal">(package)</span>
            </span>
            <span className="text-sm text-gray-700">₹{pkg.price.toFixed(2)}</span>
          </div>
          <p className="pl-3.5 text-xs text-gray-400 mt-0.5">
            {pkg.tests.map((t) => t.name).join(", ")}
          </p>
        </div>
      ))}

      {individualTests.map((test) => (
        <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-50">
          <span className="flex items-center gap-2 text-sm text-gray-900">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            {test.name}
          </span>
          <span className="text-sm text-gray-700">₹{Number(test.price).toFixed(2)}</span>
        </div>
      ))}

      <div className="space-y-1 pt-3">
        <div className="flex items-center justify-between px-4 text-sm text-gray-500">
          <span>Tests total</span>
          <span className="text-gray-900">₹{testsTotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between px-4 text-sm text-gray-500">
          <span>Home visit fee</span>
          <span className="text-gray-900">₹{Number(collectionCharge).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between bg-teal-50 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-teal-700">Total payable</span>
          <span className="text-base font-bold text-teal-700">₹{payable.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}