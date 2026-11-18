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

// Home collection statuses that count as pending for today's card
const HC_PENDING_STATUSES = ["requested", "assigned", "en_route", "collected", "processing"];
// Lab order statuses that count as pending (Sample Collected is still waiting for results)
const LAB_PENDING_STATUSES = ["pending", "sample_collected"];

// ADDED: tells the order page where we came from, so its Back button returns to the dashboard
const BACK_TO_DASHBOARD = { from: "/", fromLabel: "Back to dashboard" };

export default function DashboardStats() {
  const navigate = useNavigate();
  const [todaysOrders, setTodaysOrders] = useState([]);
  // ADDED: orders whose payment was collected today, including orders placed on
  // earlier days (an old pending payment that is paid today counts as today's revenue).
  const [paidTodayOrders, setPaidTodayOrders] = useState([]);
  // Today's pending home collections (requested / assigned / en route / collected / processing)
  const [pendingHome, setPendingHome] = useState(0);
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
      .catch(() => setTodaysOrders([]))
      // ADDED: orders paid today (any order date). Needs the paid_today filter in
      // OrderController::index.
      .then(() =>
        getOrdersApi({ paid_today: 1, per_page: 100 })
          .then((res) => setPaidTodayOrders(res.data || []))
          .catch(() => setPaidTodayOrders([]))
      );
  }

  useEffect(() => {
    let cancelled = false;
    const today = todayLocalDate();

    loadTodaysOrders();

    getHomeCollectionRequestsApi()
      .then((rows) => {
        if (cancelled) return;
        const todaysRows = (rows || []).filter((r) => r.slot_date === today);
        const awaitingAssignment = todaysRows.filter((r) => r.status === "requested").length;
        setPendingHome(
          todaysRows.filter((r) => HC_PENDING_STATUSES.includes(r.status)).length
        );
        setHomeCollectionStat({
          value: todaysRows.length,
          sublabel: `${awaitingAssignment} awaiting assignment`,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setHomeCollectionStat({ value: "—", sublabel: "couldn't load" });
          setPendingHome(0);
        }
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

  // Pending Results = TODAY only:
  //   lab orders that are Pending or Sample Collected
  //   + home collections that are Requested, Assigned, En Route, Collected or Processing.
  // Lab side = every order in today's Lab Orders list, so it matches that page
  // (including an order that came from a home collection once its sample is collected).
  const pendingLab = todaysOrders.filter(
    (o) => !o.is_cancelled && LAB_PENDING_STATUSES.includes(o.status)
  ).length;
  const pendingTotal = pendingLab + pendingHome;

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

  // ADDED: orders from earlier days whose payment was collected today. The money
  // came in today, so it counts as paid revenue today (home visit fee included for
  // home collection orders). Orders already counted above are skipped.
  const countedOrderNos = new Set(todaysOrders.map((o) => String(o.order_no)));
  for (const o of paidTodayOrders) {
    if (countedOrderNos.has(String(o.order_no))) continue;
    if (o.is_cancelled || o.status === "cancelled") continue;
    const { grandTotal } = calcBillTotals({
      testsTotal: Number(o.bill_total) || 0,
      discountType: o.discount_type || "percentage",
      discountValue: Number(o.discount_value) || 0,
      homeVisitFee: Number(o.home_visit_fee) || 0,
      gstRate,
    });
    revenue.paid.amount += grandTotal;
    revenue.paid.orders += 1;
    revenue.paid.items.push({
      orderNo: o.order_no,
      patientName: [o.patient?.title, o.patient?.first_name, o.patient?.last_name]
        .filter(Boolean)
        .join(" "),
      regNo: o.patient?.patient_number || "",
      testsCount: o.items_count ?? o.items?.length ?? 0,
      testNames: (o.items || []).map((i) => i.lab_test?.name).filter(Boolean),
      orderedAt: o.ordered_at,
      paidAt: o.paid_at,
      earlierOrder: true,
      status: o.status,
      amount: grandTotal,
    });
  }
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
      // CHANGED: the order page now shows "Back to dashboard"
      navigate(`/lab-orders/${item.orderNo}`, { state: BACK_TO_DASHBOARD });
    }
  }

  function handleSampleCollected(orderId) {
    const patientName = modalOrder?.patientName;
    setModalOrder(null);
    navigate(`/lab-orders/${orderId}`, {
      state: { justCollected: { orderId, patientName }, ...BACK_TO_DASHBOARD }, // CHANGED
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
      sublabel: `${pendingLab} lab · ${pendingHome} home collection`,
      icon: Clock,
      color: "amber",
      onClick: () => navigate("/lab-orders?tab=pending&today=1"),
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