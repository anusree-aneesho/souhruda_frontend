// src/components/NewOrderModal/steps/PatientStep.jsx
import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Loader2 } from "lucide-react";
import { getPatientsApi } from "../../../../api/api";

// Maps the /patients API shape to the shape this combobox (and the rest of
// the order flow) works with.
function mapPatient(p) {
  return {
    id: p.id,
    regNo: p.patient_number,
    name: p.full_name,
    age: p.age,
    gender: p.gender,
    contact: p.phone,
  };
}

function PatientCombobox({ selectedPatient, onSelectPatient }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Keep the input text in sync with the selection whenever the dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedPatient ? `${selectedPatient.name} (${selectedPatient.regNo})` : "");
    }
  }, [selectedPatient, isOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search the real `patients` table (via GET /v1/patients?q=) whenever the
  // dropdown is open, debounced so we don't fire a request on every keystroke.
  useEffect(() => {
    if (!isOpen) return;

    // If the box currently just shows the selected patient's label (user
    // hasn't typed anything new), treat it as "no filter" and load the list.
    const isShowingSelectedLabel =
      selectedPatient && query === `${selectedPatient.name} (${selectedPatient.regNo})`;
    const search = isShowingSelectedLabel ? "" : query.trim();

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getPatientsApi(search);
        if (!cancelled) setResults((res.data || []).map(mapPatient));
      } catch (err) {
        if (!cancelled) setResults([]);
        console.error("Failed to search patients:", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen, selectedPatient]);

  function handleSelect(patient) {
    onSelectPatient(patient);
    setQuery(`${patient.name} (${patient.regNo})`);
    setIsOpen(false);
  }

  function handleKeyDown(e) {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const patient = results[highlightedIndex];
      if (patient) handleSelect(patient);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type a patient name or reg. no..."
          className="w-full rounded-lg border border-gray-200 pl-9 pr-9 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading ? (
            <p className="flex items-center gap-2 px-3.5 py-3 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Searching patients...
            </p>
          ) : results.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-gray-400">No patients match your search.</p>
          ) : (
            results.map((p, index) => (
              <button
                key={p.regNo}
                type="button"
                onClick={() => handleSelect(p)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left text-sm transition-colors ${
                  index === highlightedIndex ? "bg-teal-50" : "hover:bg-gray-50"
                } ${p.regNo === selectedPatient?.regNo ? "font-semibold text-teal-700" : "text-gray-900"}`}
              >
                <span>{p.name}</span>
                <span className="text-xs text-gray-400">
                  Reg. No. {p.regNo} · {p.age}{p.gender ? `, ${p.gender}` : ""} · {p.contact}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientStep({
  patientType, onPatientTypeChange,
  selectedPatient, onSelectPatient,
  newPatientData, onNewPatientChange,
}) {
  return (
    <div className="px-6 py-5 space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => onPatientTypeChange("existing")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            patientType === "existing" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          Existing patient
        </button>
        <button
          onClick={() => onPatientTypeChange("new")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            patientType === "new" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          New patient
        </button>
      </div>

      {patientType === "existing" ? (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Patient</label>
          <PatientCombobox
            selectedPatient={selectedPatient}
            onSelectPatient={onSelectPatient}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
            <input
              value={newPatientData.name}
              onChange={(e) => onNewPatientChange("name", e.target.value)}
              placeholder="Patient name"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Age</label>
              <input
                type="number"
                value={newPatientData.age}
                onChange={(e) => onNewPatientChange("age", e.target.value)}
                placeholder="Years"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Gender</label>
              <select
                value={newPatientData.gender}
                onChange={(e) => onNewPatientChange("gender", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Contact</label>
              <input
                value={newPatientData.contact}
                onChange={(e) => onNewPatientChange("contact", e.target.value)}
                placeholder="10-digit number"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}