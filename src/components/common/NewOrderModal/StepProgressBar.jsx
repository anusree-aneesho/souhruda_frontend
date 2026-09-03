// src/components/NewOrderModal/StepProgressBar.jsx
export default function StepProgressBar({ currentStep, totalSteps = 3 }) {
  return (
    <div className="flex gap-2 px-6 pt-4">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < currentStep ? "bg-teal-500" : "bg-gray-100"}`}
        />
      ))}
    </div>
  );
}