// src/components/common/NewOrderModal/steps/AddressSlotStep.jsx
import { MapPin } from "lucide-react";

const timeSlots = [
  "Morning · 7–9 AM",
  "Mid-Morning · 9–11 AM",
  "Afternoon · 12–2 PM",
  "Evening · 4–6 PM",
];

export default function AddressSlotStep({
  address, onAddressChange,
  pinnedLocation, onPinLocation,
  preferredDate, onPreferredDateChange,
  timeSlot, onTimeSlotChange,
}) {
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
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
