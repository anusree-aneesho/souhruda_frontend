import { useEffect, useRef, useState } from "react";
import { createDoctorApi, getDoctorHospitalsApi } from "../../../api/api";

export default function QuickAddDoctorModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [hospital, setHospital] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Hospital / clinic suggestions: names already saved on other doctors.
  const [options, setOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [active, setActive] = useState(-1);
  const hospitalWrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await getDoctorHospitalsApi(hospital.trim());
        const list = res?.data ?? [];
        if (!cancelled) setOptions(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setOptions([]);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [hospital]);

  useEffect(() => {
    function onDown(e) {
      if (hospitalWrapRef.current && !hospitalWrapRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Don't suggest what is already fully typed.
  const suggestions = options.filter((o) => o.toLowerCase() !== hospital.trim().toLowerCase());

  function pickHospital(name) {
    setHospital(name);
    setShowOptions(false);
    setActive(-1);
  }

  function handleHospitalKeyDown(e) {
    if (!showOptions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pickHospital(suggestions[active]);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setShowOptions(false);
    }
  }

  async function handleSave() {
    const cleanName = name.trim().replace(/^dr\.?\s*/i, "");

    if (!cleanName) {
      setError("Doctor name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await createDoctorApi({
        name: cleanName,
        hospital_clinic: hospital.trim() || null,
      });

      const saved = res?.data?.data ?? res?.data ?? res ?? {};
      onCreated({
        ...saved,
        name: saved.name || cleanName,
        hospital_clinic: saved.hospital_clinic ?? (hospital.trim() || null),
      });
    } catch (err) {
      setError(err.message || "Couldn't add the doctor.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Add Doctor</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            You can add the remaining details later from the Doctors page.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Raflan"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div ref={hospitalWrapRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
            <input
              value={hospital}
              onChange={(e) => {
                setHospital(e.target.value);
                setShowOptions(true);
                setActive(-1);
              }}
              onFocus={() => setShowOptions(true)}
              onKeyDown={handleHospitalKeyDown}
              placeholder="e.g. City Hospital"
              autoComplete="off"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            {showOptions && suggestions.length > 0 && (
              <ul
                role="listbox"
                className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              >
                {suggestions.map((name, i) => (
                  <li
                    key={name}
                    role="option"
                    aria-selected={i === active}
                    // mousedown (not click) so it fires before the input loses focus
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickHospital(name);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      i === active ? "bg-teal-50 text-teal-700" : "text-gray-700"
                    }`}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save & Select"}
          </button>
        </div>
      </div>
    </div>
  );
}