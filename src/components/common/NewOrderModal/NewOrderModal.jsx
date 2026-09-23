// src/components/NewOrderModal/NewOrderModal.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModalShell from "../../common/Modal/ModalShell";
import StepProgressBar from "./StepProgressBar";
import PatientStep from "./steps/PatientStep";
import SelectTestsStep from "./steps/SelectTestsStep";
import ConfirmStep from "./steps/ConfirmStep";
import AddressSlotStep from "./steps/AddressSlotStep";
import PaymentStep from "./steps/PaymentStep";
import { useOrderModal } from "../../../Context/OrderModalContext";
import EditPatientModal from "../../Patients/modals/EditPatientModal";
import {
  getPatientsApi,
  getPatientApi,
  createPatientApi,
  updatePatientApi,
  createHomeCollectionRequestApi,
  createOrderApi,
} from "../../../api/api";
import { getDoctorsApi } from "../../../api/api";


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

function mapPatientForEdit(p) {
  return {
    id: p.id,
    regNo: p.patient_number,
    name: p.full_name,
    date_of_birth: p.date_of_birth,
    gender: p.gender,
    isPregnant: p.is_pregnant,
    contact: p.phone,
    email: p.email,
    address: p.address,
  };
}

function ageFromDOB(dob) {
  if (!dob) return "-";
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return "-";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

const LAB_FALLBACK = { lat: 11.2588, lng: 75.7804 };

const emptyNewPatient = {
  name: "",
  dateOfBirth: "",
  gender: "Male",
  contact: "",
  isPregnant: false,
  email: "",
  address: "",
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildNewPatientPayload(newPatientData) {
  const [firstName, ...rest] = newPatientData.name.trim().split(" ");
  const lastName = rest.join(" ") || null;

  return {
    first_name: firstName,
    last_name: lastName,
    date_of_birth: newPatientData.dateOfBirth,
    gender: newPatientData.gender?.toLowerCase(),
    phone: newPatientData.contact || null,
    email: newPatientData.email || null,
    address: newPatientData.address || null,
    is_pregnant: newPatientData.gender === "Female" ? newPatientData.isPregnant : false,
  };
}

export default function NewOrderModal() {
  const { isOpen, close, flowType, presetPatientRegNo } = useOrderModal();
  const navigate = useNavigate();
  const isHomeCollection = flowType === "homeCollection";
  const totalSteps = isHomeCollection ? 4 : 3;
  const skipPatientStep = Boolean(presetPatientRegNo);

  const [step, setStep] = useState(1);
  const [patientType, setPatientType] = useState("existing");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatientData, setNewPatientData] = useState(emptyNewPatient);
  const [createdPatient, setCreatedPatient] = useState(null); // holds the freshly-created patient (from step 1)
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [paymentDone, setPaymentDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  const [editingPatient, setEditingPatient] = useState(null);
  const [isLoadingPatientToEdit, setIsLoadingPatientToEdit] = useState(false);

  const [doctors, setDoctors] = useState([]); 
  const [referredBy, setReferredBy] = useState("Self");

  async function handleEditSelectedPatient() {
    if (!selectedPatient?.id) return;
    setIsLoadingPatientToEdit(true);
    try {
      const res = await getPatientApi(selectedPatient.id);
      setEditingPatient(mapPatientForEdit(res.data));
    } catch (err) {
      setSubmitError(err.message || "Couldn't load patient details.");
    } finally {
      setIsLoadingPatientToEdit(false);
    }
  }

  async function handleSaveEditedPatient(id, formData) {
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

      const res = await getPatientApi(id);
      setSelectedPatient(mapPatient(res.data));
      setEditingPatient(null);
    } catch (err) {
      setSubmitError(err.message || "Couldn't update the patient. Please try again.");
      setEditingPatient(null);
    }
  }

  useEffect(() => {
    if (isOpen && skipPatientStep) {
      setPatientType("existing");
      setStep(2);

      let cancelled = false;
      (async () => {
        try {
          const res = await getPatientsApi(presetPatientRegNo);
          const match = (res.data || []).find((p) => p.patient_number === presetPatientRegNo);
          if (!cancelled && match) setSelectedPatient(mapPatient(match));
        } catch (err) {
          console.error("Failed to load patient:", err.message);
        }
      })();

      return () => {
        cancelled = true;
      };
    } else if (isOpen) {
      setStep(1);
    }
  }, [isOpen, skipPatientStep, presetPatientRegNo]);

  useEffect(() => {
  if (!isOpen) return;
  let cancelled = false;
  (async () => {
    try {
      const res = await getDoctorsApi();
      if (!cancelled) setDoctors(res.data || []);
    } catch (err) {
      console.error("Failed to load doctors:", err.message);
    }
  })();
  return () => {
    cancelled = true;
  };
}, [isOpen]);

  const [address, setAddress] = useState("");
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("Morning · 7–9 AM");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");

  function resetAndClose() {
    setStep(1);
    setPatientType("existing");
    setSelectedPatient(null);
    setNewPatientData(emptyNewPatient);
    setCreatedPatient(null);
    setActiveCategory(null);
    setSelectedTests([]);
    setPaymentDone(false);
    setAddress("");
    setPinnedLocation(null);
    setIsLocating(false);
    setPreferredDate("");
    setTimeSlot("Morning · 7–9 AM");
    setPaymentMethod("UPI");
    setIsBooking(false);
    setBookingError("");
    setIsSubmitting(false);
    setSubmitError(null);
    setIsCreatingPatient(false);
    setEditingPatient(null);
    setReferredBy("Self");
    close();
  }

  function toggleTest(test) {
    setSelectedTests((prev) =>
      prev.some((t) => t.id === test.id) ? prev.filter((t) => t.id !== test.id) : [...prev, test]
    );
  }

  function handlePinLocation() {
    if (!navigator.geolocation) {
      setPinnedLocation({ lat: LAB_FALLBACK.lat, lng: LAB_FALLBACK.lng, distanceKm: null });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPinnedLocation({
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
          distanceKm: haversineKm(latitude, longitude, LAB_FALLBACK.lat, LAB_FALLBACK.lng).toFixed(1),
        });
        setIsLocating(false);
      },
      () => {
        setPinnedLocation({ lat: LAB_FALLBACK.lat, lng: LAB_FALLBACK.lng, distanceKm: null });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const flowLabel = isHomeCollection ? "Home Collection" : "New Order";
  const stepTitles = isHomeCollection
    ? {
        1: `${flowLabel} — Patient`,
        2: `${flowLabel} — Select Tests`,
        3: `${flowLabel} — Address & Slot`,
        4: `${flowLabel} — Payment`,
      }
    : {
        1: `${flowLabel} — Patient`,
        2: `${flowLabel} — Select Tests`,
        3: "Confirm Order",
      };

  const nextButtonLabels = isHomeCollection
    ? { 1: "Next: Select Tests →", 2: "Next: Address & Slot →", 3: "Next: Payment →" }
    : { 1: "Next: Select Tests →", 2: "Next: Confirm →" };

  const currentPatient =
    patientType === "existing"
      ? selectedPatient
      : createdPatient
      ? createdPatient
      : {
          name: newPatientData.name || "New Patient",
          age: ageFromDOB(newPatientData.dateOfBirth),
          gender: newPatientData.gender,
          regNo: "NEW",
        };

  async function handleNext() {
    if (step === 1 && patientType === "new" && !createdPatient) {
      if (!newPatientData.name.trim()) {
        setSubmitError("Please enter the patient's name.");
        return;
      }
      if (!newPatientData.dateOfBirth) {
        setSubmitError("Please enter the patient's date of birth.");
        return;
      }

      setIsCreatingPatient(true);
      setSubmitError(null);

      try {
        const res = await createPatientApi(buildNewPatientPayload(newPatientData));
        setCreatedPatient(mapPatient(res.data));
        setStep((s) => s + 1);
      } catch (err) {
        setSubmitError(err.message || "Couldn't save the patient. Please try again.");
      } finally {
        setIsCreatingPatient(false);
      }
      return;
    }

    setStep((s) => s + 1);
  }

  async function handleCreateOrder() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const patientId = patientType === "new" ? createdPatient?.id : selectedPatient?.id;

      if (!patientId) {
        setSubmitError("No patient selected. Please go back and select or add a patient.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
         patient_id: patientId,
         tests: selectedTests.map((t) => ({
         lab_test_id: t.id,
         price: t.price,
        })),
        referred_by: referredBy,
        payment_received: paymentDone,
      };

      const res = await createOrderApi(payload);
      const order = res.data;

      resetAndClose();
      navigate(`/lab-orders/${order.order_no}`, {
        state: { patient: currentPatient, tests: selectedTests, orderedAt: order.ordered_at, paymentDone, justCreated: true },
      });
    } catch (err) {
      setSubmitError(err.message);
      setIsSubmitting(false);
    }
  }

  async function handleConfirmBooking() {
    if (!pinnedLocation) {
      setBookingError("Please pin the collection location before confirming.");
      return;
    }

    setIsBooking(true);
    setBookingError("");

    try {
      const patientId = patientType === "new" ? createdPatient?.id : selectedPatient?.id;

      if (!patientId) {
        setBookingError("Please select or add a patient before confirming.");
        setIsBooking(false);
        return;
      }

      const payload = {
        patient_id: patientId,
        tests: selectedTests.map((t) => t.id),
        address_line: address,
        latitude: pinnedLocation.lat,
        longitude: pinnedLocation.lng,
        slot_date: preferredDate,
        slot_label: timeSlot,
        payment_mode: paymentMethod.toLowerCase(),
        referred_by: referredBy, 
      };

      const created = await createHomeCollectionRequestApi(payload);
      resetAndClose();
      navigate("/home-collection", { state: { justBooked: created } });
    } catch (err) {
      setIsBooking(false);
      setBookingError(err.message || "Couldn't create the booking. Please try again.");
    }
  }

const isNextDisabled =
  (step === 1 && patientType === "existing" && !selectedPatient) ||
  (step === 1 && patientType === "new" && (!newPatientData.name.trim() || !newPatientData.dateOfBirth)) ||
  (step === 1 && isCreatingPatient) ||
  (step === 2 && (selectedTests.length === 0 || !currentPatient || !referredBy)) ||
  (isHomeCollection && step === 3 && (!address.trim() || !preferredDate || !pinnedLocation));

  if (!isOpen) return null;

  return (
    <>
      <ModalShell title={stepTitles[step]} onClose={resetAndClose} maxWidth="max-w-xl">
        <StepProgressBar currentStep={step} totalSteps={totalSteps} />

        {step === 1 && (
          <PatientStep
            patientType={patientType}
            onPatientTypeChange={setPatientType}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            newPatientData={newPatientData}
            onNewPatientChange={(field, value) => setNewPatientData((prev) => ({ ...prev, [field]: value }))}
            onEditSelectedPatient={handleEditSelectedPatient}
            isLoadingPatientToEdit={isLoadingPatientToEdit}
          />
        )}

        {step === 2 && (
          <SelectTestsStep
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            selectedTests={selectedTests}
            onToggleTest={toggleTest}
            doctors={doctors}
            referredBy={referredBy}
            onReferredByChange={setReferredBy}
          />
        )}

        {step === 3 && isHomeCollection && (
          <AddressSlotStep
            address={address}
            onAddressChange={setAddress}
            pinnedLocation={pinnedLocation}
            onPinLocation={handlePinLocation}
            isLocating={isLocating}
            preferredDate={preferredDate}
            onPreferredDateChange={setPreferredDate}
            timeSlot={timeSlot}
            onTimeSlotChange={setTimeSlot}
          />
        )}
        {step === 3 && !isHomeCollection && (
          <ConfirmStep
            patient={currentPatient}
            selectedTests={selectedTests}
            paymentDone={paymentDone}
            onPaymentDoneChange={setPaymentDone}
          />
        )}

        {step === 4 && isHomeCollection && (
          <>
            <PaymentStep
              selectedTests={selectedTests}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
            />
            {bookingError && (
              <p className="px-6 text-sm text-red-600">{bookingError}</p>
            )}
          </>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          {submitError && (
            <p className="text-sm text-red-500 mr-auto">{submitError}</p>
          )}

          {step === 1 || (skipPatientStep && step === 2) ? (
            <button
              onClick={resetAndClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={isNextDisabled || isSubmitting || isCreatingPatient}
              className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
            {isCreatingPatient ? "Saving patient…" : nextButtonLabels[step]}
            </button>
          ) : (
            <button
              onClick={isHomeCollection ? handleConfirmBooking : handleCreateOrder}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40"
            >
              {isSubmitting ? "Creating…" : isHomeCollection ? "Confirm Booking" : "Create Order"}
            </button>
          )}
        </div>
      </ModalShell>

      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={handleSaveEditedPatient}
        />
      )}
    </>
  );
}