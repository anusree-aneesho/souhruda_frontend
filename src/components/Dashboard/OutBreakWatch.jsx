// src/components/Dashboard/OutbreakWatch.jsx
export default function OutbreakWatch() {
  return (
    <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-sm text-gray-700">
      <span className="font-semibold">3 patients</span> have an abnormal{" "}
      <span className="font-semibold">Widal Test</span> result today:{" "}
      <span className="text-teal-600 font-medium">Omana, Damodharan, Suma Raj</span>.
      Worth checking for a common source or a reagent/calibration issue.
    </div>
  );
}