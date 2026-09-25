// src/components/Reports/ReportItemGrid.jsx
export default function ReportItemGrid({ category, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {category.items.map(({ key, title, description, icon: Icon, component }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className="text-left bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500"
        >
          <div className="flex items-start justify-between">
            <span className={`inline-flex h-10 w-10 rounded-lg items-center justify-center mb-3 ${category.color}`}>
              <Icon size={18} />
            </span>
            {!component && (
              <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 mt-1">
                Coming soon
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </button>
      ))}
    </div>
  );
}