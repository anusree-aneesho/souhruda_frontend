// src/components/common/LabAssistant/ChatMessage.jsx
export default function ChatMessage({ role, text, isError = false }) {
  const isBot = role === "bot";

  const bubble = isError
    ? "bg-red-50 text-red-700 border border-red-100"
    : isBot
      ? "bg-gray-100 text-gray-800"
      : "bg-teal-600 text-white";

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      {/* whitespace-pre-wrap keeps the line breaks and lists the assistant returns */}
      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${bubble}`}>
        {text}
      </div>
    </div>
  );
}