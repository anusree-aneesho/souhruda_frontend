// src/components/LabOrders/Report/ReportCategorySection.jsx
const dotColors = {
  Biochemistry: "bg-teal-500",
  Hematology: "bg-pink-500",
  Hormone: "bg-purple-500",
  Immunology: "bg-amber-500",
};

export default function ReportCategorySection({ category, tests, flags }) {
  return (
    <div className="mb-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
        <span className={`h-2 w-2 rounded-full ${dotColors[category] || "bg-gray-400"}`} />
        {category}
      </p>
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-1 text-xs font-medium text-gray-400 tracking-wide">TEST PARAMETER</th>
            <th className="pb-1 text-xs font-medium text-gray-400 tracking-wide">RESULT</th>
            <th className="pb-1 text-xs font-medium text-gray-400 tracking-wide">REFERENCE RANGE</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => {
            const isAbnormal = ["Low", "High", "Abnormal"].includes(flags[test.id]);
            return (
              <tr key={test.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-sm text-gray-700">{test.name}</td>
                <td className={`py-2 text-sm font-semibold ${isAbnormal ? "text-amber-600" : "text-gray-900"}`}>
                  {test.result} {test.unit}
                </td>
                <td className="py-2 text-sm text-teal-600">{test.range}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}