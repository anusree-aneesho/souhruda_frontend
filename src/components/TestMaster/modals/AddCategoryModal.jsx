// src/components/TestMaster/modals/AddCategoryModal.jsx
import { useState } from "react";
import ModalShell from "../../common/Modal/ModalShell";

export default function AddCategoryModal({ onClose, onAdd }) {
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  }

  return (
    <ModalShell title="New Category" onClose={onClose} maxWidth="max-w-md ">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5">
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">
            Category Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Microbiology"
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
          >
            Add Category
          </button>
        </div>
      </form>
    </ModalShell>
  );
}