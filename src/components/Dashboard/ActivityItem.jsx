// src/components/Dashboard/LatestActivities/ActivityItem.jsx
import { useNavigate } from "react-router-dom";
import { useHomeCollectionModal } from "../../Context/HomeCollectionModalContext";

export default function ActivityItem({ date, text, type, targetId, isLatest }) {
  const navigate = useNavigate();
  const { open } = useHomeCollectionModal();

  function handleClick() {
    if (type === "order") {
      navigate(`/lab-orders/${targetId}`);
    } else if (type === "homeCollection") {
      open(targetId);
    }
  }

  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 border-b border-gray-100 last:border-0">
      <span className={`h-1.5 w-1.5 rounded-full mt-2 shrink-0 ${isLatest ? "bg-red-500" : "bg-gray-300"}`} />
      <span className="text-xs text-gray-400 w-14 shrink-0 mt-0.5">{date}</span>
      <span className="text-gray-300 mt-0.5">→</span>
      <button onClick={handleClick} className="text-sm text-teal-600 font-medium hover:underline text-left">
        {text}
      </button>
    </div>
  );
}