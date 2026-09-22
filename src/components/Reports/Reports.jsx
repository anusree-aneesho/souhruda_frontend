// src/components/Reports/Reports.jsx
export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lab reports and summaries will appear here.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-gray-400 text-center py-6">No reports to show yet.</p>
      </div>
    </div>
  );
}