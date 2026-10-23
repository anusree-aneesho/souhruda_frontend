// src/components/Dashboard/DashboardStats.jsx
import { useState, useEffect } from "react";
import StatCard from "../common/StatCard";
import TodaysRevenueCard from "./TodaysRevenueCard";
import { FileText, Clock, MapPin } from "lucide-react";
import { getOrdersApi, getHomeCollectionRequestsApi, getGstSettingsApi } from "../../api/api";
import { calcBillTotals } from "../../utils/orderPricing";
import { useNavigate } from "react-router-dom";
import SampleCollectionModal from "../LabOrders/SampleCollectionModal";
import CancelledOrderModal from "../LabOrders/CancelledOrderModal";

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
  const navigate = useNavigate();
  const [todaysOrders, setTodaysOrders] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [gstInfo, setGstInfo] = useState(null);
  const [homeCollectionStat, setHomeCollectionStat] = useState({
    value: 0,
    sublabel: "0 awaiting assignment",
  });
  const [modalOrder, setModalOrder] = useState(null);
  const [cancelledOrder, setCancelledOrder] = useState(null);

  // No backend endpoint filters orders by date, so pull the (paginated,
  // most-recent-first) list and filter client-side. Also called again
  // after an order is cancelled so the numbers update.
  function loadTodaysOrders() {
    const today = todayLocalDate();
    return getOrdersApi({ per_page: 100 })
      .then((res) => {
        const rows = res.data || [];
        setTodaysOrders(rows.filter((o) => toLocalDateString(o.ordered_at) === today));
      })
      .catch(() => setTodaysOrders([]));
  }

  useEffect(() => {
    let cancelled = false;
    const today = todayLocalDate();

    loadTodaysOrders();

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

    // GST setting — needed so revenue uses the same payable total as the bill.
    getGstSettingsApi()
      .then((res) => {
        if (!cancelled) setGstInfo(res.data);
      })
      .catch(() => {
        if (!cancelled) setGstInfo(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalToday = todaysOrders.length;
  const completedToday = todaysOrders.filter((o) => o.status === "completed").length;

  // Today's Revenue — lab orders only, cancelled orders left out.
  // Each order counts at its real payable total (tests − discount + GST),
  // the same calculation the bill uses. Paid = payment received; everything
  // else is Pending.
  const gstRate = gstInfo?.is_gst_registered ? Number(gstInfo.gst_rate) || 0 : 0;
  const revenue = todaysOrders
    .filter((o) => !o.home_collection_id && !o.is_cancelled && o.status !== "cancelled")
    .reduce(
      (acc, o) => {
        const { grandTotal } = calcBillTotals({
          testsTotal: Number(o.bill_total) || 0,
          discountType: o.discount_type || "percentage",
          discountValue: Number(o.discount_value) || 0,
          homeVisitFee: 0,
          gstRate,
        });
        const bucket = o.payment_status === "paid" ? acc.paid : acc.pending;
        bucket.amount += grandTotal;
        bucket.orders += 1;
        // Details shown when the Total card is clicked
        bucket.items.push({
          orderNo: o.order_no,
          patientName: [o.patient?.title, o.patient?.first_name, o.patient?.last_name]
            .filter(Boolean)
            .join(" "),
          regNo: o.patient?.patient_number || "",
          testsCount: o.items_count ?? o.items?.length ?? 0,
          testNames: (o.items || []).map((i) => i.lab_test?.name).filter(Boolean),
          orderedAt: o.ordered_at,
          status: o.status,
          amount: grandTotal,
        });
        return acc;
      },
      {
        paid: { amount: 0, orders: 0, items: [] },
        pending: { amount: 0, orders: 0, items: [] },
      }
    );
  revenue.total = revenue.paid.amount + revenue.pending.amount;

  // Same behaviour as the Today's Orders list:
  // pending -> sample collection popup, cancelled -> cancelled popup,
  // anything else -> order page.
  function handleOpenOrder(item) {
    if (item.status === "pending") {
      setModalOrder(item);
    } else if (item.status === "cancelled") {
      setCancelledOrder({
        orderId: item.orderNo,
        patient: item.patientName,
        regNo: item.regNo,
        tests: item.testsCount,
      });
    } else {
      navigate(`/lab-orders/${item.orderNo}`);
    }
  }

  function handleSampleCollected(orderId) {
    const patientName = modalOrder?.patientName;
    setModalOrder(null);
    navigate(`/lab-orders/${orderId}`, {
      state: { justCollected: { orderId, patientName } },
    });
  }

  function handleOrderCancelled() {
    setModalOrder(null);
    loadTodaysOrders();
  }

  const stats = [
    {
      label: "Today's Orders",
      value: totalToday,
      sublabel: `${completedToday} completed`,
      icon: FileText,
      color: "teal",
      onClick: () => navigate("/lab-orders?today=1"),
    },
    {
      label: "Pending Results",
      value: pendingTotal,
      sublabel: "needs attention",
      icon: Clock,
      color: "amber",
      onClick: () => navigate("/lab-orders?tab=pending"),
    },
    {
      label: "Home Collections",
      value: homeCollectionStat.value,
      sublabel: homeCollectionStat.sublabel,
      icon: MapPin,
      color: "blue",
      onClick: () => navigate("/home-collection?filter=today"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={stat.onClick ? "cursor-pointer" : ""}
          onClick={stat.onClick}
        >
          <StatCard {...stat} />
        </div>
      ))}

      <TodaysRevenueCard revenue={revenue} onOpenOrder={handleOpenOrder} />

      {modalOrder && (
        <SampleCollectionModal
          order={{
            orderId: modalOrder.orderNo,
            patient: modalOrder.patientName,
            regNo: modalOrder.regNo,
            tests: modalOrder.testsCount,
            testNames: modalOrder.testNames,
          }}
          onClose={() => setModalOrder(null)}
          onConfirmed={handleSampleCollected}
          onCancelled={handleOrderCancelled}
        />
      )}

      {cancelledOrder && (
        <CancelledOrderModal
          order={cancelledOrder}
          onClose={() => setCancelledOrder(null)}
        />
      )}
    </div>
  );
}