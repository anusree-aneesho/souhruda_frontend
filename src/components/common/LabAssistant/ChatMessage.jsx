// src/components/common/LabAssistant/ChatMessage.jsx
export default function ChatMessage({ role, text }) {
  const isBot = role === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isBot ? "bg-gray-100 text-gray-800" : "bg-teal-600 text-white"
        }`}
      >
        {text}
      </div>
    </div>
  );
}