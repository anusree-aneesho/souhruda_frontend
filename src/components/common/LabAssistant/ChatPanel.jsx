// src/components/common/LabAssistant/ChatPanel.jsx
import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import ChatMessage from "./ChatMessage";
import SuggestedPrompts from "./SuggestedPrompts";
import { askAssistantApi } from "../../../api/api";

const initialMessages = [
  {
    role: "bot",
    text: 'Hi! I\'m your lab assistant. Ask me things like "pending orders today", "today\'s revenue", or "who has high cholesterol".',
  },
];

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await askAssistantApi({ message: trimmed, conversationId });
      // Keep the thread so follow-up questions have context.
      if (res.conversation_id) setConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: res.message || "I couldn't find an answer for that." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: err.message || "Something went wrong. Please try again.", isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div
      className="w-80 sm:w-96 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
      style={{ maxHeight: "70vh" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-purple-600 to-teal-600 px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <p className="text-sm font-bold text-white">Lab Assistant</p>
          <p className="text-xs text-white/80">Ask about orders, revenue, results...</p>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10">
          <X size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} text={msg.text} isError={msg.isError} />
        ))}
        {loading && <ChatMessage role="bot" text="Thinking…" />}
      </div>

      <SuggestedPrompts onSelect={sendMessage} />

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          disabled={loading}
          placeholder="Type a question..."
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-9 w-9 shrink-0 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}