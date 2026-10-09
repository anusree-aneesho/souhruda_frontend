// src/components/common/LabAssistant/assistantUtils.jsx
// Shared rendering helpers for assistant chat tables (curated columns,
// status pills, signed Download PDF buttons) and inline bold text.

const ignoredKeys = new Set(["report_pdf_path", "bill_pdf_path", "id", "created_at"]);

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const toTitleCase = (k) =>
  k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDateTime = (value) => {
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? `${m[1]} ${m[2]}` : String(value);
};

const statusClass = (value) => {
  const v = String(value).toLowerCase();
  if (["ready", "completed", "paid", "delivered", "done", "approved", "active", "success"].includes(v)) return "ok";
  if (["pending", "processing", "in progress", "in-progress", "unpaid", "partial", "partially_paid", "awaiting", "draft"].includes(v)) return "warn";
  if (["cancelled", "canceled", "failed", "overdue", "rejected", "expired", "void"].includes(v)) return "bad";
  return "neutral";
};

const statusPillClass = (tone) => {
  if (tone === "ok") return "bg-emerald-100 text-emerald-700";
  if (tone === "warn") return "bg-amber-100 text-amber-700";
  if (tone === "bad") return "bg-rose-100 text-rose-700";
  return "bg-gray-100 text-gray-600";
};

const PATIENT_COLUMNS = [
  { key: "patient_number", label: "Patient Number" },
  { key: "name", label: "Name" },
  { key: "gender", label: "Gender" },
  { key: "age", label: "Age" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "registered_on", label: "Registered On" },
];

const REPORT_COLUMNS = [
  { key: "report_no", label: "Report No" },
  { key: "order_no", label: "Order No" },
  { key: "patient_name", label: "Patient" },
  { key: "status", label: "Status" },
  { key: "completed_at", label: "Completed At" },
  { key: "bill_total", label: "Bill Total" },
  { key: "download_url", label: "Download" },
];

const renderCell = (key, val) => {
  if (val === null || val === undefined || val === "") {
    return <span className="text-gray-400">—</span>;
  }
  if (key === "download_url") {
    if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) {
      return (
        <a
          className="inline-block rounded-md bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700"
          href={val}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download PDF
        </a>
      );
    }
    return (
      <span className="rounded border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400">
        Not ready
      </span>
    );
  }
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (key === "status" || key === "payment_status") {
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusPillClass(statusClass(val))}`}>
        {String(val)}
      </span>
    );
  }
  if (key === "gender") {
    const g = String(val);
    return g.charAt(0).toUpperCase() + g.slice(1);
  }
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) return formatDateTime(val);
  return String(val);
};

const renderTable = (title, items, columns) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const cols =
    columns ??
    Object.keys(items[0])
      .filter((k) => !ignoredKeys.has(k))
      .map((k) => ({ key: k, label: toTitleCase(k) }));

  return (
    <div className="mt-2 rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700">
        {title} ({items.length})
      </div>
      <div className="assist-tbl-wrap">
        <table className="assist-tbl">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id ?? idx}>
                {cols.map((c) => (
                  <td key={c.key}>{renderCell(c.key, item[c.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const renderDataTables = (data) => {
  if (!data) return null;
  return (
    <>
      {data.patients?.length > 0 && renderTable("Patient Details", data.patients, PATIENT_COLUMNS)}
      {data.reports?.length > 0 && renderTable("Diagnostic Reports", data.reports, REPORT_COLUMNS)}
      {data.orders?.length > 0 && renderTable("Lab Orders", data.orders)}
      {data.results?.length > 0 && renderTable("Test Results", data.results)}
      {data.doctors?.length > 0 && renderTable("Doctors List", data.doctors)}
      {data.collections?.length > 0 && renderTable("Home Collections", data.collections)}
      {data.followups?.length > 0 && renderTable("Pending Follow-ups", data.followups)}
      {data.users?.length > 0 && renderTable("Staff Members", data.users)}
      {data.branches?.length > 0 && renderTable("Laboratory Branches", data.branches)}
      {data.lab_settings?.length > 0 && renderTable("Lab Settings", data.lab_settings)}
      {data.gst_settings?.length > 0 && renderTable("GST Configuration", data.gst_settings)}
      {data.tests?.length > 0 && renderTable("Lab Tests Master Data", data.tests)}
      {data.categories?.length > 0 && renderTable("Test Categories", data.categories)}
      {data.packages?.length > 0 && renderTable("Test Packages", data.packages)}
    </>
  );
};

const renderBold = (txt, keyPrefix) => {
  const nodes = [];
  const parts = txt.split("**");
  parts.forEach((part, i) => {
    if (!part) return;
    nodes.push(i % 2 === 1 ? <strong key={`${keyPrefix}-b${i}`}>{part}</strong> : part);
  });
  return nodes;
};

export { PATIENT_COLUMNS, REPORT_COLUMNS, formatBytes, renderBold, renderDataTables, renderTable };