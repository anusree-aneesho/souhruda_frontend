// src/components/Dashboard/DashboardStats.jsx
import { useState, useEffect } from "react";
import StatCard from "../common/StatCard";
import { FileText, Clock, MapPin, IndianRupee } from "lucide-react";
import { getOrdersApi, getHomeCollectionRequestsApi } from "../../api/api";

// Local (browser) calendar date as YYYY-MM-DD — NOT toISOString(), which
// gives UTC's date and can be a day off from IST near midnight.
function todayLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocalDateString(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DashboardStats() {
  const [todaysOrders, setTodaysOrders] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [homeCollectionStat, setHomeCollectionStat] = useState({
    value: "—",
    sublabel: "loading…",
  });

  useEffect(() => {
    let cancelled = false;
    const today = todayLocalDate();

    // No backend endpoint filters orders by date, so pull the (paginated,
    // 20-per-page, most-recent-first) list and filter client-side. Fine at
    // current volume — if the lab regularly does 20+ orders/day, this will
    // undercount and needs a real ?date= filter added to OrderController.
    getOrdersApi()
      .then((res) => {
        const rows = res.data || [];
        if (!cancelled) {
          setTodaysOrders(rows.filter((o) => toLocalDateString(o.ordered_at) === today));
        }
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

    getHomeCollectionRequestsApi()
      .then((rows) => {
        if (cancelled) return;
        const todaysRows = (rows || []).filter((r) => r.slot_date === today);
        const awaitingAssignment = todaysRows.filter((r) => r.status === "requested").length;
        setHomeCollectionStat({
          value: todaysRows.length,
          sublabel: `${awaitingAssignment} awaiting assignment`,
        });
      })
      .catch(() => {
        if (!cancelled) setHomeCollectionStat({ value: "—", sublabel: "couldn't load" });
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
      value: homeCollectionStat.value,
      sublabel: homeCollectionStat.sublabel,
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