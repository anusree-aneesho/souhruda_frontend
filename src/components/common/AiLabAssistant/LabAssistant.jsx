// src/components/common/AiLabAssistant/LabAssistant.jsx
import { useState, useRef, useEffect } from "react";
import LabBotIcon from "./Labboticon";
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

      {/* Launcher is hidden while the panel is open; it returns when the panel closes
          (outside click, X button). */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Chat with LabAgent"
          aria-label="Open LabAgent chat"
          className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shadow-lg ring-4 ring-teal-500/20 hover:scale-105 hover:shadow-xl transition-all"
        >
          <LabBotIcon className="cursor-pointer" size={28} />
        </button>
      )}
    </div>
  );
}