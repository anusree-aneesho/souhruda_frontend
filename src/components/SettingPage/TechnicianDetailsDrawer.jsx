// src/components/SettingPage/TechnicianDetailsDrawer.jsx
import { useEffect, useState } from "react";
import { X, Star, Briefcase, Activity, CheckCircle2, MapPin, Pencil } from "lucide-react";

const STATUS_STYLES = {
  Available: "bg-teal-50 text-teal-700",
  "On Job": "bg-amber-50 text-amber-700",
  Offline: "bg-gray-100 text-gray-500",
};

const MAX_RATING = 5;

const toInputString = (v) => (v != null && v !== "" ? String(Number(v)) : "");

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right break-all">{value || "-"}</span>
    </div>
  );
}

function StatTile({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <Icon size={20} className="text-teal-600 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="mt-1 text-lg font-semibold text-gray-900">{children}</div>
      </div>
    </div>
  );
}

export default function TechnicianDetailsDrawer({ technician, onClose, onEditProfile, onSaveRating }) {
  const [ratingInput, setRatingInput] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load the stored rating whenever a (different) technician is opened or the saved value changes.
  const technicianId = technician?.id;
  const storedRating = technician?.rating;
  useEffect(() => {
    setRatingInput(toInputString(storedRating));
    setRatingError("");
    setSaveError("");
  }, [technicianId, storedRating]);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!technician) return null;

  const ratingChanged = ratingInput.trim() !== toInputString(storedRating);

  async function handleSave() {
    if (!ratingChanged) return;

    const value = ratingInput.trim();
    const num = Number(value);
    if (value === "" || Number.isNaN(num)) {
      setRatingError("Enter a rating.");
      return;
    }
    if (num < 0 || num > MAX_RATING) {
      setRatingError(`0 to ${MAX_RATING}`);
      return;
    }
    if (!/^\d+(\.\d)?$/.test(value)) {
      setRatingError("1 decimal max");
      return;
    }

    setIsSaving(true);
    setRatingError("");
    setSaveError("");
    try {
      await onSaveRating(technician, num);
    } catch (err) {
      setSaveError(err?.message || "Failed to save rating.");
    } finally {
      setIsSaving(false);
    }
  }

  const {
    staffId, name, email, phone, role, branch, status,
    assignedJobs, completedJobs, currentStatus,
  } = technician;

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Technician details"
        className="absolute right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl border-l border-gray-200 flex flex-col"
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Technician Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">{staffId}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-teal-600 text-white flex items-center justify-center text-xl font-semibold">
              {initials}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-base font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-sm text-gray-500">{role}</p>
              <p className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin size={13} />
                {branch}
              </p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  status === "Active" ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          {/* Personal information */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Personal Information
            </h3>
            <div className="divide-y divide-gray-50">
              <InfoRow label="Staff ID" value={staffId} />
              <InfoRow label="Name" value={name} />
              <InfoRow label="Email" value={email} />
              <InfoRow label="Phone" value={phone} />
              <InfoRow label="Role" value={role} />
              <InfoRow label="Branch/Zone" value={branch} />
            </div>
          </section>

          {/* Home collection stats — Rating is editable */}
          <section className="grid grid-cols-2 divide-x divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50">
            <StatTile icon={Star} label="Rating">
              <input
                type="number"
                min="0"
                max={MAX_RATING}
                step="0.1"
                inputMode="decimal"
                aria-label="Rating"
                value={ratingInput}
                onChange={(e) => {
                  setRatingInput(e.target.value);
                  setRatingError("");
                  setSaveError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className={`w-20 rounded-md border bg-white px-2 py-1 text-base font-semibold outline-none focus:ring-1 ${
                  ratingError
                    ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                    : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                }`}
              />
              {ratingError && <p className="text-xs font-normal text-red-500 mt-1">{ratingError}</p>}
            </StatTile>
            <StatTile icon={Briefcase} label="Assigned Jobs">
              {assignedJobs ?? 0}
            </StatTile>
            <StatTile icon={Activity} label="Current Status">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  STATUS_STYLES[currentStatus] || "bg-gray-100 text-gray-500"
                }`}
              >
                {currentStatus ?? "-"}
              </span>
            </StatTile>
            <StatTile icon={CheckCircle2} label="Completed Jobs">
              {completedJobs ?? 0}
            </StatTile>
          </section>
        </div>

        {/* Extra bottom padding keeps the buttons clear of the floating assistant bubble */}
        <div className="px-6 pt-4 pb-20 border-t border-gray-100 space-y-2">
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <button
            onClick={handleSave}
            disabled={isSaving || !ratingChanged}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pencil size={15} />
            {isSaving ? "Saving…" : "Save"}
          </button>
          
        </div>
      </aside>
    </div>
  );
}