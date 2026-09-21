import ModalShell from "../../common/Modal/ModalShell";

export default function ConfirmCompleteOrderModal({
  tests,
  results,
  flags,
  onResultChange,
  onConfirm,
  onClose,
  isSaving,
}) {
  return (
    <ModalShell title="Confirm Results" onClose={onClose} maxWidth="max-w-2xl">
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-gray-500">
          Review the results below before marking this order completed. You can still edit a value here if needed.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TEST</th>
                <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">UNIT</th>
                <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">RESULT</th>
                <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">FLAG</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 text-sm font-medium text-gray-900">{test.name}</td>
                  <td className="py-2.5 text-sm text-gray-500">{test.unit}</td>
                  <td className="py-2.5">
                    <input
                      value={results[test.id] || ""}
                      onChange={(e) => onResultChange(test.id, e.target.value)}
                      className="w-28 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </td>
                  <td className="py-2.5">
                    {flags[test.id] && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          flags[test.id] === "normal"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {flags[test.id]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? "Completing…" : "Confirm & Complete"}
        </button>
      </div>
    </ModalShell>
  );
}