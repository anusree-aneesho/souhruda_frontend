import { useState, useEffect } from "react";
import ModalShell from "../../common/Modal/ModalShell";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  branch_id: "",
  status: "Active",
};

const emptyErrors = {
  name: "",
  email: "",
  phone: "",
  branch_id: "",
};

function validate(form, isEditMode) {
  const errors = { ...emptyErrors };

  if (!form.name.trim()) {
    errors.name = "Full name is required.";
  }

  if (!isEditMode) {
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
  }

  if (!form.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!/^\d{10}$/.test(form.phone.trim())) {
    errors.phone = "Enter a valid 10-digit phone number.";
  }

  if (!form.branch_id) {
    errors.branch_id = "Please select a branch.";
  }

  return errors;
}

function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}

export default function AddFrontOfficerModal({ editingFrontOfficer, branches, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const isEditMode = Boolean(editingFrontOfficer);

  useEffect(() => {
    if (editingFrontOfficer) {
      const matchedBranch = branches?.find((b) => b.name === editingFrontOfficer.branch);

      setForm({
        name: editingFrontOfficer.name,
        email: editingFrontOfficer.email,
        phone: editingFrontOfficer.phone,
        branch_id: matchedBranch?.id ?? editingFrontOfficer.branch_id ?? "",
        status: editingFrontOfficer.status,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors(emptyErrors);
  }, [editingFrontOfficer, branches]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return; // guard against a stray double-fire (e.g. double Enter)

    const nextErrors = validate(form, isEditMode);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSaving(true);
    setSubmitError("");
    try {
      await onSave({
        ...form,
        id: editingFrontOfficer?.id,
      });
      // On success the parent typically closes the modal itself (via onSave -> re-fetch -> onClose).
      // If yours doesn't, add onClose() here.
    } catch (err) {
      setSubmitError(err?.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const fieldClass = (field) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 disabled:bg-gray-50 disabled:text-gray-400 ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-red-400"
        : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
    }`;

  return (
    <ModalShell title={isEditMode ? "Edit Front Officer" : "Add Front Officer"} onClose={saving ? undefined : onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-6 py-5 space-y-4">
          {submitError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
            <input
              autoFocus={!isEditMode}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Front officer name"
              disabled={saving}
              className={fieldClass("name")}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="frontofficer@lab.com"
              disabled={isEditMode || saving}
              className={fieldClass("email")}
            />
            {isEditMode ? (
              <p className="text-xs text-gray-400 mt-1">Email can't be changed after account creation.</p>
            ) : (
              errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="10-digit number"
                disabled={saving}
                className={fieldClass("phone")}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Branch</label>
              <select
                value={form.branch_id}
                onChange={(e) => handleChange("branch_id", e.target.value)}
                disabled={saving}
                className={fieldClass("branch_id") + " cursor-pointer"}
              >
                <option value="">Select branch</option>
                {branches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branch_id && <p className="text-xs text-red-500 mt-1">{errors.branch_id}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : isEditMode ? "Save Changes" : "Add Front Officer"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}