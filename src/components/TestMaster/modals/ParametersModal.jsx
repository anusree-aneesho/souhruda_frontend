// src/components/TestMaster/modals/ParametersModal.jsx
import ModalShell from "../../common/Modal/ModalShell";

// Read-only list of the parameters that make up a group test (e.g. CBC).
export default function ParametersModal({ test, onClose }) {
  const parameters = test.parameters || [];

  return (
    <ModalShell title={`${test.name} — Parameters`} onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
        <p className="text-xs text-gray-500">
          {parameters.length} {parameters.length === 1 ? "parameter" : "parameters"} · each is also available as a
          separate test.
        </p>

        <ol className="divide-y divide-gray-100 rounded-lg border border-gray-100">
          {parameters.map((parameter, index) => (
            <li key={parameter.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-gray-900">
              <span className="w-5 text-xs text-gray-400">{index + 1}</span>
              {parameter.name}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex justify-end px-6 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}