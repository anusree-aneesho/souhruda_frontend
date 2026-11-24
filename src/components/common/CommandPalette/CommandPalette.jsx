// src/components/common/CommandPalette/CommandPalette.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useCommandPalette } from "../../../Context/CommandPaletteContext";
import CommandPaletteItem from "../CommandPalette/CommandPaletteItem";

const pages = [
  { title: "Go to Dashboard", icon: "🏠", path: "/" },
  { title: "Go to Lab Orders", icon: "🧪", path: "/lab-orders" },
  { title: "Go to Home Collection", icon: "🚗", path: "/home-collection" },
  { title: "Go to Test Master", icon: "📋", path: "/test-master" },
  { title: "Go to Patients", icon: "😊", path: "/patients" },
  { title: "Go to Follow-ups", icon: "⏰", path: "/follow-ups" },
  { title: "Go to Settings", icon: "⚙️", path: "/settings" },
];

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const results = useMemo(
    () =>
      pages.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleSelect(path) {
    navigate(path);
    close();
  }

  // ADDED: clears the search text and puts the cursor back in the input
  function clearQuery() {
    setQuery("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      handleSelect(results[activeIndex].path);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24"
      onClick={close}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search patients, orders, or jump to a page..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400 min-w-0"
          />
          {/* ADDED: clear button, only shown when there is text */}
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No results found.</p>
          )}
          {results.map((item, index) => (
            <div key={item.path} data-index={index}>
              <CommandPaletteItem
                icon={item.icon}
                title={item.title}
                subtitle="View"
                isActive={index === activeIndex}
                onClick={() => handleSelect(item.path)}
                onMouseMove={() => setActiveIndex(index)}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          <span><kbd className="font-medium text-gray-600">↑↓</kbd> navigate</span>
          <span><kbd className="font-medium text-gray-600">Enter</kbd> select</span>
          <span><kbd className="font-medium text-gray-600">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}