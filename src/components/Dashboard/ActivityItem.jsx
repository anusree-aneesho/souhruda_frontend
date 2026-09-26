// src/components/Dashboard/LatestActivities/ActivityItem.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { useHomeCollectionModal } from "../../Context/HomeCollectionModalContext";
import SampleCollectionModal from "../LabOrders/SampleCollectionModal";
import { getOrderApi } from "../../api/api";

function getIconMeta(text = "") {
  const t = text.toLowerCase();

  if (t.includes("via whatsapp")) {
    return { Icon: MessageCircle, bg: "bg-green-50", color: "text-green-600" };
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
  const [modalOrder, setModalOrder] = useState(null);
  const [checkingOrder, setCheckingOrder] = useState(false);

  async function handleClick() {
    if (type === "order") {
      setCheckingOrder(true);
      try {
        const res = await getOrderApi(targetId);
        const o = res.data;

        if (o.status === "pending") {
          const patientName = [o.patient?.first_name, o.patient?.last_name].filter(Boolean).join(" ");
          setModalOrder({
            orderId: o.order_no,
            patient: patientName,
            regNo: o.patient?.patient_number || "",
            tests: o.items?.length || 0,
            testNames: (o.items || []).map((item) => item.lab_test?.name).filter(Boolean),
          });
        } else {
          navigate(`/lab-orders/${targetId}`);
        }
      } catch (err) {
        // If the status check fails for any reason, fall back to
        // navigating straight through rather than blocking the click.
        navigate(`/lab-orders/${targetId}`);
      } finally {
        setCheckingOrder(false);
      }
    } else if (type === "homeCollection") {
      open(targetId);
    } else if (type === "patient") {
      navigate(`/patients`);
    }
  }

  function handleSampleCollected(orderId) {
    setModalOrder(null);
    navigate(`/lab-orders/${orderId}`, {
      state: { justCollected: { orderId, patientName: modalOrder?.patient } },
    });
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
            disabled={checkingOrder}
            className="text-sm font-medium text-gray-900 hover:text-teal-600 text-left cursor-pointer disabled:opacity-50"
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

      {modalOrder && (
        <SampleCollectionModal
          order={modalOrder}
          onClose={() => setModalOrder(null)}
          onConfirmed={handleSampleCollected}
        />
      )}
    </div>
  );
}