// src/components/common/CommandPalette/CommandPaletteItem.jsx
export default function CommandPaletteItem({ icon, title, subtitle, isActive, onClick, onMouseEnter }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
        isActive ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
    >
      <span className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center text-lg shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </button>
  );
}