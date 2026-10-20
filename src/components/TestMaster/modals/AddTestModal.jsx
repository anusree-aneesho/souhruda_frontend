// src/components/TestMaster/modals/AddTestModal.jsx
import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import ModalShell from "../../common/Modal/ModalShell";
import ConfirmModal from "../../Patients/modals/ConfirmModal";
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
  note: "",
  isActive: true,
  hasParameters: false,
  parameterIds: [],
  isParameter: false,
  groupIds: [],
  demographicRanges: { ...emptyDemographicRanges },
};

// A range entry must be one of: "70-100" (range), "<200" (max), ">40" (min),
// or free text like "Negative" (qualitative) — matches how the backend's
// range parser interprets range_raw.
const RANGE_FORMAT_REGEX = /^(-?\d+(\.\d+)?\s*-\s*-?\d+(\.\d+)?|[<>]\s*-?\d+(\.\d+)?|[A-Za-z][A-Za-z\s]*)$/;

let customRowIdCounter = 0;
function nextCustomRowId() {
  customRowIdCounter += 1;
  return customRowIdCounter;
}

// Any key in demographicRanges that isn't one of the fixed groups is a
// custom one someone added — pull those out so they can be edited as their
// own labeled rows instead of disappearing into the fixed list.
function extractCustomRows(demographicRanges) {
  return Object.entries(demographicRanges || {})
    .filter(([key]) => !DEMOGRAPHIC_GROUPS.includes(key))
    .map(([label, value]) => ({ id: nextCustomRowId(), label, value }));
}

function validate(form, customRows) {
  const errors = {};
  const demographicErrors = {};
  const customRowErrors = {};

  // A group test (e.g. CBC) is made of other tests, so it has no unit, critical
  // values or ranges of its own — only its parameters.
  const isGroup = form.hasParameters;

  if (isGroup && form.parameterIds.length === 0) {
    errors.parameters = "Select at least one parameter.";
  }

  if (form.isParameter && form.groupIds.length === 0) {
    errors.groups = "Select at least one test.";
  }

  if (!form.category) {
    errors.category = "Select a category.";
  }

  if (!form.name.trim()) {
    errors.name = "Test name is required.";
  } else if (form.name.trim().length > 150) {
    errors.name = "Must be 150 characters or fewer.";
  }

  if (!isGroup && form.unit && form.unit.length > 30) {
    errors.unit = "Must be 30 characters or fewer.";
  }

  if (form.price === "" || form.price === null) {
    errors.price = "Price is required.";
  } else {
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) {
      errors.price = "Must be a positive number.";
    } else if (price > 99999999.99) {
      errors.price = "That's too large a value.";
    }
  }

  const hasCriticalLow = !isGroup && form.criticalLow !== "";
  const hasCriticalHigh = !isGroup && form.criticalHigh !== "";
  const criticalLow = Number(form.criticalLow);
  const criticalHigh = Number(form.criticalHigh);

  if (hasCriticalLow && Number.isNaN(criticalLow)) {
    errors.criticalLow = "Must be a number.";
  }
  if (hasCriticalHigh && Number.isNaN(criticalHigh)) {
    errors.criticalHigh = "Must be a number.";
  }
  if (hasCriticalLow && hasCriticalHigh && !Number.isNaN(criticalLow) && !Number.isNaN(criticalHigh) && criticalLow >= criticalHigh) {
    errors.criticalHigh = "Must be greater than Critical Low.";
  }

  if (form.followupWeeks !== "") {
    const weeks = Number(form.followupWeeks);
    if (!Number.isInteger(weeks) || weeks < 0) {
      errors.followupWeeks = "Must be a whole number, 0 or more.";
    } else if (weeks > 32767) {
      errors.followupWeeks = "That's too large a value.";
    }
  }

  const filledFixedRanges = isGroup ? [] : Object.entries(form.demographicRanges).filter(([, v]) => v.trim() !== "");
  const filledCustomRows = isGroup ? [] : customRows.filter((row) => row.value.trim() !== "" || row.label.trim() !== "");

  if (!isGroup && filledFixedRanges.length === 0 && filledCustomRows.length === 0) {
    errors.demographicRanges = "Enter a range for at least one demographic group.";
  }

  filledFixedRanges.forEach(([group, value]) => {
    if (!RANGE_FORMAT_REGEX.test(value.trim())) {
      demographicErrors[group] = "Use a format like \"70-100\", \"<200\", \">40\", or \"Negative\".";
    }
  });

  const seenCustomLabels = new Set();
  filledCustomRows.forEach((row) => {
    const label = row.label.trim();
    const value = row.value.trim();
    if (!label) {
      customRowErrors[row.id] = "Give this group a name.";
      return;
    }
    if (DEMOGRAPHIC_GROUPS.includes(label) || seenCustomLabels.has(label.toLowerCase())) {
      customRowErrors[row.id] = "That group name is already used.";
      return;
    }
    seenCustomLabels.add(label.toLowerCase());
    if (!value) {
      customRowErrors[row.id] = "Enter a range for this group.";
    } else if (!RANGE_FORMAT_REGEX.test(value)) {
      customRowErrors[row.id] = "Use a format like \"70-100\", \"<200\", \">40\", or \"Negative\".";
    }
  });

  return { errors, demographicErrors, customRowErrors };
}

export default function AddTestModal({
  categories,
  defaultCategory,
  editingTest,
  onClose,
  onSave,
  allTests = [],            // [{ id, name, category, isGroup }] across every category
  groupIdsByTestId = {},    // { [testId]: [ids of the groups that include it] }
}) {
  const [form, setForm] = useState(emptyForm);
  const [customRows, setCustomRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [demographicErrors, setDemographicErrors] = useState({});
  const [customRowErrors, setCustomRowErrors] = useState({});
  const [confirmingRow, setConfirmingRow] = useState(null); // custom row | null
  const [parameterSearch, setParameterSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const isEditMode = Boolean(editingTest);

  useEffect(() => {
    if (editingTest) {
      const ranges = editingTest.demographicRanges || {};
      const fixedRanges = Object.fromEntries(
        Object.entries(ranges).filter(([key]) => DEMOGRAPHIC_GROUPS.includes(key))
      );
      setForm({
        category: editingTest.category,
        name: editingTest.name,
        unit: editingTest.unit,
        price: editingTest.price,
        criticalLow: editingTest.criticalLow ?? "",
        criticalHigh: editingTest.criticalHigh ?? "",
        followupWeeks: editingTest.followupWeeks ?? "",
        criteria: editingTest.criteria || "",
        note: editingTest.note || "",
        isActive: editingTest.isActive ?? true,
        hasParameters: (editingTest.parameterIds || []).length > 0,
        parameterIds: editingTest.parameterIds || [],
        isParameter: (groupIdsByTestId[editingTest.id] || []).length > 0,
        groupIds: groupIdsByTestId[editingTest.id] || [],
        demographicRanges: { ...emptyDemographicRanges, ...fixedRanges },
      });
      setCustomRows(extractCustomRows(ranges));
    } else {
      setForm({ ...emptyForm, category: defaultCategory || "", demographicRanges: { ...emptyDemographicRanges } });
      setCustomRows([]);
    }
    setErrors({});
    setDemographicErrors({});
    setCustomRowErrors({});
    setConfirmingRow(null);
    setParameterSearch("");
    setGroupSearch("");
  }, [editingTest, defaultCategory]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Clicking a test adds it to the end of the list, so the order picked is the
  // order the parameters are shown in.
  function handleToggleParameter(id) {
    setForm((prev) => ({
      ...prev,
      parameterIds: prev.parameterIds.includes(id)
        ? prev.parameterIds.filter((p) => p !== id)
        : [...prev.parameterIds, id],
    }));
    setErrors((prev) => ({ ...prev, parameters: undefined }));
  }

  function handleToggleGroup(id) {
    setForm((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(id)
        ? prev.groupIds.filter((g) => g !== id)
        : [...prev.groupIds, id],
    }));
    setErrors((prev) => ({ ...prev, groups: undefined }));
  }

  function handleDemographicRangeChange(group, value) {
    setForm((prev) => ({
      ...prev,
      demographicRanges: { ...prev.demographicRanges, [group]: value },
    }));
    setErrors((prev) => ({ ...prev, demographicRanges: undefined }));
    setDemographicErrors((prev) => ({ ...prev, [group]: undefined }));
  }

  function handleAddCustomRow() {
    setCustomRows((prev) => [...prev, { id: nextCustomRowId(), label: "", value: "" }]);
  }

  function handleCustomRowChange(id, field, value) {
    setCustomRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    setErrors((prev) => ({ ...prev, demographicRanges: undefined }));
    setCustomRowErrors((prev) => ({ ...prev, [id]: undefined }));
  }

  // Clicking the X only opens the styled confirm popup.
  function handleRemoveCustomRow(id, label) {
    setConfirmingRow({ id, label });
  }

  // Runs when the user clicks "Delete" in the popup.
  function confirmRemoveCustomRow() {
    const { id } = confirmingRow;
    setConfirmingRow(null);
    setCustomRows((prev) => prev.filter((row) => row.id !== id));
    setCustomRowErrors((prev) => ({ ...prev, [id]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const { errors: validationErrors, demographicErrors: validationDemographicErrors, customRowErrors: validationCustomRowErrors } =
      validate(form, customRows);
    setErrors(validationErrors);
    setDemographicErrors(validationDemographicErrors);
    setCustomRowErrors(validationCustomRowErrors);
    if (
      Object.keys(validationErrors).length > 0 ||
      Object.keys(validationDemographicErrors).length > 0 ||
      Object.keys(validationCustomRowErrors).length > 0
    ) {
      return;
    }

    // Merge fixed + custom groups into one flat object — the backend
    // already stores this as a single key-value structure, so it doesn't
    // need to know which keys are "built-in" vs custom.
    const mergedDemographicRanges = { ...form.demographicRanges };
    customRows.forEach((row) => {
      const label = row.label.trim();
      const value = row.value.trim();
      if (label && value) {
        mergedDemographicRanges[label] = value;
      }
    });

    onSave({
      ...form,
      demographicRanges: form.hasParameters ? {} : mergedDemographicRanges,
      unit: form.hasParameters ? "" : form.unit,
      parameterIds: form.hasParameters ? form.parameterIds : [],
      groupIds: form.isParameter ? form.groupIds : [],
      price: parseFloat(form.price) || 0,
      criticalLow: form.hasParameters || form.criticalLow === "" ? null : parseFloat(form.criticalLow),
      criticalHigh: form.hasParameters || form.criticalHigh === "" ? null : parseFloat(form.criticalHigh),
      followupWeeks: form.followupWeeks === "" ? null : parseInt(form.followupWeeks, 10),
      note: form.note.trim() === "" ? null : form.note.trim(),
      id: editingTest?.id || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
    });
  }

  const inputClass = (hasError) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
      hasError ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
    }`;

  // Tests that can be picked as parameters: not the test itself, and not a group
  // (groups are one level deep). Already-picked ones always stay visible.
  const parameterSearchText = parameterSearch.trim().toLowerCase();
  const parameterCandidates = allTests
    .filter((t) => {
      if (editingTest && t.id === editingTest.id) return false;
      if (t.isGroup && !form.parameterIds.includes(t.id)) return false;
      return t.name.toLowerCase().includes(parameterSearchText);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Tests that can be chosen as "the test this parameter belongs to": only tests
  // that already have parameters, and never the test being edited.
  const groupSearchText = groupSearch.trim().toLowerCase();
  const groupCandidates = allTests
    .filter((t) => {
      if (editingTest && t.id === editingTest.id) return false;
      if (!t.isGroup && !form.groupIds.includes(t.id)) return false;
      return t.name.toLowerCase().includes(groupSearchText);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <ModalShell title={isEditMode ? "Edit Test" : "Add Test"} onClose={onClose} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Row 1: Category + Test Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className={inputClass(errors.category)}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Test Name</label>
                <input
                  autoFocus={!isEditMode}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Vitamin D3"
                  className={inputClass(errors.name)}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
            </div>

            {/* Group toggles: this test has parameters  /  this test is a parameter of another test */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center gap-2.5 ${form.isParameter ? "opacity-50" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={form.hasParameters}
                    disabled={form.isParameter}
                    onChange={(e) => {
                      handleChange("hasParameters", e.target.checked);
                      setErrors((prev) => ({ ...prev, parameters: undefined }));
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-semibold text-gray-900">This test has parameters</span>
                </label>

                <label className={`flex items-center gap-2.5 ${form.hasParameters ? "opacity-50" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={form.isParameter}
                    disabled={form.hasParameters}
                    onChange={(e) => {
                      handleChange("isParameter", e.target.checked);
                      setErrors((prev) => ({ ...prev, groups: undefined }));
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-semibold text-gray-900">This parameter is included in a test</span>
                </label>
              </div>

              {form.isParameter && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">Included in</p>
                    <p className="text-xs text-gray-500">{form.groupIds.length} selected</p>
                  </div>
                  <input
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Search tests..."
                    className={inputClass(false)}
                  />
                  <div
                    className={`max-h-48 overflow-y-auto rounded-lg border bg-white divide-y divide-gray-100 ${
                      errors.groups ? "border-red-300" : "border-gray-200"
                    }`}
                  >
                    {groupCandidates.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No tests with parameters found.</p>
                    )}
                    {groupCandidates.map((t) => (
                      <label key={t.id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={form.groupIds.includes(t.id)}
                          onChange={() => handleToggleGroup(t.id)}
                          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span className="flex-1 text-gray-900">{t.name}</span>
                        <span className="text-xs text-gray-400">{t.category}</span>
                      </label>
                    ))}
                  </div>
                  {errors.groups && <p className="text-xs text-red-500">{errors.groups}</p>}
                </div>
              )}

              {form.hasParameters && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">Parameters</p>
                    <p className="text-xs text-gray-500">
                      {form.parameterIds.length} selected · shown in the order you pick them
                    </p>
                  </div>
                  <input
                    value={parameterSearch}
                    onChange={(e) => setParameterSearch(e.target.value)}
                    placeholder="Search tests..."
                    className={inputClass(false)}
                  />
                  <div
                    className={`max-h-48 overflow-y-auto rounded-lg border bg-white divide-y divide-gray-100 ${
                      errors.parameters ? "border-red-300" : "border-gray-200"
                    }`}
                  >
                    {parameterCandidates.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No tests found.</p>
                    )}
                    {parameterCandidates.map((t) => (
                      <label key={t.id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={form.parameterIds.includes(t.id)}
                          onChange={() => handleToggleParameter(t.id)}
                          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span className="flex-1 text-gray-900">{t.name}</span>
                        <span className="text-xs text-gray-400">{t.category}</span>
                      </label>
                    ))}
                  </div>
                  {errors.parameters && <p className="text-xs text-red-500">{errors.parameters}</p>}
                </div>
              )}
            </div>

            {/* Row 2: Unit + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className={form.hasParameters ? "hidden" : ""}>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Unit</label>
                <input
                  value={form.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  placeholder="mg/dl, ng/ml..."
                  className={inputClass(errors.unit)}
                />
                {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="0"
                  className={inputClass(errors.price)}
                />
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
            </div>

            {/* Row 3: Critical Low + Critical High */}
            <div className={form.hasParameters ? "hidden" : "grid grid-cols-2 gap-4"}>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Critical Low</label>
                <input
                  type="number"
                  step="any"
                  value={form.criticalLow}
                  onChange={(e) => handleChange("criticalLow", e.target.value)}
                  placeholder="Optional"
                  className={inputClass(errors.criticalLow)}
                />
                {errors.criticalLow && <p className="text-xs text-red-500 mt-1">{errors.criticalLow}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Critical High</label>
                <input
                  type="number"
                  step="any"
                  value={form.criticalHigh}
                  onChange={(e) => handleChange("criticalHigh", e.target.value)}
                  placeholder="Optional"
                  className={inputClass(errors.criticalHigh)}
                />
                {errors.criticalHigh && <p className="text-xs text-red-500 mt-1">{errors.criticalHigh}</p>}
              </div>
            </div>

            {/* Row 4: Follow-up + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Follow-up (weeks)</label>
                <input
                  type="number"
                  min="0"
                  value={form.followupWeeks}
                  onChange={(e) => handleChange("followupWeeks", e.target.value)}
                  placeholder="Optional"
                  className={inputClass(errors.followupWeeks)}
                />
                {errors.followupWeeks && <p className="text-xs text-red-500 mt-1">{errors.followupWeeks}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Status</label>
                <select
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) => handleChange("isActive", e.target.value === "active")}
                  className={inputClass(false)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Row 5: Test Criteria + Note */}
            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Note</label>
                <textarea
                  value={form.note}
                  onChange={(e) => handleChange("note", e.target.value)}
                  rows={3}
                  placeholder="Add any details related to the ranges."
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            {/* Demographic ranges: two boxes per row */}
            <div className={form.hasParameters ? "hidden" : "space-y-3 pt-1"}>
              <label className="block text-sm font-semibold text-gray-900">
                Range by Category / Demographic Group
              </label>
              {errors.demographicRanges && <p className="text-xs text-red-500">{errors.demographicRanges}</p>}

              <div className="grid grid-cols-2 gap-4">
                {DEMOGRAPHIC_GROUPS.map((group) => (
                  <div key={group}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{group}</label>
                    <input
                      value={form.demographicRanges[group] || ""}
                      onChange={(e) => handleDemographicRangeChange(group, e.target.value)}
                      placeholder="e.g. 70-100, <200, or Negative"
                      className={inputClass(demographicErrors[group])}
                    />
                    {demographicErrors[group] && <p className="text-xs text-red-500 mt-1">{demographicErrors[group]}</p>}
                  </div>
                ))}

                {/* Custom, user-defined groups beyond the fixed list above.
                    Stored in the same demographicRanges object as everything
                    else — the backend doesn't need to distinguish them. */}
                {customRows.map((row) => (
                  <div key={row.id} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <input
                        value={row.label}
                        onChange={(e) => handleCustomRowChange(row.id, "label", e.target.value)}
                        placeholder="Group name, e.g. Pregnant Women"
                        className={`${inputClass(customRowErrors[row.id])} text-xs font-medium`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomRow(row.id, row.label)}
                        className="shrink-0 text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                        aria-label="Remove this custom group"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <input
                      value={row.value}
                      onChange={(e) => handleCustomRowChange(row.id, "value", e.target.value)}
                      placeholder="e.g. 70-100, <200, or Negative"
                      className={inputClass(customRowErrors[row.id])}
                    />
                    {customRowErrors[row.id] && <p className="text-xs text-red-500">{customRowErrors[row.id]}</p>}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddCustomRow}
                className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 cursor-pointer"
              >
                <Plus size={16} /> Add custom group
              </button>
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

      {confirmingRow && (
        <ConfirmModal
          title="Delete Custom Group"
          message={`Delete "${confirmingRow.label?.trim() || "this custom group"}"? This range will be permanently removed when you save.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmRemoveCustomRow}
          onClose={() => setConfirmingRow(null)}
        />
      )}
    </>
  );
}