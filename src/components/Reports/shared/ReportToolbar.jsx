// src/components/Reports/shared/ReportToolbar.jsx
import { ArrowLeft, Search, FileDown, FileSpreadsheet } from "lucide-react";

const inputClass =
  "rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500";

export default function ReportToolbar({
  onBack,
  fields = [], // [{ label, type: 'date'|'month'|'number', value, onChange, min, max, ...props }]
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchOptions, // optional: [{ value, label }] — when provided, renders a <select> instead of a text input
  searchLabel = "Search",
  onExportCsv,
  onExportPdf,
}) {
  return (
    <div className="space-y-3">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 w-fit cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Reports
        </button>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:flex-row lg:items-end lg:justify-between ">
        <div className="flex flex-wrap items-end gap-4">
          {fields.map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {field.label}
              </label>
              <input
                type={field.type || "date"}
                value={field.value}
                min={field.min}
                max={field.max}
                onChange={(e) => field.onChange(e.target.value)}
                className={inputClass}
              />
            </div>
          ))}

          {onSearchChange && searchOptions && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {searchLabel}
              </label>
              <select
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`${inputClass} w-full sm:w-64`}
              >
                {searchOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onSearchChange && !searchOptions && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {searchLabel}
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 w-full sm:w-64 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 text-sm outline-none placeholder:text-gray-400 min-w-0"
                />
              </div>
            </div>
          )}
        </div>

        {(onExportPdf || onExportCsv) && (
          <div className="flex items-center gap-2 shrink-0">
            {onExportPdf && (
              <button
                onClick={onExportPdf}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
              >
                <FileDown size={15} />
                Export PDF
              </button>
            )}
            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                Export Excel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}