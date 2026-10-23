import { useState } from "react";
import { Lock, MapPin, ExternalLink } from "lucide-react";
import { MAX_LOCATION_ACCURACY_M } from "./writeOnceFields";

function geoErrorMessage(err) {
  if (err?.code === 1) return "Location permission was denied. Allow location access for this site in your browser and try again.";
  if (err?.code === 3) return "Timed out while getting your location. Please try again.";
  return "Your location is unavailable right now. Please try again.";
}

/**
 * Props
 *  - saved:     { latitude, longitude, locked } from the server
 *  - captured:  { latitude, longitude, accuracy } | null  (pending, not saved yet)
 *  - onCapture: (captured | null) => void
 *  - error:     validation error from the server
 *  - canEdit:   admin / super admin
 */
export default function LabLocationSection({ saved, captured, onCapture, error, canEdit }) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  function capture() {
    if (!navigator.geolocation) {
      setGeoError("This browser doesn't support location access.");
      return;
    }
    setLocating(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onCapture({
          latitude: Number(pos.coords.latitude.toFixed(7)),
          longitude: Number(pos.coords.longitude.toFixed(7)),
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        setLocating(false);
        setGeoError(geoErrorMessage(err));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  const locked = saved.locked;
  const shown = locked ? saved : captured;
  const tooRough = !locked && captured && captured.accuracy > MAX_LOCATION_ACCURACY_M;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold text-gray-400 tracking-wide uppercase">Lab location</h2>
        {locked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            <Lock size={11} /> Locked
          </span>
        )}
      </div>

      {shown ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <div>
            <span className="text-gray-500">Latitude </span>
            <span className="font-semibold text-gray-900">{Number(shown.latitude).toFixed(7)}</span>
          </div>
          <div>
            <span className="text-gray-500">Longitude </span>
            <span className="font-semibold text-gray-900">{Number(shown.longitude).toFixed(7)}</span>
          </div>
          {!locked && captured && (
            <div className="text-gray-500">Accuracy ±{captured.accuracy} m</div>
          )}
          <a
            href={`https://www.google.com/maps?q=${shown.latitude},${shown.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-teal-700 hover:underline"
          >
            View on map <ExternalLink size={12} />
          </a>
        </div>
      ) : (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          The lab location has not been set. Home collection bookings can't be priced until an admin sets it.
        </p>
      )}

      {locked ? (
        <p className="text-xs text-gray-400">
          The lab location was set once and can't be changed.
        </p>
      ) : canEdit ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={capture}
            disabled={locating}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <MapPin size={16} />
            {locating ? "Getting location…" : captured ? "Retry current location" : "Use current location"}
          </button>
          <p className="text-xs text-gray-400">
            Do this while you are at the lab, then click Save Settings. It can only be set once — after saving it can't be changed.
          </p>
          {tooRough && (
            <p className="text-xs text-red-600">
              This reading is only accurate to ±{captured.accuracy} m (needs ±{MAX_LOCATION_ACCURACY_M} m or better).
              Try again on a phone or a device with GPS, or from near a window.
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400">Only an admin or super admin can set the lab location.</p>
      )}

      {geoError && <p className="text-xs text-red-600">{geoError}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </section>
  );
}
