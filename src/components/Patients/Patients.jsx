import { useState, useEffect, useCallback } from "react";
import PatientsHeader from "./PatientsHeader";
import PatientsSearch from "./PatientsSearch";
import PatientsTable from "./PatientsTable/PatientsTable";
import PatientCard from "./PatientsTable/PatientCard";
import AddPatientModal from "./modals/AddPatientModal";
import EditPatientModal from "./modals/EditPatientModal";
import PatientViewModal from "./modals/PatientViewModal";
import ConfirmModal from "../Patients/modals/ConfirmModal";
import AlertModal from "../common/Modal/AlertModal";
import Toast from "../common/Toast/Toast";
import { useToast } from "../common/Toast/useToast";
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
    date_of_birth: p.date_of_birth,
    gender: p.gender,
    isPregnant: p.is_pregnant,
    contact: p.phone,
    email: p.email,
    address: p.address,
    orders: p.orders_count,
  };
}

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  //paginate
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);

  const { toast, showToast, hideToast } = useToast();

  const loadPatients = useCallback(async (query = "", page = 1) => {
  setLoading(true);
  try {
     const res = await getPatientsApi(query, page);
     setPatients(res.data.map(mapPatient));
     setCurrentPage(res.meta.current_page);
     setLastPage(res.meta.last_page);
     setTotalPatients(res.meta.total);
    } catch (err) {
     console.error("Failed to load patients:", err.message);
    } finally {
    setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadPatients(search, 1), 300);
    return () => clearTimeout(timer);
  }, [search, loadPatients]);

  async function handleAddPatient(newPatientData) {
    const [first_name, ...rest] = newPatientData.name.trim().split(" ");
    const last_name = rest.join(" ") || null;

    try {
      await createPatientApi({
        first_name,
        last_name,
        date_of_birth: newPatientData.date_of_birth,
        gender: newPatientData.gender.toLowerCase(),
        is_pregnant: newPatientData.gender === "Female" ? newPatientData.isPregnant : null,
        phone: newPatientData.contact,
        email: newPatientData.email || null,
        address: newPatientData.address || null,
      });
      showToast("Patient added successfully");
      setModalOpen(false);
      loadPatients(search);
    } catch (err) {
      if (err.message.toLowerCase().includes("already exists")) {
        setModalOpen(false);
        setAlertMessage(err.message);
      } else {
        showToast(err.message, "error");
      }
    }
  }

  async function handleView(id) {
    try {
      const res = await getPatientApi(id);
      setViewingPatient(mapPatient(res.data));
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleEdit(id) {
    try {
      const res = await getPatientApi(id);
      setEditingPatient(mapPatient(res.data));
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleSaveEdit(id, formData) {
    const [first_name, ...rest] = formData.name.trim().split(" ");
    const last_name = rest.join(" ") || null;

    try {
      await updatePatientApi(id, {
        first_name,
        last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender.toLowerCase(),
        is_pregnant: formData.gender === "Female" ? formData.isPregnant : null,
        phone: formData.contact,
        email: formData.email || null,
        address: formData.address || null,
      });
      showToast("Patient updated successfully");
      setEditingPatient(null);
      loadPatients(search);
    } catch (err) {
      if (err.message.toLowerCase().includes("already exists")) {
        setEditingPatient(null);
        setAlertMessage(err.message);
      } else {
        showToast(err.message, "error");
      }
    }
  }

  function handleDelete(id) {
    const patient = patients.find((p) => p.id === id);
    setDeletingPatient(patient);
  }

  async function confirmDelete() {
    try {
      await deletePatientApi(deletingPatient.id);
      showToast("Patient removed successfully");
      setDeletingPatient(null);
      loadPatients(search);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function handlePageChange(newPage) {
      loadPatients(search, newPage);
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
        
        {!loading && patients.length > 0 && lastPage > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing page {currentPage} of {lastPage} ({totalPatients} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
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

      {deletingPatient && (
        <ConfirmModal
          title="Remove Patient"
          message={`Are you sure you want to remove ${deletingPatient.name}? This action cannot be undone.`}
          confirmLabel="Remove"
          danger
          onConfirm={confirmDelete}
          onClose={() => setDeletingPatient(null)}
        />
      )}

      {alertMessage && (
        <AlertModal
          title="Patient Already Exists"
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}