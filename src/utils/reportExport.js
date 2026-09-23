// src/utils/reportExport.js
//
// Lightweight, dependency-free export helpers for the Reports section.
// CSV opens directly in Excel; PDF export renders a clean printable page
// and hands off to the browser's native "Save as PDF" print target —
// this avoids pulling a headless-Chrome/Browsershot round trip in just
// for report tables.

function toCsvValue(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(filename, headers, rows) {
  const lines = [
    headers.map(toCsvValue).join(","),
    ...rows.map((row) => row.map(toCsvValue).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPdf(title, headers, rows) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  const tableRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`)
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; color: #1f2937; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          p.meta { font-size: 12px; color: #6b7280; margin-top: 0; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
          th { background: #f9fafb; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="meta">Generated ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  // Give the new document a tick to finish laying out before printing.
  setTimeout(() => printWindow.print(), 300);
}