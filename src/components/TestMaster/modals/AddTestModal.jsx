// src/components/TestMaster/modals/AddTestModal.jsx
import { useState, useEffect } from "react";
import { X, Plus, Globe, Users, Calendar } from "lucide-react";
import ModalShell from "../../common/Modal/ModalShell";
import ConfirmModal from "../../Patients/modals/ConfirmModal";
import { AGE_GROUP_PRESETS, AGE_UNITS, GENDERS } from "../../../data/demographicGroups";
import {
  buildRanges,
  defaultAgeGroups,
  emptyRangeState,
  formatAgeRange,
  groupFromPreset,
  newCustomGroup,
  rangeStateFromApi,
  validateRanges,
} from "../../../utils/rangeUtils";

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
};

const MODE_TABS = [
  {
    value: "general",
    label: "General (All)",
    icon: Globe,
    help: "One range for all patients, regardless of age or gender.",
  },
  {
    value: "gender",
    label: "Gender Based",
    icon: Users,
    help: "A different range for each gender. Use this when the range varies by gender but not by age.",
  },
  {
    value: "age_gender",
    label: "Age & Gender Based",
    icon: Calendar,
    help: "Define age groups. Each group has one range, and you can optionally split it by gender.",
  },
];

function validate(form) {
  const errors = {};

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

  return errors;
}

// Number + unit pair used for the From / Up to age inputs of a custom group.
function AgeBoundInput({ label, bound, onChange, hasError }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          value={bound.value}
          onChange={(e) => onChange({ ...bound, value: e.target.value })}
          placeholder="e.g. 18"
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 ${
            hasError ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
          }`}
        />
        <select
          value={bound.unit}
          onChange={(e) => onChange({ ...bound, unit: e.target.value })}
          className="rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        >
          {AGE_UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
    </div>
  );
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
  const [rs, setRs] = useState(emptyRangeState()); // range mode + values for all three tabs
  const [errors, setErrors] = useState({});
  const [rangeErrors, setRangeErrors] = useState({});
  const [confirmingGroup, setConfirmingGroup] = useState(null); // age group | null
  const [parameterSearch, setParameterSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
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
        note: editingTest.note || "",
        isActive: editingTest.isActive ?? true,
        hasParameters: (editingTest.parameterIds || []).length > 0,
        parameterIds: editingTest.parameterIds || [],
        isParameter: (groupIdsByTestId[editingTest.id] || []).length > 0,
        groupIds: groupIdsByTestId[editingTest.id] || [],
      });
      // editingTest.rangeMode / editingTest.ranges are the API values, as returned.
      setRs(rangeStateFromApi(editingTest.rangeMode, editingTest.ranges || []));
    } else {
      setForm({ ...emptyForm, category: defaultCategory || "" });
      setRs(emptyRangeState());
    }
    setErrors({});
    setRangeErrors({});
    setConfirmingGroup(null);
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

  // ── Range handlers ────────────────────────────────────────────────────────

  function changeRs(patch) {
    setRs((prev) => ({ ...prev, ...patch }));
    setRangeErrors({});
  }

  function handleSetMode(mode) {
    setRs((prev) => ({ ...prev, mode }));
    setRangeErrors({});
  }

  function handleGenderRangeChange(gender, value) {
    setRs((prev) => ({ ...prev, genders: { ...prev.genders, [gender]: value } }));
    setRangeErrors({});
  }

  function updateGroup(id, patch) {
    setRs((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
    setRangeErrors({});
  }

  function updateGroupGender(id, gender, value) {
    setRs((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === id ? { ...g, genders: { ...g.genders, [gender]: value } } : g
      ),
    }));
    setRangeErrors({});
  }

  // Splitting starts both genders off with the range already typed for the group.
  function handleSplitGroup(g) {
    updateGroup(g.id, {
      split: true,
      genders: {
        ...g.genders,
        male: g.genders.male || g.range,
        female: g.genders.female || g.range,
      },
    });
  }

  function handleUnsplitGroup(g) {
    updateGroup(g.id, { split: false, range: g.range || g.genders.male || g.genders.female || "" });
  }

  function handleAddGroup(value) {
    if (!value) return;

    const group =
      value === "__custom"
        ? newCustomGroup()
        : groupFromPreset(AGE_GROUP_PRESETS.find((p) => p.label === value));

    setRs((prev) => ({ ...prev, groups: [...prev.groups, group] }));
    setRangeErrors({});
  }

  function groupHasData(g) {
    return g.range.trim() !== "" || GENDERS.some((x) => g.genders[x.value].trim() !== "");
  }

  function handleRemoveGroup(g) {
    if (groupHasData(g)) {
      setConfirmingGroup(g);
      return;
    }
    removeGroup(g.id);
  }

  function removeGroup(id) {
    setRs((prev) => ({ ...prev, groups: prev.groups.filter((g) => g.id !== id) }));
    setRangeErrors({});
  }

  function confirmRemoveGroup() {
    removeGroup(confirmingGroup.id);
    setConfirmingGroup(null);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate(form);
    const validationRangeErrors = form.hasParameters ? {} : validateRanges(rs);

    setErrors(validationErrors);
    setRangeErrors(validationRangeErrors);

    if (Object.keys(validationErrors).length > 0 || Object.keys(validationRangeErrors).length > 0) {
      return;
    }

    // Only the active tab's ranges are saved; the other tabs are ignored.
    onSave({
      ...form,
      rangeMode: form.hasParameters ? "general" : rs.mode,
      ranges: form.hasParameters ? [] : buildRanges(rs),
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

  const activeTab = MODE_TABS.find((t) => t.value === rs.mode) || MODE_TABS[0];
  const unusedPresets = AGE_GROUP_PRESETS.filter((p) => !rs.groups.some((g) => g.label === p.label));

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

            {/* Reference ranges: General / Gender / Age & Gender */}
            <div className={form.hasParameters ? "hidden" : "space-y-3 pt-1"}>
              <div>
                <label className="block text-sm font-semibold text-gray-900">Reference Ranges</label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set one range for everyone, or different ranges by gender and/or age. The unit is the one entered above.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MODE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const selected = rs.mode === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => handleSetMode(tab.value)}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium cursor-pointer ${
                        selected
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="rounded-lg bg-teal-50/60 px-3 py-2 text-xs text-teal-800">{activeTab.help}</p>

              {rangeErrors.summary && <p className="text-xs text-red-500">{rangeErrors.summary}</p>}

              {/* General */}
              {rs.mode === "general" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Range</label>
                  <input
                    value={rs.general}
                    onChange={(e) => changeRs({ general: e.target.value })}
                    placeholder="e.g. 70-100, <200, or Negative"
                    className={inputClass(rangeErrors.general)}
                  />
                  {rangeErrors.general && <p className="text-xs text-red-500 mt-1">{rangeErrors.general}</p>}
                </div>
              )}

              {/* Gender based */}
              {rs.mode === "gender" && (
                <div className="grid grid-cols-2 gap-4">
                  {GENDERS.map((g) => (
                    <div key={g.value}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {g.label}
                        {g.optional && <span className="text-gray-400"> (optional)</span>}
                      </label>
                      <input
                        value={rs.genders[g.value]}
                        onChange={(e) => handleGenderRangeChange(g.value, e.target.value)}
                        placeholder="e.g. 70-100, <200, or Negative"
                        className={inputClass(rangeErrors[`gender.${g.value}`])}
                      />
                      {rangeErrors[`gender.${g.value}`] && (
                        <p className="text-xs text-red-500 mt-1">{rangeErrors[`gender.${g.value}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Age & gender based */}
              {rs.mode === "age_gender" && (
                <div className="space-y-3">
                  {rs.groups.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">No age groups yet. Add one below.</p>
                  )}

                  {rs.groups.map((g) => {
                    const groupKey = `group.${g.id}`;
                    const ageText = g.special ? "" : formatAgeRange(g.min, g.max);

                    return (
                      <div key={g.id} className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          {g.custom ? (
                            <div className="flex-1 space-y-2">
                              <input
                                value={g.label}
                                onChange={(e) => updateGroup(g.id, { label: e.target.value })}
                                placeholder="Group name, e.g. Toddlers"
                                maxLength={30}
                                className={`${inputClass(rangeErrors[groupKey])} font-medium`}
                              />
                              {!g.special && (
                                <>
                                  <div className="grid grid-cols-2 gap-3">
                                    <AgeBoundInput
                                      label="From age"
                                      bound={g.min}
                                      onChange={(min) => updateGroup(g.id, { min })}
                                      hasError={Boolean(rangeErrors[groupKey])}
                                    />
                                    <AgeBoundInput
                                      label="Up to age (not included, empty = no limit)"
                                      bound={g.max}
                                      onChange={(max) => updateGroup(g.id, { max })}
                                      hasError={Boolean(rangeErrors[groupKey])}
                                    />
                                  </div>
                                  {ageText && <p className="text-xs text-gray-500">Covers: {ageText}</p>}
                                </>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{g.label}</p>
                              {ageText && <p className="text-xs text-gray-500">{ageText}</p>}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveGroup(g)}
                            className="shrink-0 text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            aria-label={`Remove ${g.label || "this age group"}`}
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {rangeErrors[groupKey] && <p className="text-xs text-red-500">{rangeErrors[groupKey]}</p>}

                        {!g.split ? (
                          <div>
                            <div className="flex items-center gap-3">
                              <input
                                value={g.range}
                                onChange={(e) => updateGroup(g.id, { range: e.target.value })}
                                placeholder="e.g. 70-100, <200, or Negative"
                                className={inputClass(rangeErrors[`${groupKey}.range`])}
                              />
                              {!g.special && (
                                <button
                                  type="button"
                                  onClick={() => handleSplitGroup(g)}
                                  className="shrink-0 text-xs font-medium text-teal-600 hover:text-teal-700 cursor-pointer whitespace-nowrap"
                                >
                                  Split by gender
                                </button>
                              )}
                            </div>
                            {rangeErrors[`${groupKey}.range`] && (
                              <p className="text-xs text-red-500 mt-1">{rangeErrors[`${groupKey}.range`]}</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-3">
                              {GENDERS.map((x) => (
                                <div key={x.value}>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {x.label}
                                    {x.optional && <span className="text-gray-400"> (optional)</span>}
                                  </label>
                                  <input
                                    value={g.genders[x.value]}
                                    onChange={(e) => updateGroupGender(g.id, x.value, e.target.value)}
                                    placeholder="e.g. 70-100"
                                    className={inputClass(rangeErrors[`${groupKey}.gender.${x.value}`])}
                                  />
                                  {rangeErrors[`${groupKey}.gender.${x.value}`] && (
                                    <p className="text-xs text-red-500 mt-1">
                                      {rangeErrors[`${groupKey}.gender.${x.value}`]}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                            {rangeErrors[`${groupKey}.range`] && (
                              <p className="text-xs text-red-500">{rangeErrors[`${groupKey}.range`]}</p>
                            )}
                            <button
                              type="button"
                              onClick={() => handleUnsplitGroup(g)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
                            >
                              Remove gender split
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-2">
                    <Plus size={16} className="text-teal-600" />
                    <select
                      value=""
                      onChange={(e) => handleAddGroup(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-teal-600 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="">Add age group</option>
                      {unusedPresets.map((p) => (
                        <option key={p.label} value={p.label}>
                          {p.label}{p.hint ? ` (${p.hint})` : ""}
                        </option>
                      ))}
                      <option value="__custom">Custom group…</option>
                    </select>
                  </div>
                </div>
              )}
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

      {confirmingGroup && (
        <ConfirmModal
          title="Remove Age Group"
          message={`Remove "${confirmingGroup.label?.trim() || "this age group"}"? Its range will be permanently removed when you save.`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmRemoveGroup}
          onClose={() => setConfirmingGroup(null)}
        />
      )}
    </>
  );
}