import { Lock } from "lucide-react";
import { SIGNATORY_SLOTS } from "./writeOnceFields";

/**
 * Props
 *  - saved:    { [key]: { user_id, name, locked } } from the server
 *  - selected: { [key]: "" | userId }  pending choices (not saved yet)
 *  - options:  { [key]: [{ id, name, has_signature }] } | null
 *  - optionsError: message if the staff list failed to load
 *  - onSelect: (key, value) => void
 *  - errors:   { [key]: string }
 *  - canEdit:  admin / super admin
 */
export default function SignatoriesSection({ saved, selected, options, optionsError, onSelect, errors, canEdit }) {
  return (
    <section className="space-y-5">
      <h2 className="text-xs font-semibold text-gray-400 tracking-wide uppercase">Report signatories</h2>

      {optionsError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Couldn't load the staff list: {optionsError}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SIGNATORY_SLOTS.map(({ key, label }) => {
          const slot = saved?.[key];
          const locked = !!slot?.locked;
          const list = options?.[key] ?? [];
          const id = `signatory-${key}`;

          return (
            <div key={key}>
              <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-1.5">
                {label}
                {locked && <Lock size={12} className="text-gray-400" aria-label="Locked" />}
              </label>

              {locked ? (
                <div
                  id={id}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900"
                >
                  {slot.name ?? "—"}
                </div>
              ) : canEdit ? (
                <select
                  id={id}
                  value={selected?.[key] ?? ""}
                  onChange={(e) => onSelect(key, e.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-1 transition-colors ${
                    errors?.[key]
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  }`}
                >
                  <option value="">{options ? `Select ${label.toLowerCase()}` : "Loading…"}</option>
                  {list.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {u.has_signature ? "" : " (no signature uploaded)"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500">
                  Not set
                </div>
              )}

              {errors?.[key] && <p className="text-xs text-red-600 mt-1">{errors[key]}</p>}
              {!locked && canEdit && options && !optionsError && list.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No active {label.toLowerCase()} in this branch yet.</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        These names and signatures are printed on every lab report. Each one can be chosen only once — after saving it can't be changed.
        Signatures are uploaded on the staff member's profile in Staff Management.
      </p>
    </section>
  );
}
