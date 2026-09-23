// src/components/Dashboard/LatestActivities/ActivityItem.jsx
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  UserPlus,
} from "lucide-react";
import { useHomeCollectionModal } from "../../Context/HomeCollectionModalContext";

function getIconMeta(text = "") {
  const t = text.toLowerCase();

  if (t.includes("registered")) {
    return { Icon: UserPlus, bg: "bg-purple-50", color: "text-purple-600" };
  }
  if (t.includes("assigned to home collection")) {
    return { Icon: MapPin, bg: "bg-blue-50", color: "text-blue-600" };
  }
  if (t.includes("report ready")) {
    return { Icon: FileText, bg: "bg-teal-50", color: "text-teal-600" };
  }
  if (t.includes("completed for") || t.includes("completed")) {
    return { Icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" };
  }
  if (t.includes("follow-up reminder")) {
    return { Icon: Clock, bg: "bg-amber-50", color: "text-amber-600" };
  }
  if (t.includes("created for") || t.includes("created")) {
    return { Icon: ClipboardList, bg: "bg-indigo-50", color: "text-indigo-600" };
  }
  return { Icon: Activity, bg: "bg-gray-100", color: "text-gray-500" };
}

export default function ActivityItem({ date, text, type, targetId, isLatest, hideDate = false }) {
  const navigate = useNavigate();
  const { open } = useHomeCollectionModal();

  function handleClick() {
    if (type === "order") {
      navigate(`/lab-orders/${targetId}`);
    } else if (type === "homeCollection") {
      open(targetId);
    } else if (type === "patient") {
      // No individual patient detail route exists yet (only /patients list page).
      // Once a /patients/:id route is built, change this to:
      //   navigate(`/patients/${targetId}`);
      navigate(`/patients`);
    }
  }

  const isClickable = type === "order" || type === "homeCollection" || type === "patient";
  const { Icon, bg, color } = getIconMeta(text);

  return (
    <div className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative ${bg}`}>
        <Icon size={14} className={color} />
        {isLatest && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </div>

      <div className="min-w-0 flex-1 pt-1.5">
        {isClickable ? (
          <button
            onClick={handleClick}
            className="text-sm font-medium text-gray-900 hover:text-teal-600 text-left cursor-pointer"
          >
            {text}
          </button>
        ) : (
          <span className="text-sm font-medium text-gray-900">{text}</span>
        )}
      </div>

      {!hideDate && (
        <span className="text-xs text-gray-400 shrink-0 pt-1.5">{date}</span>
      )}
    </div>
  );
}