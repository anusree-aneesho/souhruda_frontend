// src/components/common/LabAssistant/SuggestedPrompts.jsx
const prompts = ["Search doctors", "Show patients", "Pending orders today", "Today's revenue"];

export default function SuggestedPrompts({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}