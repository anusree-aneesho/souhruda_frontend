// src/components/Reports/FinanceQuickView.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IndianRupee, CheckCircle2, Clock, FlaskConical, Home, ArrowRight } from "lucide-react";
import StatCard from "../common/StatCard";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { getFinanceReportApi } from "../../api/api";

function TypeCard({ title, icon: Icon, totals, loading }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-gray-500">Orders</dt>
        <dd className="text-right text-gray-900">{loading ? "—" : totals?.orders ?? 0}</dd>
        <dt className="text-gray-500">Revenue</dt>
        <dd className="text-right text-gray-900">{loading ? "—" : formatCurrency(totals?.revenue)}</dd>
        <dt className="text-gray-500">Paid</dt>
        <dd className="text-right text-green-700">{loading ? "—" : formatCurrency(totals?.paid)}</dd>
        <dt className="text-gray-500">Pending</dt>
        <dd className="text-right text-amber-700">{loading ? "—" : formatCurrency(totals?.pending)}</dd>
      </dl>
    </div>
  );
}

export default function FinanceQuickView() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getFinanceReportApi({
          dateFrom: daysAgoIso(30),
          dateTo: todayIso(),
        });
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load finance summary.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.summary;
  const byType = summary?.by_type;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Finance Report</h2>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/reports/finance/finance-summary")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          View report <ArrowRight size={16} />
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={loading ? "—" : formatCurrency(summary?.total_revenue)} icon={IndianRupee} color="teal" />
        <StatCard label="Paid" value={loading ? "—" : formatCurrency(summary?.paid)} icon={CheckCircle2} color="green" />
        <StatCard label="Pending" value={loading ? "—" : formatCurrency(summary?.pending)} icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TypeCard title="Lab Orders" icon={FlaskConical} totals={byType?.lab} loading={loading} />
        <TypeCard title="Home Collection" icon={Home} totals={byType?.home_collection} loading={loading} />
      </div>
    </div>
  );
}