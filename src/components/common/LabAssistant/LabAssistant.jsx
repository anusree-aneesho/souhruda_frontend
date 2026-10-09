// src/components/common/LabAssistant/LabAssistant.jsx
import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
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
        className="h-14 w-14 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg hover:bg-teal-700 hover:scale-105 transition-all"
      >
        <Bot size={26} />
      </button>
    </div>
  );
}