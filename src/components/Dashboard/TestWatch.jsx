// src/components/Dashboard/TestWatch.jsx
import AICard from "../common/AIcard";

const tests = [
  { name: "Fasting Blood Sugar", subtitle: "4 results today · 1 abnormal", count: 4, abnormal: true },
  { name: "Hemoglobin", subtitle: "1 result today · 1 abnormal", count: 1, abnormal: true },
  { name: "Widal Test", subtitle: "3 results today", count: 3, abnormal: false },
  { name: "Total Cholesterol", subtitle: "2 results today", count: 2, abnormal: false },
  { name: "TSH", subtitle: "1 result today", count: 1, abnormal: false },
];

export default function TestWatch() {
  return (
    <AICard title="Test Watch" rightSlot="Most abnormal today">
      <div className="divide-y divide-gray-100">
        {tests.map((test) => (
          <div key={test.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{test.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{test.subtitle}</p>
            </div>
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                test.abnormal
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {test.count}
            </span>
          </div>
        ))}
      </div>
    </AICard>
  );
}