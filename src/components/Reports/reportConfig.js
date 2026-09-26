// src/components/Reports/reportConfig.js
//
// Single source of truth for the Reports navigation tree:
//   Reports -> Category -> Report item -> content component
//
// `component: null` means it's not wired to a backend endpoint yet —
// it renders <ComingSoonReport /> automatically (see Reports.jsx).
// To wire a real report: build the component + API call the same way
// PatientsReport / FinanceReport / DayToDayReport already do, then
// pass it here as `component`.

import {
  Users,
  UserPlus,
  History,
  FlaskConical,
  TrendingUp,
  IndianRupee,
  ListOrdered,
  Hourglass,
  MapPin,
  UserCheck2,
  XCircle,
  CalendarDays,
  Wallet,
  CreditCard,
  AlertCircle,
  Percent,
  RotateCcw,
  Receipt,
  Calendar,
  CalendarRange,
  BarChart3,
  Timer,
  Building2,
  Building,
} from "lucide-react";

import PatientsReport from "./PatientsReport";
import NewReturningPatientsReport from "./NewReturningPatientsReport";
import PatientTestHistoryReport from "./PatientTestHistoryReport";
import FinanceReport from "./FinanceReport";
import DayToDayReport from "./DayToDayReport";
import WeeklyReport from "./WeeklyReport";
import MonthlyReport from "./MonthlyReport";
import YearlyReport from "./YearlyReport";
import TATReport from "./TATReport";
import HomeCollectionSummaryReport from "./HomeCollectionSummaryReport";
import TechnicianCollectionReport from "./TechnicianCollectionReport";
import PendingCollectionsReport from "./PendingCollectionsReport";
import CancelledCollectionsReport from "./CancelledCollectionsReport";
import HomeCollectionQuickTable from "./HomeCollectionQuickTable";
import BranchSummaryReport from "./BranchSummaryReport";

export const REPORT_CATEGORIES = [
  {
    key: "patients",
    title: "Patient Reports",
    description: "Who you're seeing and how often they come back.",
    icon: Users,
    color: "bg-teal-50 text-teal-600",
    items: [
      {
        key: "patient-summary",
        title: "Patient Summary",
        description: "Patients seen, new vs. returning, per-order detail.",
        icon: Users,
        component: PatientsReport,
      },
      {
        key: "new-returning",
        title: "New & Returning Patients",
        description: "Split of first-time vs. repeat patients over time.",
        icon: UserPlus,
        component: NewReturningPatientsReport,
      },
      {
        key: "patient-test-history",
        title: "Patient Test History",
        description: "Every test a patient has taken, in one timeline.",
        icon: History,
        component: PatientTestHistoryReport,
      },
    ],
  },
  {
    key: "tests",
    title: "Test Reports",
    description: "How individual tests are performing.",
    icon: FlaskConical,
    color: "bg-cyan-50 text-cyan-600",
    items: [
      {
        key: "test-performance",
        title: "Test Performance",
        description: "Volume and turnaround by test over the period.",
        icon: TrendingUp,
        component: null,
      },
      {
        key: "test-revenue",
        title: "Test-wise Revenue",
        description: "Revenue contribution broken down by test.",
        icon: IndianRupee,
        component: null,
      },
      {
        key: "test-volume",
        title: "Test Volume",
        description: "Order counts per test, ranked high to low.",
        icon: ListOrdered,
        component: null,
      },
      {
        key: "pending-tests",
        title: "Pending Tests",
        description: "Tests ordered but not yet completed or reported.",
        icon: Hourglass,
        component: null,
      },
    ],
  },
  {
    key: "home-collection",
    title: "Home Collection",
    description: "Field pickups, technicians, and completion rates.",
    icon: MapPin,
    color: "bg-amber-50 text-amber-600",
    // Shown under the report cards on the category's landing page, before a
    // specific report is picked — see Reports.jsx.
    quickView: HomeCollectionQuickTable,
    items: [
      {
        key: "hc-summary",
        title: "Collection Summary",
        description: "Requests, completions, and average distance.",
        icon: MapPin,
        component: HomeCollectionSummaryReport,
      },
      {
        key: "hc-technician",
        title: "Technician-wise Collection",
        description: "Jobs completed and on-time rate per technician.",
        icon: UserCheck2,
        component: TechnicianCollectionReport,
      },
      {
        key: "hc-pending",
        title: "Pending Collections",
        description: "Requests still unassigned or awaiting pickup.",
        icon: Hourglass,
        component: PendingCollectionsReport,
      },
      {
        key: "hc-cancelled",
        title: "Cancelled Collections",
        description: "Cancelled requests and the reasons behind them.",
        icon: XCircle,
        component: CancelledCollectionsReport,
      },
    ],
  },
  {
    key: "finance",
    title: "Finance Reports",
    description: "Revenue, payments, discounts, and tax.",
    icon: IndianRupee,
    color: "bg-emerald-50 text-emerald-600",
    items: [
      {
        key: "finance-summary",
        title: "Finance Summary",
        description: "Revenue, paid and pending amounts by day.",
        icon: IndianRupee,
        component: FinanceReport,
      },
      {
        key: "daily-revenue",
        title: "Daily Revenue",
        description: "Day-by-day revenue trend for the selected range.",
        icon: CalendarDays,
        component: null,
      },
      {
        key: "payment-collection",
        title: "Payment Collection",
        description: "Amounts collected, split by payment mode.",
        icon: Wallet,
        component: null,
      },
      {
        key: "pending-outstanding",
        title: "Pending / Outstanding",
        description: "Unpaid and partially paid balances by patient.",
        icon: AlertCircle,
        component: null,
      },
      {
        key: "discounts",
        title: "Discounts",
        description: "Discounts given, by staff and by test.",
        icon: Percent,
        component: null,
      },
      {
        key: "refunds",
        title: "Refunds",
        description: "Refunds issued and the reason for each.",
        icon: RotateCcw,
        component: null,
      },
      {
        key: "gst-tax",
        title: "GST / Tax Report",
        description: "Tax collected, ready for filing.",
        icon: Receipt,
        component: null,
      },
    ],
  },
  {
    key: "operational",
    title: "Operational Reports",
    description: "Day-to-day, weekly, monthly and yearly rollups.",
    icon: BarChart3,
    color: "bg-purple-50 text-purple-600",
    items: [
      {
        key: "daily",
        title: "Day-to-Day Report",
        description: "A quick view of everything that happened today.",
        icon: Calendar,
        component: DayToDayReport,
      },
      {
        key: "weekly",
        title: "Weekly Report",
        description: "Patients, orders and revenue across the week.",
        icon: CalendarDays,
        component: WeeklyReport,
      },
      {
        key: "monthly",
        title: "Monthly Report",
        description: "Monthly totals broken down week by week.",
        icon: CalendarRange,
        component: MonthlyReport,
      },
      {
        key: "yearly",
        title: "Yearly Report",
        description: "Full-year totals broken down month by month.",
        icon: BarChart3,
        component: YearlyReport,
      },
      {
        key: "tat",
        title: "TAT Report",
        description: "Turnaround time from sample to report, by test.",
        icon: Timer,
        component: TATReport,
      },
    ],
  },
  {
    key: "branch",
    title: "Branch Reports",
    description: "Compare performance across branches.",
    icon: Building2,
    color: "bg-rose-50 text-rose-600",
    items: [
      {
        key: "branch-summary",
        title: "Branch Summary",
        description: "Headline numbers for every branch, side by side.",
        icon: Building2,
        component: BranchSummaryReport,
      },
      {
        key: "branch-patients",
        title: "Branch-wise Patients",
        description: "Patient counts per branch over the period.",
        icon: Users,
        component: null,
      },
      {
        key: "branch-tests",
        title: "Branch-wise Tests",
        description: "Test volume per branch over the period.",
        icon: FlaskConical,
        component: null,
      },
      {
        key: "branch-revenue",
        title: "Branch-wise Revenue",
        description: "Revenue per branch over the period.",
        icon: Building,
        component: null,
      },
    ],
  },
];