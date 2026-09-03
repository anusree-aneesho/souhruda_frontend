import { useState, useEffect, useCallback } from "react";
import PatientsHeader from "./PatientsHeader";
import PatientsSearch from "./PatientsSearch";
import PatientsTable from "./PatientsTable/PatientsTable";
import PatientCard from "./PatientsTable/PatientCard";
import AddPatientModal from "./modals/AddPatientModal";
import EditPatientModal from "./modals/EditPatientModal";
import PatientViewModal from "./modals/PatientViewModal";
import {
  getPatientsApi,
  getPatientApi,
  createPatientApi,
  updatePatientApi,
  deletePatientApi,
} from "../../api/api";

function mapPatient(p) {
  return {
    id: p.id,
    regNo: p.patient_number,
    name: p.full_name,
    age: p.age,
    gender: p.gender,
    contact: p.phone,
    email: p.email,
    address: p.address,
    orders: 0,
  };
}

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);

  const loadPatients = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const res = await getPatientsApi(query);
      setPatients(res.data.map(mapPatient));
    } catch (err) {
      console.error("Failed to load patients:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadPatients(search), 300);
    return () => clearTimeout(timer);
  }, [search, loadPatients]);

  async function handleAddPatient(newPatientData) {
    const [first_name, ...rest] = newPatientData.name.trim().split(" ");
    const last_name = rest.join(" ") || null;

    try {
      await createPatientApi({
        first_name,
        last_name,
        age: newPatientData.age,
        gender: newPatientData.gender.toLowerCase(),
        phone: newPatientData.contact,
        email: newPatientData.email || null,
        address: newPatientData.address || null,
      });
      setModalOpen(false);
      loadPatients(search);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleView(id) {
    try {
      const res = await getPatientApi(id);
      setViewingPatient(mapPatient(res.data));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleEdit(id) {
    try {
      const res = await getPatientApi(id);
      setEditingPatient(mapPatient(res.data));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSaveEdit(id, formData) {
    const [first_name, ...rest] = formData.name.trim().split(" ");
    const last_name = rest.join(" ") || null;

    try {
      await updatePatientApi(id, {
        first_name,
        last_name,
        age: formData.age,
        gender: formData.gender.toLowerCase(),
        phone: formData.contact,
        email: formData.email || null,
        address: formData.address || null,
      });
      setEditingPatient(null);
      loadPatients(search);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this patient?")) return;
    try {
      await deletePatientApi(id);
      loadPatients(search);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <PatientsHeader onAddPatient={() => setModalOpen(true)} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <PatientsSearch value={search} onChange={setSearch} />

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
        ) : (
          <>
            <div className="hidden md:block">
              <PatientsTable
                patients={patients}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
            <div className="md:hidden space-y-3">
              {patients.map((p) => (
                <PatientCard
                  key={p.id}
                  {...p}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {patients.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No patients found.</p>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <AddPatientModal onClose={() => setModalOpen(false)} onAdd={handleAddPatient} />
      )}

      {viewingPatient && (
        <PatientViewModal patient={viewingPatient} onClose={() => setViewingPatient(null)} />
      )}

      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}