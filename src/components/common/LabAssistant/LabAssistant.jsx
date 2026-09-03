// src/components/common/LabAssistant/LabAssistant.jsx
import { useState, useRef, useEffect } from "react";
import ChatPanel from "./ChatPanel";

export default function LabAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && <ChatPanel onClose={() => setIsOpen(false)} />}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-teal-600 text-white flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition-transform"
      >
        🤖
      </button>
    </div>
  );
}