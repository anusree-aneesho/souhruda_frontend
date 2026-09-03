// src/components/common/AICard.jsx
export default function AICard({ title, rightSlot, children }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
            🤖
          </span>
          <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
        </div>
        {rightSlot && <span className="text-xs text-gray-400">{rightSlot}</span>}
      </div>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );
}