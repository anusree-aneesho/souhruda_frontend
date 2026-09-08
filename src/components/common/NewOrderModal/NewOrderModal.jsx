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
import { getPatientsApi, createHomeCollectionRequestApi, createPatientApi } from "../../../api/api";
import { useOrderModal } from "../../../Context/OrderModalContext";

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

// Fallback origin (the lab's own location) used only if device GPS is
// unavailable or denied — keep in sync with LAB_LATITUDE/LAB_LONGITUDE in
// the backend .env. Replace with real Maps/geocoding once that's added.
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

// Haversine distance in km — client-side estimate only, for display.
// The server recomputes the authoritative distance via PostGIS.
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
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [paymentDone, setPaymentDone] = useState(false);

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

  // Home collection only
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
    close();
  }

  function toggleTest(test) {
    setSelectedTests((prev) =>
      prev.some((t) => t.id === test.id) ? prev.filter((t) => t.id !== test.id) : [...prev, test]
    );
  }

  // Uses the device's own GPS via the browser Geolocation API — no Maps API
  // key needed. Falls back to the lab's fixed location if permission is
  // denied or the device has no GPS, so booking can still proceed.
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

  async function handleConfirmBooking() {
    if (!pinnedLocation) {
      setBookingError("Please pin the collection location before confirming.");
      return;
    }

    setIsBooking(true);
    setBookingError("");

    try {
      let patientId = selectedPatient?.id;

      // New patient: create them first (via the same /patients endpoint the
      // main Patients page uses), then use the returned id for the booking.
      if (patientType === "new") {
        if (!newPatientData.name.trim()) {
          setBookingError("Please enter the patient's name.");
          setIsBooking(false);
          return;
        }

        if (!newPatientData.dateOfBirth) {
          setBookingError("Please enter the patient's date of birth.");
          setIsBooking(false);
          return;
        }

        const [firstName, ...rest] = newPatientData.name.trim().split(" ");
        const lastName = rest.join(" ") || null;
        const createdPatient = await createPatientApi({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: newPatientData.dateOfBirth,
          gender: newPatientData.gender?.toLowerCase(),
          phone: newPatientData.contact,
          email: newPatientData.email || null,
          address: newPatientData.address || null,
          is_pregnant: newPatientData.gender === "Female" ? newPatientData.isPregnant : false,
        });

        

        patientId = createdPatient.data.id;  // ← .data added

        
      }

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
    (step === 2 && (selectedTests.length === 0 || !currentPatient)) ||
    (isHomeCollection && step === 3 && (!address.trim() || !preferredDate || !pinnedLocation));
    
  if (!isOpen) return null;

  return (
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

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 ">
        {step === 1 || (skipPatientStep && step === 2) ? (
          <button onClick={resetAndClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            Cancel
          </button>
        ) : (
          <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            ← Back
          </button>
        )}

        {step < totalSteps ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={isNextDisabled}
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {nextButtonLabels[step]}
          </button>
        ) : (
     <button
  onClick={isHomeCollection ? handleConfirmBooking : handleCreateOrder}
  disabled={isHomeCollection && isBooking}
  className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
>
  {isHomeCollection ? (isBooking ? "Booking…" : "Confirm Booking") : "Create Order"}
</button>
        )}
      </div>
    </ModalShell>
  );
}