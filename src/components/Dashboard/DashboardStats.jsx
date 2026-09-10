// src/components/Dashboard/DashboardStats.jsx
import { useState, useEffect } from "react";
import StatCard from "../common/StatCard";
import { FileText, Clock, MapPin, IndianRupee } from "lucide-react";
import { getTodaysOrdersApi, getOrdersApi } from "../../api/api";

export default function DashboardStats() {
  const [todaysOrders, setTodaysOrders] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getTodaysOrdersApi()
      .then((res) => {
        if (!cancelled) setTodaysOrders(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setTodaysOrders([]);
      });

    getOrdersApi({ status: "Pending" })
      .then((res) => {
        if (!cancelled) setPendingTotal(res.total ?? (res.data || []).length);
      })
      .catch(() => {
        if (!cancelled) setPendingTotal(0);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalToday = todaysOrders.length;
  const completedToday = todaysOrders.filter((o) => o.status === "completed").length;

  const stats = [
    {
      label: "Today's Orders",
      value: totalToday,
      sublabel: `${completedToday} completed`,
      icon: FileText,
      color: "teal",
    },
    {
      label: "Pending Results",
      value: pendingTotal,
      sublabel: "needs attention",
      icon: Clock,
      color: "amber",
    },
    {
      label: "Home Collections",
      value: 3,
      sublabel: "1 awaiting assignment",
      icon: MapPin,
      color: "blue",
    },
    {
      label: "Today's Revenue",
      value: "₹1230.00",
      sublabel: "lab orders only",
      icon: IndianRupee,
      color: "purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}