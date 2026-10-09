import { useState, useEffect } from "react";
import FormField from "./SettingsForm/FormField";
import Toast from "../common/Toast/Toast";
import { useToast } from "../common/Toast/useToast";
import { getGstSettingsApi, updateGstSettingsApi, getAllBranchesGstApi } from "../../api/api";
import { useAuth } from "../../Context/AuthContext";

function validate(formData) {
  const errors = {};
  if (formData.isGstRegistered) {
    if (!formData.gstin.trim()) {
      errors.gstin = "GSTIN is required.";
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin.toUpperCase())) {
      errors.gstin = "Enter a valid 15-character GSTIN (e.g. 32AAAAA0000A1Z5).";
    }
    if (!formData.legalBusinessName.trim()) errors.legalBusinessName = "Legal business name is required.";
  }
  if (formData.gstRate !== "" && (Number(formData.gstRate) < 0 || Number(formData.gstRate) > 100)) {
    errors.gstRate = "GST rate must be between 0 and 100.";
  }
  if (formData.stateCode && !/^\d{1,2}$/.test(formData.stateCode)) {
    errors.stateCode = "State code should be 1–2 digits (e.g. 32 for Kerala).";
  }
  return errors;
}

function GstForm({ branchId = null, branchName = "", onBack, onSaved }) {
  const [formData, setFormData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();

  const role = String(user?.role ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  const canEdit = ["admin", "super_admin", "superadmin"].includes(role);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setFieldErrors({});

    async function load() {
      try {
        const res = await getGstSettingsApi(branchId);
        if (cancelled) return;
        const s = res.data;
        setFormData({
          isGstRegistered: s.is_gst_registered ?? false,
          gstin: s.gstin || "",
          legalBusinessName: s.legal_business_name || "",
          gstRate: s.gst_rate ?? "",
          sacCode: s.sac_code || "",
          state: s.state || "",
          stateCode: s.state_code || "",
          invoicePrefix: s.invoice_prefix || "",
        });
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load GST settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleToggle(e) {
    setFormData((prev) => ({ ...prev, isGstRegistered: e.target.checked }));
    setFieldErrors({});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canEdit) return;

    setError("");

    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors below before saving.");
      return;
    }
    setFieldErrors({});
    setSaving(true);

    try {
      await updateGstSettingsApi({
        is_gst_registered: formData.isGstRegistered,
        gstin: formData.gstin.toUpperCase(),
        legal_business_name: formData.legalBusinessName,
        gst_rate: Number(formData.gstRate) || 0,
        sac_code: formData.sacCode,
        state: formData.state,
        state_code: formData.stateCode,
        invoice_prefix: formData.invoicePrefix,
      }, branchId);
      showToast("GST settings saved successfully.");
      onSaved?.();
    } catch (err) {
      setError(err.message || "Failed to save GST settings.");
    } finally {
      setSaving(false);
    }
  }

  const heading = (
    <div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-teal-600 font-medium hover:underline cursor-pointer mb-2"
        >
          ← All branches
        </button>
      )}
      <h1 className="text-2xl font-bold text-gray-900">GST Settings</h1>
      <p className="text-sm text-gray-500 mt-1">
        {branchName
          ? `GST registration and invoicing details for ${branchName}.`
          : "GST registration and invoicing details for this branch."}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {heading}
        <p className="text-sm text-gray-500">Loading GST settings...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="space-y-6">
        {heading}
        <p className="text-sm text-red-500">{error || "Unable to load GST settings."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {heading}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] max-w-2xl space-y-5"
      >
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

        <fieldset
          disabled={!canEdit}
          className={`space-y-5 min-w-0 border-0 p-0 m-0 ${!canEdit ? "opacity-70" : ""}`}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="gst-registered"
              checked={formData.isGstRegistered}
              onChange={handleToggle}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="gst-registered" className="text-sm font-medium text-gray-900">
              This branch is GST-registered
            </label>
          </div>

          {formData.isGstRegistered && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  label="GSTIN"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="15-digit GSTIN (e.g. 32AAAAA0000A1Z5)"
                  error={fieldErrors.gstin}
                />
                <FormField
                  label="Legal Business Name"
                  name="legalBusinessName"
                  value={formData.legalBusinessName}
                  onChange={handleChange}
                  placeholder="e.g. Souhruda Diagnostics Pvt Ltd"
                  error={fieldErrors.legalBusinessName}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <FormField
                  label="GST Rate (%)"
                  name="gstRate"
                  type="number"
                  value={formData.gstRate}
                  onChange={handleChange}
                  placeholder="e.g. 18"
                  error={fieldErrors.gstRate}
                />
                <FormField
                  label="SAC Code"
                  name="sacCode"
                  value={formData.sacCode}
                  onChange={handleChange}
                  placeholder="e.g. 999316"
                />
                <FormField
                  label="Invoice Prefix"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleChange}
                  placeholder="e.g. INV"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Kerala"
                />
                <FormField
                  label="State Code"
                  name="stateCode"
                  value={formData.stateCode}
                  onChange={handleChange}
                  placeholder="e.g. 32 for Kerala"
                  error={fieldErrors.stateCode}
                />
              </div>
            </>
          )}

          {canEdit && (
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save GST Settings"}
            </button>
          )}

        </fieldset>
      </form>
    </div>
  );
}

function GstBadge({ registered }) {
  return registered ? (
    <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
      Registered
    </span>
  ) : (
    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
      Not registered
    </span>
  );
}

// Super admin view: every branch's GST details, with Edit per branch.
function AllBranchesGst() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // { id, name }

  async function loadRows() {
    setLoading(true);
    try {
      const res = await getAllBranchesGstApi();
      setRows(res.data || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  if (editing) {
    return (
      <GstForm
        branchId={editing.id}
        branchName={editing.name}
        onBack={() => setEditing(null)}
        onSaved={loadRows}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GST Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          GST registration and invoicing details of every branch.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-500 p-6">Loading branches...</p>
        ) : error ? (
          <p className="text-sm text-red-600 p-6">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500 p-6">No branches added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-medium text-gray-400 tracking-wide uppercase">
                  <th className="px-6 py-3">Branch</th>
                  <th className="px-4 py-3">GST status</th>
                  <th className="px-4 py-3">GSTIN</th>
                  <th className="px-4 py-3">Legal name</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.branch_id} className="border-t border-gray-100 text-sm hover:bg-teal-50/40">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {b.branch_name}
                      {!b.is_active && (
                        <span className="ml-2 text-xs font-normal text-gray-400">(inactive)</span>
                      )}
                    </td>
                    <td className="px-4 py-4"><GstBadge registered={b.is_gst_registered} /></td>
                    <td className="px-4 py-4 text-gray-800">{b.gstin || "-"}</td>
                    <td className="px-4 py-4 text-gray-800">{b.legal_business_name || "-"}</td>
                    <td className="px-4 py-4 text-gray-800">
                      {b.is_gst_registered && b.gst_rate != null ? `${Number(b.gst_rate)}%` : "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-800">
                      {b.state ? `${b.state}${b.state_code ? ` (${b.state_code})` : ""}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditing({ id: b.branch_id, name: b.branch_name })}
                        className="px-4 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-xs font-medium text-teal-700 hover:bg-teal-100 cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GstSettings() {
  const { user } = useAuth();
  const role = String(user?.role ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  // Super admin sees every branch; everyone else edits their own branch.
  if (role === "super_admin" || role === "superadmin") return <AllBranchesGst />;
  return <GstForm />;
}