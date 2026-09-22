// src/components/SettingPage/TestConfiguration/TestPackage.jsx
import { useState, useEffect } from "react";
import { FlaskConical, Loader2, Package2, Pencil, Plus } from "lucide-react";
import { getLabTests, getTestPackages } from "../../../api/api";
import AddPackageModal from "./modals/AddPackageModal";

function PackageCard({ pkg, onEdit }) {
  const labTests = pkg.lab_tests || [];

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 hover:border-teal-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all">
      <button
        onClick={() => onEdit(pkg)}
        title="Edit package"
        className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 bg-white border border-gray-200 opacity-0 group-hover:opacity-100 hover:text-teal-600 hover:border-teal-300 transition-all cursor-pointer"
      >
        <Pencil size={14} />
      </button>

      <div className="flex items-start justify-between mb-3 pr-9">
        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
          <Package2 size={18} className="text-teal-600" />
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            pkg.is_active
              ? "bg-teal-50 text-teal-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {pkg.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 truncate" title={pkg.name}>
        {pkg.name}
      </h3>
      <p className="text-2xl font-bold text-teal-700 mt-1">
        ₹{Number(pkg.price || 0).toFixed(2)}
      </p>

      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 mb-2">
        <FlaskConical size={12} />
        {labTests.length} test{labTests.length === 1 ? "" : "s"} included
      </div>

      <div className="flex flex-wrap gap-1.5">
        {labTests.length === 0 ? (
          <span className="text-xs text-gray-400">No tests linked</span>
        ) : (
          labTests.map((t) => (
            <span
              key={t.id}
              className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-xs text-gray-600"
            >
              {t.name}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

export default function TestPackage() {
  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getLabTests()
      .then((res) => {
        if (!cancelled) setTests(res.data || []);
      })
      .catch(() => {
        // Handled inside the Add Package modal if it turns out empty.
      });

    getTestPackages()
      .then((res) => {
        if (!cancelled) setPackages(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingPackages(false);
      });

    return () => { cancelled = true; };
  }, []);

  function handleSaved(savedPackage) {
    setPackages((prev) => {
      const exists = prev.some((p) => p.id === savedPackage.id);
      return exists
        ? prev.map((p) => (p.id === savedPackage.id ? savedPackage : p))
        : [...prev, savedPackage];
    });
    setShowAddModal(false);
    setEditingPackage(null);
  }

  function closeModal() {
    setShowAddModal(false);
    setEditingPackage(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Existing Packages</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {packages.length} package{packages.length === 1 ? "" : "s"} configured
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add Package
        </button>
      </div>

      {loadingPackages ? (
        <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" />
          Loading packages...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-sm text-red-500 py-6 text-center">{error}</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col items-center text-center py-12">
          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mb-4">
            <Package2 size={22} className="text-teal-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No packages yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Click "Add Package" to bundle tests together under a single price.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} onEdit={setEditingPackage} />
          ))}
        </div>
      )}

      {(showAddModal || editingPackage) && (
        <AddPackageModal
          tests={tests}
          editingPackage={editingPackage}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}