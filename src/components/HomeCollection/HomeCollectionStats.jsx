// src/components/HomeCollection/HomeCollectionStats.jsx
import StatCard from "../common/StatCard";
import { Clock, MapPin, FileText, CheckCircle, XCircle, Wallet } from "lucide-react";

const rs = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function HomeCollectionStats({ counts, pendingPayment, activeFilter, onFilterChange }) {
  const c = counts || { requested: 0, inProgress: 0, reportReady: 0, sentToPatient: 0, cancelled: 0 };

  const stats = [
    { id: "requested", label: "Requested", value: c.requested, icon: Clock, color: "gray" },
    { id: "inProgress", label: "In Progress", value: c.inProgress, icon: MapPin, color: "amber" },
    { id: "reportReady", label: "Report Ready", value: c.reportReady, icon: FileText, color: "blue" },
    { id: "sentToPatient", label: "Sent to Patient", value: c.sentToPatient, icon: CheckCircle, color: "green" },
    { id: "cancelled", label: "Cancelled", value: c.cancelled, icon: XCircle, color: "red" },
  ];

  // Total still to be collected from patients (cancelled requests excluded)
  const pending = pendingPayment || { count: 0, total: 0 };
  const pendingCard = {
    id: "paymentPending",
    label: "Payment Pending",
    value: rs(pending.total),
    sublabel: `${pending.count} ${pending.count === 1 ? "request" : "requests"}`,
    icon: Wallet,
    color: "purple",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map(({ id, ...props }) => (
        <StatCard
          key={id}
          {...props}
          active={activeFilter === id}
          onClick={onFilterChange ? () => onFilterChange(id) : undefined}
        />
      ))}
      {(() => {
        const { id, ...props } = pendingCard;
        return (
          <StatCard
            key={id}
            {...props}
            active={activeFilter === id}
            onClick={onFilterChange ? () => onFilterChange(id) : undefined}
          />
        );
      })()}
    </div>
  );
}