// src/components/Reports/GstReport.jsx
import { useState, useEffect, useCallback } from "react";
import { Receipt, FileText, Building2, Eye } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import Pagination from "./shared/Pagination";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getGstReportApi } from "../../api/api";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "lab", label: "Lab orders" },
  { value: "home_collection", label: "Home collection" },
];

/**
 * TEMPORARY until permissions exist:
 *   viewMode="super_admin" -> branch-wise table, "View Orders" drills into a branch
 *   viewMode="admin"       -> order-wise table for `fixedBranchId` only
 * Later, derive both from the logged-in user (role + branch_id).
 */
export default function GstReport({ onBack, viewMode = "super_admin", fixedBranchId = null }) {
  const isAdmin = viewMode === "admin";

  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [type, setType] = useState("");
  const [branchId, setBranchId] = useState(isAdmin ? String(fixedBranchId ?? "") : "");
  const [branchOptions, setBranchOptions] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const res = await getGstReportApi({ dateFrom, dateTo, type, branchId });
      setData(res);
      // Remember the full branch list (from the unfiltered call) for the dropdown.
      if (!branchId) {
        setBranchOptions(res.branches.map((b) => ({ value: String(b.branch_id), label: b.branch_name })));
      }
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, type, branchId]);

  useEffect(() => {
    load();
  }, [load]);

  const branches = data?.branches || [];
  const orders = data?.orders || [];
  const showOrders = branchId !== "";
  const activeBranch = branches[0]; // when branchId is set the API returns only that branch
  const list = showOrders ? orders : branches;

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pagedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const colCount = showOrders ? 7 : 6;

  // Exports use ALL rows of the current view, not just the visible page.
  const branchHeaders = ["#", "Branch", "GST Rate (%)", "Taxable Amount", "GST Collected", "Orders"];
  const branchCsv = branches.map((b, i) => [i + 1, b.branch_name, b.gst_rate, b.taxable, b.gst, b.orders]);

  const orderHeaders = ["Order No", "Patient", "Type", "Date", "Taxable Amount", "GST Rate (%)", "GST Amount"];
  const orderCsv = orders.map((o) => [
    o.order_no,
    o.patient_name,
    o.type === "home_collection" ? "Home Collection" : "Lab",
    o.date,
    o.taxable,
    o.gst_rate,
    o.gst,
  ]);

  const headers = showOrders ? orderHeaders : branchHeaders;
  const csvRows = showOrders ? orderCsv : branchCsv;
  const suffix = showOrders ? `-${activeBranch?.branch_name ?? "branch"}` : "";
  const fileName = `gst-report${suffix}`;
  const pdfTitle = `GST Report${showOrders ? ` — ${activeBranch?.branch_name ?? ""}` : ""}`;

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={showOrders && !isAdmin ? () => setBranchId("") : onBack}
        backLabel={showOrders && !isAdmin ? "Back to Branch Report" : "Back to Reports"}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        // Branch dropdown (super admin only) — reuses the toolbar's select slot.
        {...(!isAdmin && {
          search: branchId,
          onSearchChange: setBranchId,
          searchLabel: "Branch",
          searchOptions: [{ value: "", label: "All branches" }, ...branchOptions],
        })}
        onExportCsv={() => exportToCsv(fileName, headers, csvRows)}
        onExportPdf={() => exportToPdf(pdfTitle, headers, csvRows)}
      />

      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
              type === opt.value
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showOrders && activeBranch && !activeBranch.is_gst_registered && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {activeBranch.branch_name} is not marked as GST registered in Lab Settings, so no GST is
          counted for its orders.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total GST Collected" value={formatCurrency(data?.summary?.total_gst)} icon={Receipt} color="teal" />
        <StatCard label="Taxable Amount" value={formatCurrency(data?.summary?.total_taxable)} icon={FileText} color="green" />
        <StatCard label="Total Orders" value={data?.summary?.orders ?? 0} icon={Building2} color="amber" />
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {showOrders ? `GST by order${activeBranch ? ` — ${activeBranch.branch_name}` : ""}` : "GST by branch"}
          </h3>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                {showOrders ? (
                  <>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Patient</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Taxable</th>
                    <th className="px-4 py-3 font-medium">Rate</th>
                    <th className="px-4 py-3 font-medium">GST</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Branch</th>
                    <th className="px-4 py-3 font-medium">Rate</th>
                    <th className="px-4 py-3 font-medium">Taxable</th>
                    <th className="px-4 py-3 font-medium">GST Collected</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    {!isAdmin && <th className="px-4 py-3 font-medium text-right">Action</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount + 1} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={colCount + 1} className="px-4 py-8 text-center text-gray-400">
                    {showOrders ? "No orders in this range." : "No branches found."}
                  </td>
                </tr>
              ) : showOrders ? (
                pagedList.map((o) => (
                  <tr key={o.order_no} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{o.order_no}</td>
                    <td className="px-4 py-3 text-gray-900">{o.patient_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          o.type === "home_collection" ? "bg-purple-50 text-purple-700" : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {o.type === "home_collection" ? o.hc_code || "Home Collection" : "Lab"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{o.date}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(o.taxable)}</td>
                    <td className="px-4 py-3 text-gray-500">{o.gst_rate}%</td>
                    <td className="px-4 py-3 text-teal-700 font-medium">{formatCurrency(o.gst)}</td>
                  </tr>
                ))
              ) : (
                pagedList.map((b, i) => (
                  <tr key={b.branch_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {b.branch_name}
                      {!b.is_gst_registered && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          Not registered
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{b.gst_rate}%</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(b.taxable)}</td>
                    <td className="px-4 py-3 text-teal-700 font-medium">{formatCurrency(b.gst)}</td>
                    <td className="px-4 py-3 text-gray-500">{b.orders}</td>
                    {!isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setBranchId(String(b.branch_id))}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 cursor-pointer"
                        >
                          <Eye size={14} />
                          View Orders
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}