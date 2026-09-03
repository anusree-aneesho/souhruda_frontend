// src/components/common/LabAssistant/SuggestedPrompts.jsx
const prompts = ["Pending orders today", "Today's revenue", "Who has high cholesterol?", "Busiest technician"];

export default function SuggestedPrompts({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}