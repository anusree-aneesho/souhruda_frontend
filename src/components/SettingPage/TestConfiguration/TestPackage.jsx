// src/components/SettingPage/TestConfiguration/TestPackage.jsx
import { useState, useEffect, useMemo } from "react";
import { FlaskConical, Loader2, Plus, Search } from "lucide-react";
import { getLabTests, getTestPackages, createTestPackage } from "../../../api/api";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500";

export default function TestPackage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getLabTests()
      .then((res) => {
        if (!cancelled) setTests(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingTests(false);
      });

    getTestPackages()
      .then((res) => {
        if (!cancelled) setPackages(res.data || []);
      })
      .catch(() => {
        // Existing-packages list is a nice-to-have; don't block test
        // selection if this call fails (e.g. permission not yet seeded).
      });

    return () => { cancelled = true; };
  }, []);

  const filteredTests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) => t.name.toLowerCase().includes(q));
  }, [tests, searchTerm]);

  const selectedCount = selectedIds.length;

  const totalTestsPrice = useMemo(() => {
    return tests
      .filter((t) => selectedIds.includes(t.id))
      .reduce((sum, t) => sum + Number(t.price || 0), 0);
  }, [tests, selectedIds]);

  function toggleTest(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  }

  function resetForm() {
    setName("");
    setPrice("");
    setSelectedIds([]);
    setSearchTerm("");
  }

  async function handleAdd() {
    setError("");

    if (!name.trim()) {
      setError("Package name is required.");
      return;
    }
    if (price === "" || Number.isNaN(Number(price)) || Number(price) < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Select at least one test for this package.");
      return;
    }

    setSaving(true);
    try {
      const res = await createTestPackage({
        name: name.trim(),
        price: Number(price),
        test_ids: selectedIds,
      });
      setPackages((prev) => [...prev, res.data]);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Package details */}
      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Package Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Full Body Checkup"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 1499"
              className={inputClass}
            />
          </div>
        </div>

        {/* Test selection */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
            <label className="block text-sm font-semibold text-gray-900">
              Select Tests
            </label>
            {selectedCount > 0 && (
              <span className="text-xs text-gray-500">
                {selectedCount} selected · tests total ₹{totalTestsPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tests..."
              className={`${inputClass} pl-9`}
            />
          </div>

          {loadingTests ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
              <Loader2 size={16} className="animate-spin" />
              Loading tests...
            </div>
          ) : tests.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              No tests found. Add tests under Test Master first.
            </p>
          ) : filteredTests.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              No tests match "{searchTerm}".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredTests.map((test) => {
                const isSelected = selectedIds.includes(test.id);
                return (
                  <label
                    key={test.id}
                    className={`flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-teal-500 bg-teal-50/60"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTest(test.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 truncate">
                        <FlaskConical size={13} className="text-teal-600 shrink-0" />
                        {test.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {test.unit ? `${test.unit} · ` : ""}₹{Number(test.price || 0).toFixed(2)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add
          </button>
        </div>
      </div>

      {/* Existing packages */}
      {packages.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Existing Packages</h3>
          <div className="space-y-2">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(pkg.lab_tests || []).length} test{(pkg.lab_tests || []).length === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  ₹{Number(pkg.price || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}