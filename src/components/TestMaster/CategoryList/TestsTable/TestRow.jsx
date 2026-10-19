// src/components/TestMaster/TestsTable/TestRow.jsx
import { Pencil, Trash2, ChevronRight } from "lucide-react";

export default function TestRow({ test, onEdit, onRemove, onViewRange, onOpenGroup, canManage, canRemove = true }) {
  const hasFollowup = test.followupWeeks !== null && test.followupWeeks !== undefined && test.followupWeeks !== "";
  const parameterCount = (test.parameters || []).length;
  const isGroup = parameterCount > 0;

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm font-medium text-gray-900">
        <div className="flex items-center gap-2">
          {isGroup ? (
            <button
              type="button"
              onClick={() => onOpenGroup?.(test)}
              title="Open to see its parameters"
              className="text-left hover:text-teal-700 hover:underline cursor-pointer"
            >
              {test.name}
            </button>
          ) : (
            test.name
          )}
          {test.isActive === false && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              Inactive
            </span>
          )}
        </div>
      </td>
      <td className="py-3 text-sm text-gray-500">{test.unit}</td>
      <td className="py-3 text-sm">
        {isGroup ? (
          <button
            type="button"
            onClick={() => onOpenGroup?.(test)}
            className="inline-flex items-center gap-0.5 text-xs text-teal-600 font-medium hover:underline cursor-pointer whitespace-nowrap"
          >
            {parameterCount} {parameterCount === 1 ? "parameter" : "parameters"}
            <ChevronRight size={12} />
          </button>
        ) : (
          <button
            onClick={() => onViewRange(test)}
            className="text-xs text-teal-600 font-medium hover:underline cursor-pointer"
          >
            View
          </button>
        )}
      </td>
      <td className="py-3 text-sm text-gray-900">₹{Number(test.price).toFixed(2)}</td>
      <td className="py-3 text-sm text-gray-500">
        {hasFollowup ? `${test.followupWeeks}w` : <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3 text-right">
        {canManage && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onEdit(test)}
              className="p-1 rounded-md text-teal-600 hover:bg-teal-50 cursor-pointer"
              aria-label={`Edit ${test.name}`}
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            {canRemove && (
              <button
                onClick={() => onRemove(test)}
                className="p-1 rounded-md text-red-500 hover:bg-red-50 cursor-pointer"
                aria-label={`Remove ${test.name}`}
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}