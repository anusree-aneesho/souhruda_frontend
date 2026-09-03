// src/components/LabOrders/Report/AISummary.jsx
export default function AISummary({ tests, flags }) {
  const abnormal = tests.filter((t) => ["Low", "High", "Abnormal"].includes(flags[t.id]));

  const summary =
    abnormal.length === 0
      ? `All ${tests.length} parameters are within the normal range.`
      : `${abnormal.length} of ${tests.length} parameters ${abnormal.length === 1 ? "is" : "are"} outside the normal range: ${abnormal
          .map((t) => `${t.name} (${flags[t.id].toLowerCase()})`)
          .join(", ")}. Clinical correlation is advised.`;

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 mb-5">
      <p className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1.5">
         AI Summary <span className="text-[10px] font-normal text-indigo-400">auto-generated</span>
      </p>
      <p className="text-sm text-indigo-900">{summary}</p>
    </div>
  );
}