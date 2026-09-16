import { useState, useEffect } from "react";
import FormField from "./SettingsForm/FormField";
import { getGstSettingsApi, updateGstSettingsApi } from "../../api/api";

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

export default function GstSettings() {
  const [formData, setFormData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getGstSettingsApi();
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
        setError(err.message || "Failed to load GST settings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
    setError("");
    setSuccess(false);

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
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to save GST settings.");
    } finally {
      setSaving(false);
    }
  }

  const heading = (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">GST Settings</h1>
      <p className="text-sm text-gray-500 mt-1">
        GST registration and invoicing details for this branch.
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
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            GST settings saved successfully.
          </p>
        )}

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

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save GST Settings"}
        </button>
      </form>
    </div>
  );
}