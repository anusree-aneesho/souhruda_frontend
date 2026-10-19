// src/components/TestMaster/TestsTable/TestCard.jsx
export default function TestCard({ test, onEdit, onRemove, onViewRange, onOpenGroup, canManage, canRemove = true }) {
  const hasFollowup = test.followupWeeks !== null && test.followupWeeks !== undefined && test.followupWeeks !== "";
  const parameterCount = (test.parameters || []).length;
  const isGroup = parameterCount > 0;

  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-1.5">
      <div className="flex items-center justify-between">
        {isGroup ? (
          <button type="button" onClick={() => onOpenGroup?.(test)} className="text-sm font-semibold text-gray-900 text-left hover:text-teal-700 cursor-pointer">
            {test.name}
          </button>
        ) : (
          <p className="text-sm font-semibold text-gray-900">{test.name}</p>
        )}
        <p className="text-sm font-medium text-gray-900">₹{Number(test.price).toFixed(2)}</p>
      </div>
      <p className="text-xs text-gray-500 flex items-center gap-2">
        <span>{test.unit}</span>
        {isGroup ? (
          <button
            type="button"
            onClick={() => onOpenGroup?.(test)}
            className="text-teal-600 font-medium hover:underline cursor-pointer"
          >
            {parameterCount} {parameterCount === 1 ? "parameter" : "parameters"} →
          </button>
        ) : (
          <button
            onClick={() => onViewRange(test)}
            className="text-teal-600 font-medium hover:underline cursor-pointer"
          >
            View
          </button>
        )}
      </p>
      <p className="text-xs text-gray-500">
        Follow-up: {hasFollowup ? `${test.followupWeeks} week${test.followupWeeks === 1 ? "" : "s"}` : <span className="text-gray-300">Not set</span>}
      </p>
      {canManage && (
        <div className="flex items-center gap-4 pt-1">
          <button onClick={() => onEdit(test)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
            Edit
          </button>
          {canRemove && (
            <button onClick={() => onRemove(test)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}