// src/components/Reports/Reports.jsx
import { useState } from "react";
import ReportCardGrid from "./ReportCardGrid";
import PatientsReport from "./PatientsReport";
import FinanceReport from "./FinanceReport";
import DayToDayReport from "./DayToDayReport";
import WeeklyReport from "./WeeklyReport";
import MonthlyReport from "./MonthlyReport";
import YearlyReport from "./YearlyReport";

const REPORT_VIEWS = {
  patients: PatientsReport,
  finance: FinanceReport,
  daily: DayToDayReport,
  weekly: WeeklyReport,
  monthly: MonthlyReport,
  yearly: YearlyReport,
};

const REPORT_TITLES = {
  patients: "Patients Report",
  finance: "Finance Report",
  daily: "Day to Day Report",
  weekly: "Weekly Report",
  monthly: "Monthly Report",
  yearly: "Yearly Report",
};

export default function Reports() {
  const [view, setView] = useState(null);

  const ActiveReport = view ? REPORT_VIEWS[view] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {view ? REPORT_TITLES[view] : "Reports"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {view
            ? "Filter, review, and export this report."
            : "Choose a report to see the numbers behind your lab."}
        </p>
      </div>

      {ActiveReport ? (
        <ActiveReport onBack={() => setView(null)} />
      ) : (
        <ReportCardGrid onSelect={setView} />
      )}
    </div>
  );
}