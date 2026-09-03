// src/components/Patients/Patients.jsx
import { useState, useMemo } from "react";
import PatientsHeader from "./PatientsHeader";
import PatientsSearch from "./PatientsSearch";
import PatientsTable from "./PatientsTable/PatientsTable";
import PatientCard from "./PatientsTable/PatientCard";
import AddPatientModal from "./modals/AddPatientModal";
import { patients as initialPatients } from "../../data/patients";

function generateRegNo(existing) {
  const maxNo = existing.reduce((max, p) => Math.max(max, parseInt(p.regNo, 10) || 0), 20018483);
  return String(maxNo + 1);
}

export default function Patients() {
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.regNo.includes(search) ||
        p.contact.includes(search)
    );
  }, [patients, search]);

  function handleAddPatient(newPatientData) {
    const newPatient = {
      ...newPatientData,
      regNo: generateRegNo(patients),
      orders: 0,
    };
    setPatients((prev) => [...prev, newPatient]);
    setModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <PatientsHeader onAddPatient={() => setModalOpen(true)} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <PatientsSearch value={search} onChange={setSearch} />

        <div className="hidden md:block">
          <PatientsTable patients={filteredPatients} />
        </div>
        <div className="md:hidden space-y-3">
          {filteredPatients.map((p) => (
            <PatientCard key={p.regNo} {...p} />
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No patients found.</p>
        )}
      </div>

      {isModalOpen && (
        <AddPatientModal
          onClose={() => setModalOpen(false)}
          onAdd={handleAddPatient}
        />
      )}
    </div>
  );
}