// src/components/common/Topbar/SearchBar.jsx
import { Search } from "lucide-react";
import { useCommandPalette } from "../../../Context/CommandPaletteContext";

export default function SearchBar() {
  const { open } = useCommandPalette();

  return (
    <button
      onClick={open}
      className="flex items-center gap-2 w-80 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 hover:bg-gray-100 transition-colors"
    >
      <Search size={16} />
      <span className="flex-1 text-left">Search patients, orders...</span>
      <kbd className="text-xs font-medium text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">
        ⌘K
      </kbd>
    </button>
  );
}