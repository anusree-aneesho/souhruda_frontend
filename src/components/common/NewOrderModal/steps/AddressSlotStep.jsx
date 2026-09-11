// src/components/common/NewOrderModal/steps/AddressSlotStep.jsx
import { useEffect } from "react";
import { MapPin } from "lucide-react";

// endHour is in 24h time — used to figure out whether "today" has already
// passed this slot's window.
const timeSlots = [
  { label: "Morning · 7–9 AM", endHour: 9 },
  { label: "Mid-Morning · 9–11 AM", endHour: 11 },
  { label: "Afternoon · 12–2 PM", endHour: 14 },
  { label: "Evening · 4–6 PM", endHour: 18 },
];

// Local (browser) calendar date as YYYY-MM-DD — matches native <input
// type="date">'s value format, and avoids the UTC-vs-local day mismatch
// toISOString() would cause near midnight IST.
function todayLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AddressSlotStep({
  address, onAddressChange,
  pinnedLocation, onPinLocation,
  preferredDate, onPreferredDateChange,
  timeSlot, onTimeSlotChange,
}) {
  const today = todayLocalDate();
  const isToday = preferredDate === today;
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;

  // A slot is only disabled for TODAY, once its window has already ended —
  // any future date keeps every slot open.
  const isSlotDisabled = (slot) => isToday && currentHour >= slot.endHour;

  // If the selected date becomes today (or the clock ticks past the
  // currently-picked slot while the modal's open) and that slot is no
  // longer valid, silently move to the first slot that's actually still
  // available — instead of letting the form submit an already-passed slot.
  useEffect(() => {
    const selected = timeSlots.find((s) => s.label === timeSlot);
    if (selected && isSlotDisabled(selected)) {
      const nextAvailable = timeSlots.find((s) => !isSlotDisabled(s));
      if (nextAvailable) onTimeSlotChange(nextAvailable.label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredDate, timeSlot]);

  return (
    <div className="px-6 py-5 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Address</label>
        <textarea
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="House name, street, locality"
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={onPinLocation}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <MapPin size={15} className="text-red-500" />
          Pin exact location on map
        </button>
        {pinnedLocation && (
          <p className="text-xs text-gray-400 mt-1.5">
            Pinned: {pinnedLocation.lat}, {pinnedLocation.lng} ·{" "}
            <span className="font-semibold text-teal-600">{pinnedLocation.distanceKm} km</span> from lab
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">Preferred Date</label>
          <input
            type="date"
            value={preferredDate}
            min={today}
            onChange={(e) => onPreferredDateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">Time Slot</label>
          <select
            value={timeSlot}
            onChange={(e) => onTimeSlotChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          >
            {timeSlots.map((slot) => (
              <option key={slot.label} value={slot.label} disabled={isSlotDisabled(slot)}>
                {slot.label}{isSlotDisabled(slot) ? " (passed)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}