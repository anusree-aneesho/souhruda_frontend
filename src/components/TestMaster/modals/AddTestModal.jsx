// src/components/TestMaster/modals/AddTestModal.jsx
import { useState, useEffect } from "react";
import ModalShell from "../../common/Modal/ModalShell";
import { DEMOGRAPHIC_GROUPS } from "../../../data/demographicGroups";

const emptyDemographicRanges = DEMOGRAPHIC_GROUPS.reduce((acc, group) => {
  acc[group] = "";
  return acc;
}, {});

const emptyForm = {
  category: "",
  name: "",
  unit: "",
  price: "",
  criticalLow: "",
  criticalHigh: "",
  followupWeeks: "",
  criteria: "",
  demographicRanges: { ...emptyDemographicRanges },
};

export default function AddTestModal({ categories, defaultCategory, editingTest, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const isEditMode = Boolean(editingTest);

  useEffect(() => {
    if (editingTest) {
      setForm({
        category: editingTest.category,
        name: editingTest.name,
        unit: editingTest.unit,
        price: editingTest.price,
        criticalLow: editingTest.criticalLow ?? "",
        criticalHigh: editingTest.criticalHigh ?? "",
        followupWeeks: editingTest.followupWeeks ?? "",
        criteria: editingTest.criteria || "",
        demographicRanges: { ...emptyDemographicRanges, ...(editingTest.demographicRanges || {}) },
      });
    } else {
      setForm({ ...emptyForm, demographicRanges: { ...emptyDemographicRanges }, category: defaultCategory });
    }
  }, [editingTest, defaultCategory]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDemographicRangeChange(group, value) {
    setForm((prev) => ({
      ...prev,
      demographicRanges: { ...prev.demographicRanges, [group]: value },
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.category) return;
    onSave({
      ...form,
      price: parseFloat(form.price) || 0,
      criticalLow: form.criticalLow === "" ? null : parseFloat(form.criticalLow),
      criticalHigh: form.criticalHigh === "" ? null : parseFloat(form.criticalHigh),
      followupWeeks: form.followupWeeks === "" ? null : parseInt(form.followupWeeks, 10),
      id: editingTest?.id || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
    });
  }

  return (
    <ModalShell title={isEditMode ? "Edit Test" : "Add Test"} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Test Name</label>
            <input
              autoFocus={!isEditMode}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Vitamin D3"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Unit</label>
              <input
                value={form.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="mg/dl, ng/ml..."
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Price (₹)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Critical Low</label>
              <input
                type="number"
                step="any"
                value={form.criticalLow}
                onChange={(e) => handleChange("criticalLow", e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Critical High</label>
              <input
                type="number"
                step="any"
                value={form.criticalHigh}
                onChange={(e) => handleChange("criticalHigh", e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Follow-up (weeks)</label>
            <input
              type="number"
              min="0"
              value={form.followupWeeks}
              onChange={(e) => handleChange("followupWeeks", e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Test Criteria</label>
            <textarea
              value={form.criteria}
              onChange={(e) => handleChange("criteria", e.target.value)}
              rows={3}
              placeholder="Describe what this test checks for, prep instructions, or other notes..."
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="space-y-3 pt-1">
            <label className="block text-sm font-semibold text-gray-900">
              Range by Category / Demographic Group
            </label>
            {DEMOGRAPHIC_GROUPS.map((group) => (
              <div key={group}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{group}</label>
                <input
                  value={form.demographicRanges[group] || ""}
                  onChange={(e) => handleDemographicRangeChange(group, e.target.value)}
                  placeholder="e.g. 13.5 to 17.5 g/dL"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
          >
            {isEditMode ? "Save Changes" : "Add Test"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}