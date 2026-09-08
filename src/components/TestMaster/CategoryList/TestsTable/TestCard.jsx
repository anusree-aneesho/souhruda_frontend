// src/components/TestMaster/TestsTable/TestCard.jsx
export default function TestCard({ test, onEdit, onRemove, onViewRange }) {
  const hasFollowup = test.followupWeeks !== null && test.followupWeeks !== undefined && test.followupWeeks !== "";

  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{test.name}</p>
        <p className="text-sm font-medium text-gray-900">₹{Number(test.price).toFixed(2)}</p>
      </div>
      <p className="text-xs text-gray-500 flex items-center gap-2">
        <span>{test.unit}</span>
        <button
          onClick={() => onViewRange(test)}
          className="text-teal-600 font-medium hover:underline cursor-pointer"
        >
          View
        </button>
      </p>
      <p className="text-xs text-gray-500">
        Follow-up: {hasFollowup ? `${test.followupWeeks} week${test.followupWeeks === 1 ? "" : "s"}` : <span className="text-gray-300">Not set</span>}
      </p>
      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => onEdit(test)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Edit
        </button>
        <button onClick={() => onRemove(test)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
          Remove
        </button>
      </div>
    </div>
  );
}