// src/components/NewOrderModal/steps/PatientStep.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { patients } from "../../../../data/patients";

function PatientCombobox({ selectedPatientRegNo, onSelectPatient }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef(null);

  const selectedPatient = patients.find((p) => p.regNo === selectedPatientRegNo);

  // Keep the input text in sync with the selection whenever the dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedPatient ? `${selectedPatient.name} (${selectedPatient.regNo})` : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientRegNo, isOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    // If the box currently just shows the selected patient's label, treat it as "no filter"
    const isShowingSelectedLabel =
      !isOpen && selectedPatient && query === `${selectedPatient.name} (${selectedPatient.regNo})`;
    if (!q || isShowingSelectedLabel) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.regNo.toLowerCase().includes(q) ||
        p.contact.includes(q)
    );
  }, [query, isOpen, selectedPatient]);

  function handleSelect(patient) {
    onSelectPatient(patient.regNo);
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
      setHighlightedIndex((i) => Math.min(i + 1, filteredPatients.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const patient = filteredPatients[highlightedIndex];
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
          {filteredPatients.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-gray-400">No patients match your search.</p>
          ) : (
            filteredPatients.map((p, index) => (
              <button
                key={p.regNo}
                type="button"
                onClick={() => handleSelect(p)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left text-sm transition-colors ${
                  index === highlightedIndex ? "bg-teal-50" : "hover:bg-gray-50"
                } ${p.regNo === selectedPatientRegNo ? "font-semibold text-teal-700" : "text-gray-900"}`}
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
  selectedPatientRegNo, onSelectPatient,
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
            selectedPatientRegNo={selectedPatientRegNo}
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