// src/components/LabAssistants/modals/AddLabAssistantModal.jsx
import { useState, useEffect } from "react";
import ModalShell from "../../common/Modal/ModalShell";

const emptyForm = { name: "", email: "", phone: "", branch_id: "", status: "Active" };

export default function AddLabAssistantModal({ editingLabAssistant, branches, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = Boolean(editingLabAssistant);

  useEffect(() => {
    if (editingLabAssistant) {
      const matchedBranch = branches?.find((b) => b.name === editingLabAssistant.branch);

      setForm({
        name: editingLabAssistant.name,
        email: editingLabAssistant.email,
        phone: editingLabAssistant.phone,
        branch_id: matchedBranch?.id ?? "",
        status: editingLabAssistant.status,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingLabAssistant, branches]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear that field's error the moment the person starts fixing it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  // Mirrors StoreLabAssistantRequest's rules on the backend, so people get
  // instant feedback without waiting on a round trip — the backend still
  // re-validates everything and is the actual source of truth.
  function validate() {
    const next = {};

    if (!form.name.trim()) {
      next.name = "Full name is required.";
    }

    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }

    if (!form.phone.trim()) {
      next.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      next.phone = "Enter a valid 10-digit phone number.";
    }

    if (!form.branch_id) {
      next.branch_id = "Please select a branch.";
    }

    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        ...form,
        id: editingLabAssistant?.id,
      });
    } catch (err) {
      // Backend validation errors (e.g. "email already taken") arrive as
      // { errors: { email: ["..."] } } from Laravel — surface them under
      // the matching field instead of a generic failure message.
      if (err?.errors) {
        const backendErrors = {};
        for (const [field, messages] of Object.entries(err.errors)) {
          backendErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        }
        setErrors(backendErrors);
      } else {
        setErrors({ form: err?.message || "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
      errors[field]
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
    }`;

  return (
    <ModalShell title={isEditMode ? "Edit Lab Assistant" : "Add Lab Assistant"} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-6 py-5 space-y-4">
          {errors.form && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {errors.form}
            </p>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
            <input
              autoFocus={!isEditMode}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Lab assistant name"
              className={inputClass("name")}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="labassistant@lab.com"
              disabled={isEditMode}
              className={`${inputClass("email")} disabled:bg-gray-50 disabled:text-gray-400`}
            />
            {isEditMode && (
              <p className="text-xs text-gray-400 mt-1">Email can't be changed after account creation.</p>
            )}
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="10-digit number"
                className={inputClass("phone")}
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Branch</label>
              <select
                value={form.branch_id}
                onChange={(e) => handleChange("branch_id", e.target.value)}
                className={`${inputClass("branch_id")} cursor-pointer`}
              >
                <option value="">Select branch</option>
                {branches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branch_id && <p className="text-xs text-red-600 mt-1">{errors.branch_id}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className={`${inputClass("status")} cursor-pointer`}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
            {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status}</p>}
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
            disabled={submitting}
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer disabled:opacity-60"
          >
            {submitting ? "Saving…" : isEditMode ? "Save Changes" : "Add Lab Assistant"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}