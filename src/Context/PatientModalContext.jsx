// src/Context/PatientModalContext.jsx
import { createContext, useContext, useState, useCallback } from "react";
import PatientViewModal from "../components/Patients/modals/PatientViewModal";
import EditPatientModal from "../components/Patients/modals/EditPatientModal";
import ConfirmModal from "../components/Patients/modals/ConfirmModal";
import Toast from "../components/common/Toast/Toast";
import { useToast } from "../components/common/Toast/useToast";
import { getPatientApi, updatePatientApi, deletePatientApi } from "../api/api";

const PatientModalContext = createContext(null);

// NEW: tells the dashboard, Activity Log and Patients page to reload
export const PATIENT_CHANGED_EVENT = "patient-changed";
function notifyPatientChanged() {
  window.dispatchEvent(new Event(PATIENT_CHANGED_EVENT));
}

// Same shape as mapPatient in Patients.jsx
function mapPatient(p) {
  return {
    id: p.id,
    title: p.title,
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

export function PatientModalProvider({ children }) {
  const [patient, setPatient] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const open = useCallback(async (id) => {
    try {
      const res = await getPatientApi(id);
      setPatient(mapPatient(res.data));
    } catch (err) {
      console.error("Failed to load patient:", err.message);
    }
  }, []);

  const close = useCallback(() => setPatient(null), []);

  async function handleSaveEdit(id, formData) {
    const [first_name, ...rest] = formData.name.trim().split(" ");
    const last_name = rest.join(" ") || null;

    try {
      await updatePatientApi(id, {
        title: formData.title || null,
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
      notifyPatientChanged(); // NEW
      setEditing(null);
      setPatient(null);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function confirmDelete() {
    try {
      await deletePatientApi(deleting.id);
      showToast("Patient removed successfully");
      notifyPatientChanged(); // NEW
      setDeleting(null);
      setPatient(null);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <PatientModalContext.Provider value={{ open, close }}>
      {children}

      {patient && !editing && !deleting && (
        <PatientViewModal
          patient={patient}
          onClose={close}
          onEdit={() => setEditing(patient)}
          onDelete={() => setDeleting(patient)}
        />
      )}

      {editing && (
        <EditPatientModal
          patient={editing}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleting && (
        <ConfirmModal
          title="Remove Patient"
          message={`Are you sure you want to remove the patient ${deleting.name}?`}
          confirmLabel="Remove"
          danger
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </PatientModalContext.Provider>
  );
}

export function usePatientModal() {
  const ctx = useContext(PatientModalContext);
  if (!ctx) throw new Error("usePatientModal must be used within PatientModalProvider");
  return ctx;
}