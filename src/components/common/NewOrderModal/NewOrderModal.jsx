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
import { patients } from "../../../data/patients";
import { useOrderModal } from "../../../Context/OrderModalContext";

const emptyNewPatient = { name: "", age: "", gender: "Male", contact: "" };
const emptyPinnedLocation = { lat: "11.2738", lng: "75.8004", distanceKm: "2.7" };

export default function NewOrderModal() {
  const { isOpen, close, flowType, presetPatientRegNo } = useOrderModal();
  const navigate = useNavigate();
  const isHomeCollection = flowType === "homeCollection";
  const totalSteps = isHomeCollection ? 4 : 3;
  // Opened directly from a patient's "Book test" / "Home collection" action —
  // the patient is already known, so the Patient step is skipped and the
  // flow starts at Select Tests.
  const skipPatientStep = Boolean(presetPatientRegNo);

  const [step, setStep] = useState(1);
  const [patientType, setPatientType] = useState("existing");
  const [selectedPatientRegNo, setSelectedPatientRegNo] = useState(patients[0].regNo);
  const [newPatientData, setNewPatientData] = useState(emptyNewPatient);
  const [activeCategory, setActiveCategory] = useState("Biochemistry");
  const [selectedTests, setSelectedTests] = useState([]);
  const [paymentDone, setPaymentDone] = useState(false);

  // When the modal opens for a specific patient, jump straight to the
  // Select Tests step with that patient pre-selected.
  useEffect(() => {
    if (isOpen && skipPatientStep) {
      setPatientType("existing");
      setSelectedPatientRegNo(presetPatientRegNo);
      setStep(2);
    } else if (isOpen) {
      setStep(1);
    }
  }, [isOpen, skipPatientStep, presetPatientRegNo]);

  // Home collection only
  const [address, setAddress] = useState("");
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("Morning · 7–9 AM");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  function resetAndClose() {
    setStep(1);
    setPatientType("existing");
    setSelectedPatientRegNo(patients[0].regNo);
    setNewPatientData(emptyNewPatient);
    setActiveCategory("Biochemistry");
    setSelectedTests([]);
    setPaymentDone(false);
    setAddress("");
    setPinnedLocation(null);
    setPreferredDate("");
    setTimeSlot("Morning · 7–9 AM");
    setPaymentMethod("UPI");
    close();
  }

  function toggleTest(test) {
    setSelectedTests((prev) =>
      prev.some((t) => t.id === test.id) ? prev.filter((t) => t.id !== test.id) : [...prev, test]
    );
  }

  function handlePinLocation() {
    // No real map integration yet — drops a representative pin near the lab.
    setPinnedLocation(emptyPinnedLocation);
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
      ? patients.find((p) => p.regNo === selectedPatientRegNo)
      : { name: newPatientData.name || "New Patient", age: newPatientData.age || "-", gender: newPatientData.gender, regNo: "NEW" };

  function handleCreateOrder() {
    const newOrderId = Math.floor(Math.random() * 900 + 28344); // TODO: replace with real API response
    const orderedAt = new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    resetAndClose();
    navigate(`/lab-orders/${newOrderId}`, {
      state: { patient: currentPatient, tests: selectedTests, orderedAt, paymentDone },
    });
  }

  function handleConfirmBooking() {
    // TODO: replace with real API call once home collection bookings are backed by a shared data store.
    resetAndClose();
    navigate("/home-collection");
  }

  const isNextDisabled =
    (step === 2 && selectedTests.length === 0) ||
    (isHomeCollection && step === 3 && (!address.trim() || !preferredDate));

  if (!isOpen) return null;

  return (
    <ModalShell title={stepTitles[step]} onClose={resetAndClose} maxWidth="max-w-xl">
      <StepProgressBar currentStep={step} totalSteps={totalSteps} />

      {step === 1 && (
        <PatientStep
          patientType={patientType}
          onPatientTypeChange={setPatientType}
          selectedPatientRegNo={selectedPatientRegNo}
          onSelectPatient={setSelectedPatientRegNo}
          newPatientData={newPatientData}
          onNewPatientChange={(field, value) => setNewPatientData((prev) => ({ ...prev, [field]: value }))}
        />
      )}

      {step === 2 && (
        <SelectTestsStep
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          selectedTests={selectedTests}
          onToggleTest={toggleTest}
        />
      )}

      {step === 3 && isHomeCollection && (
        <AddressSlotStep
          address={address}
          onAddressChange={setAddress}
          pinnedLocation={pinnedLocation}
          onPinLocation={handlePinLocation}
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
        <PaymentStep
          selectedTests={selectedTests}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
        />
      )}

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        {step === 1 || (skipPatientStep && step === 2) ? (
          <button onClick={resetAndClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        ) : (
          <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            ← Back
          </button>
        )}

        {step < totalSteps ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={isNextDisabled}
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {nextButtonLabels[step]}
          </button>
        ) : (
          <button
            onClick={isHomeCollection ? handleConfirmBooking : handleCreateOrder}
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700"
          >
            {isHomeCollection ? "Confirm Booking" : "Create Order"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
