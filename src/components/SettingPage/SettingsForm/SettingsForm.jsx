import { useState, useEffect } from "react";
import FormField from "./FormField";
import Toast from "../../common/Toast/Toast";
import { useToast } from "../../common/Toast/useToast";
import { getSettingsApi, updateSettingsApi, getSignatoryOptionsApi } from "../../../api/api";
import { useAuth } from "../../../Context/AuthContext";
import LabLocationSection from "./LabLocationSection";
import SignatoriesSection from "./SignatoriesSection";
import { MAX_LOCATION_ACCURACY_M, SIGNATORY_SLOTS } from "./writeOnceFields";
import AlertModal from "../../common/Modal/AlertModal";

function validate(formData) {
  const errors = {};

  if (!formData.labName.trim()) errors.labName = "Lab name is required.";
  if (!formData.address.trim()) errors.address = "Address is required.";
  if (!formData.city.trim()) errors.city = "City is required.";
  if (!formData.state.trim()) errors.state = "State is required.";

  if (!formData.pincode) {
    errors.pincode = "Pincode is required.";
  } else if (!/^\d{6}$/.test(formData.pincode)) {
    errors.pincode = "Pincode must be 6 digits.";
  }

  if (!formData.regNoPrefix) {
    errors.regNoPrefix = "Reg. No. Prefix is required.";
  } else if (!/^.{4}$/.test(formData.regNoPrefix)) {
    errors.regNoPrefix = "Reg. No. Prefix must be exactly 4 characters.";
  }

  if (!formData.orderNoStart) {
    errors.orderNoStart = "Order No. Start is required.";
  } else if (!/^\d{4}$/.test(String(formData.orderNoStart))) {
    errors.orderNoStart = "Order No. Start must be exactly 4 digits.";
  }

  if (!formData.whatsappNumber) {
    errors.whatsappNumber = "WhatsApp number is required.";
  } else if (!/^\+?[0-9\s]{10,15}$/.test(formData.whatsappNumber)) {
    errors.whatsappNumber = "Enter a valid WhatsApp number.";
  }

  if (!formData.phone) {
    errors.phone = "Phone number is required.";
  } else if (!/^[0-9\s\-+()]{7,20}$/.test(formData.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!formData.email) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!formData.website) {
    errors.website = "Website is required.";
  } else if (!/^https?:\/\/.+\..+/.test(formData.website)) {
    errors.website = "Website must start with http:// or https://.";
  }

  if (!formData.licenseNo.trim()) errors.licenseNo = "Lab License No. is required.";
  if (!formData.workingHours.trim()) errors.workingHours = "Working hours are required.";
  if (!formData.footerNote.trim()) errors.footerNote = "Report footer note is required.";

  ["baseFee", "perKmRate", "freeRadius", "maxDistanceKm"].forEach((key) => {
    if (formData[key] === "") {
      errors[key] = "This field is required.";
    } else if (Number(formData[key]) < 0) {
      errors[key] = "Value cannot be negative.";
    }
  });

  return errors;
}

// Maps backend snake_case field names to this form's camelCase state keys
const BACKEND_FIELD_MAP = {
  lab_name: "labName",
  address: "address",
  city: "city",
  state: "state",
  pincode: "pincode",
  reg_no_prefix: "regNoPrefix",
  order_no_start: "orderNoStart",
  whatsapp_number: "whatsappNumber",
  phone: "phone",
  email: "email",
  website: "website",
  license_no: "licenseNo",
  working_hours: "workingHours",
  footer_note: "footerNote",
  base_fee: "baseFee",
  per_km_rate: "perKmRate",
  free_radius: "freeRadius",
  max_distance_km: "maxDistanceKm",
  // write-once fields (shown by their own sections)
  latitude: "location",
  longitude: "location",
  technician_user_id: "technician",
  lab_assistant_user_id: "lab_assistant",
  lab_incharge_user_id: "lab_incharge",
};

const EMPTY_SELECTION = { technician: "", lab_assistant: "", lab_incharge: "" };

export default function SettingsForm({ branchId = null, branchName = "", onSaved }) {
  const [formData, setFormData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();

  // Write-once fields. `saved*` is what the server holds (and has locked);
  // `captured` / `selected` are pending choices that get locked on save.
  const [savedLocation, setSavedLocation] = useState({ latitude: null, longitude: null, locked: false });
  const [savedSignatories, setSavedSignatories] = useState({});
  const [captured, setCaptured] = useState(null);
  const [selected, setSelected] = useState(EMPTY_SELECTION);
  const [signatoryOptions, setSignatoryOptions] = useState(null);
  const [signatoryOptionsError, setSignatoryOptionsError] = useState("");
  const [signatoryBranch, setSignatoryBranch] = useState(null);
  // Names of the write-once fields the pending save would lock (shows the confirm popup).
  const [lockConfirm, setLockConfirm] = useState(null);

  const role = String(user?.role ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  const canEdit = ["admin", "super_admin", "superadmin"].includes(role);

  function applyLockState(s) {
    setSavedLocation({
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      locked: !!s.location_locked,
    });
    setSavedSignatories(s.signatories ?? {});
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setFieldErrors({});

    async function loadSettings() {
      try {
        const res = await getSettingsApi(branchId);
        if (cancelled) return;
        const s = res.data;
        setFormData({
          labName: s.lab_name || "",
          address: s.address || "",
          city: s.city || "",
          state: s.state || "",
          pincode: s.pincode || "",
          regNoPrefix: s.reg_no_prefix || "",
          orderNoStart: s.order_no_start ?? "",
          whatsappNumber: s.whatsapp_number || "",
          phone: s.phone || "",
          email: s.email || "",
          website: s.website || "",
          licenseNo: s.license_no || "",
          workingHours: s.working_hours || "",
          footerNote: s.footer_note || "",
          baseFee: s.base_fee ?? "",
          perKmRate: s.per_km_rate ?? "",
          freeRadius: s.free_radius ?? "",
          maxDistanceKm: s.max_distance_km ?? "",
        });
        applyLockState(s);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [branchId]);

  // Staff to choose signatories from — only admins can change them, so only
  // they need the list.
  useEffect(() => {
    if (!canEdit) return;
    let cancelled = false;

    getSignatoryOptionsApi(branchId)
      .then((res) => {
        if (cancelled) return;
        setSignatoryOptions(res.data);
        setSignatoryBranch(res.branch ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setSignatoryOptions({});
        setSignatoryOptionsError(err.message || "Couldn't load the staff list.");
      });

    return () => {
      cancelled = true;
    };
  }, [branchId, canEdit]);

  function clearFieldError(name) {
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  function handleCapture(value) {
    setCaptured(value);
    clearFieldError("location");
  }

  function handleSelectSignatory(key, value) {
    setSelected((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canEdit) return;

    setError("");

    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const errorCount = Object.keys(errors).length;
      setError(
        errorCount > 1
          ? `Please fix the ${errorCount} errors below before saving.`
          : "Please fix the error below before saving."
      );
      return;
    }
    setFieldErrors({});

    // Write-once fields that this save would lock for good.
    const locksNow = [];
    if (!savedLocation.locked && captured) {
      if (captured.accuracy > MAX_LOCATION_ACCURACY_M) {
        setError(
          `The captured location is only accurate to ±${captured.accuracy} m. Please retry until it is ±${MAX_LOCATION_ACCURACY_M} m or better.`
        );
        return;
      }
      locksNow.push("the lab location");
    }
    SIGNATORY_SLOTS.forEach(({ key, label }) => {
      if (!savedSignatories[key]?.locked && selected[key]) locksNow.push(`the ${label.toLowerCase()} signatory`);
    });

    if (locksNow.length > 0) {
      setLockConfirm(locksNow);
      return;
    }

    await saveSettings();
  }

  async function saveSettings() {
    setError("");
    setSaving(true);

    try {
      await updateSettingsApi(
        {
          lab_name: formData.labName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          reg_no_prefix: formData.regNoPrefix,
          order_no_start: Number(formData.orderNoStart) || 0,
          whatsapp_number: formData.whatsappNumber,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          license_no: formData.licenseNo,
          working_hours: formData.workingHours,
          footer_note: formData.footerNote,
          base_fee: Number(formData.baseFee) || 0,
          per_km_rate: Number(formData.perKmRate) || 0,
          free_radius: Number(formData.freeRadius) || 0,
          max_distance_km: Number(formData.maxDistanceKm) || 0,
          // Only send write-once fields that are still open and have a value.
          ...(!savedLocation.locked && captured
            ? { latitude: captured.latitude, longitude: captured.longitude }
            : {}),
          ...Object.fromEntries(
            SIGNATORY_SLOTS.filter(({ key }) => !savedSignatories[key]?.locked && selected[key]).map(
              ({ key, field }) => [field, Number(selected[key])]
            )
          ),
        },
        branchId
      );

      // Re-read so newly locked fields switch to their read-only state.
      try {
        const fresh = await getSettingsApi(branchId);
        applyLockState(fresh.data);
      } catch {
        // non-fatal: the save itself succeeded
      }
      setCaptured(null);
      setSelected(EMPTY_SELECTION);

      showToast("Settings saved successfully.");
      onSaved?.(formData.labName);
    } catch (err) {
      // Laravel validation errors: { errors: { field_name: ["message1", "message2"] } }
      if (err.errors) {
        const mapped = {};
        Object.entries(err.errors).forEach(([backendField, messages]) => {
          const frontendField = BACKEND_FIELD_MAP[backendField] || backendField;
          mapped[frontendField] = messages.join(" ");
        });
        setFieldErrors(mapped);
        const errorCount = Object.keys(mapped).length;
        setError(
          errorCount > 1
            ? `Please fix the ${errorCount} errors below before saving.`
            : "Please fix the error below before saving."
        );
      } else {
        setError(err.message || "Failed to save settings.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading settings...</p>;
  if (!formData) return <p className="text-sm text-red-500">{error || "Unable to load settings."}</p>;

  return (
    <>
    <fieldset disabled={!canEdit} className={`min-w-0 border-0 p-0 mb-6 ${!canEdit ? "opacity-70" : ""}`}>
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] w-full space-y-8"
    >
      {branchName && (
        <p className="text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
          Viewing settings for <span className="font-semibold">{branchName}</span>
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Lab details */}
      <section className="space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 tracking-wide uppercase">Lab details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <FormField label="Lab Name" name="labName" value={formData.labName} onChange={handleChange} error={fieldErrors.labName} />
          <FormField label="Lab License No." name="licenseNo" value={formData.licenseNo} onChange={handleChange} placeholder="NABL / ICMR / State License No." error={fieldErrors.licenseNo} />
          <FormField label="Working Hours" name="workingHours" value={formData.workingHours} onChange={handleChange} placeholder="Mon-Sat, 7 AM - 8 PM" error={fieldErrors.workingHours} />
        </div>

        <FormField label="Address" name="address" value={formData.address} onChange={handleChange} error={fieldErrors.address} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FormField label="City" name="city" value={formData.city} onChange={handleChange} error={fieldErrors.city} />
          <FormField label="State" name="state" value={formData.state} onChange={handleChange} error={fieldErrors.state} />
          <FormField label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} error={fieldErrors.pincode} />
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 tracking-wide uppercase">Contact</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <FormField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="0495 xxxxxxx" error={fieldErrors.phone} />
          <FormField label="WhatsApp Sender Number" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="+91 9xxxxxxxxx" error={fieldErrors.whatsappNumber} />
          <FormField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} error={fieldErrors.email} />
          <FormField label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." error={fieldErrors.website} />
        </div>
      </section>

      {/* Numbering & report */}
      <section className="space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 tracking-wide uppercase">Numbering &amp; reports</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <FormField label="Reg. No. Prefix" name="regNoPrefix" value={formData.regNoPrefix} onChange={handleChange} error={fieldErrors.regNoPrefix} />
          <FormField label="Order No. Start" name="orderNoStart" value={formData.orderNoStart} onChange={handleChange} error={fieldErrors.orderNoStart} />
        </div>

        <div>
          <label htmlFor="footerNote" className="block text-sm font-semibold text-gray-900 mb-1.5">
            Report Footer Note / Disclaimer
          </label>
          <textarea
            id="footerNote"
            name="footerNote"
            rows={3}
            value={formData.footerNote}
            onChange={handleChange}
            placeholder="e.g. Reports are not valid for medico-legal purposes."
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-1 transition-colors ${
              fieldErrors.footerNote
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
            }`}
          />
          {fieldErrors.footerNote && <p className="text-xs text-red-600 mt-1">{fieldErrors.footerNote}</p>}
        </div>
      </section>

      {/* Home collection */}
      <section className="space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 tracking-wide uppercase">Home collection</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <FormField label="Base Fee (₹)" name="baseFee" type="number" value={formData.baseFee} onChange={handleChange} error={fieldErrors.baseFee} />
          <FormField label="Per KM Rate (₹/km)" name="perKmRate" type="number" value={formData.perKmRate} onChange={handleChange} error={fieldErrors.perKmRate} />
          <FormField label="Free Radius (km)" name="freeRadius" type="number" value={formData.freeRadius} onChange={handleChange} error={fieldErrors.freeRadius} />
          <FormField label="Maximum Distance (km)" name="maxDistanceKm" type="number" value={formData.maxDistanceKm} onChange={handleChange} error={fieldErrors.maxDistanceKm} />
        </div>
        <p className="text-xs text-gray-400">
          Home collection fee = Base Fee + Per KM Rate × km beyond the Free Radius. Addresses farther than the Maximum Distance can't be booked.
        </p>
      </section>

      <LabLocationSection
        saved={savedLocation}
        captured={captured}
        onCapture={handleCapture}
        error={fieldErrors.location}
        canEdit={canEdit}
      />

      <SignatoriesSection
        saved={savedSignatories}
        selected={selected}
        options={signatoryOptions}
        optionsError={signatoryOptionsError}
        branch={signatoryBranch}
        onSelect={handleSelectSignatory}
        errors={fieldErrors}
        canEdit={canEdit}
      />

      {canEdit && (
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      )}
    </form>
    </fieldset>

    {lockConfirm && (
      <AlertModal
        title="Confirm permanent change"
        message={`You are about to set ${lockConfirm.join(", ")}. These can't be changed once saved. Continue?`}
        confirmLabel="Yes, save"
        onClose={() => setLockConfirm(null)}
        onConfirm={() => {
          setLockConfirm(null);
          saveSettings();
        }}
      />
    )}
    </>
  );
}