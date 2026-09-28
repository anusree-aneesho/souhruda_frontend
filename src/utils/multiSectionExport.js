// src/utils/multiSectionExport.js
//
// CSV / PDF export for reports made of several tables (e.g. the branch
// reports: a branch comparison table + a day-wise breakdown). Kept separate
// from reportExport.js, which stays single-table for every other report.
//
// A "section" is { title, headers, rows }.

function toCsvValue(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// One CSV file, sections stacked with a title row and a blank line between
// them. Opens in Excel with each section as its own block.
export function exportSectionsToCsv(filename, sections) {
  const lines = [];

  sections.forEach((section, i) => {
    if (i > 0) lines.push("");
    lines.push(toCsvValue(section.title));
    lines.push(section.headers.map(toCsvValue).join(","));
    section.rows.forEach((row) => lines.push(row.map(toCsvValue).join(",")));
  });

  // "\uFEFF" makes Excel read the file as UTF-8 (keeps ₹ and – intact).
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// One printable page, a heading + table per section, handed to the browser's
// "Save as PDF" print target.
export function exportSectionsToPdf(title, sections) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  const body = sections
    .map((section) => {
      const rows = section.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("");
      const empty = `<tr><td colspan="${section.headers.length}" class="empty">No data in this range.</td></tr>`;

      return `
        <h2>${escapeHtml(section.title)}</h2>
        <table>
          <thead><tr>${section.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
          <tbody>${rows || empty}</tbody>
        </table>`;
    })
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <meta charset="utf-8" />
        <style>
          /* A zero page margin stops the browser printing its own header
             (date + page title) and footer (URL). The padding on body
             provides the real margin instead. */
          @page { size: A4; margin: 0; }
          body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 15mm; color: #1f2937; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          h2 { font-size: 14px; margin: 24px 0 8px; }
          p.meta { font-size: 12px; color: #6b7280; margin-top: 0; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
          th { background: #f9fafb; }
          td.empty { text-align: center; color: #9ca3af; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</p>
        ${body}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  // Give the new document a tick to finish laying out before printing.
  setTimeout(() => printWindow.print(), 300);
}