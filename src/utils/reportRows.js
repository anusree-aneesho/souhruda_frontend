// src/utils/reportRows.js
//
// Rows for the printed report and the PDF preview, grouped by category.
// Mirrors the server-side report PDF (PdfReportService::groupByCategory):
// a group test (e.g. CBC) becomes a heading row — it has no result of its own —
// followed by its parameters, in the order they were set in Test Master.
//
// @param {Array} tests    the order's tests (group rows, parameter rows, normal tests)
// @param {Object} results entered result values keyed by test id
// @returns {Object} { [category]: Array<{kind: "group"|"parameter"|"test", ...}> }
export function buildReportRowsByCategory(tests, results = {}) {
  const byCategory = {};

  const parametersOf = (groupId) =>
    tests
      .filter((t) => t.parentItemId === groupId)
      .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  tests
    .filter((t) => t.parentItemId == null)
    .forEach((t) => {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      const rows = byCategory[t.category];

      if (t.isGroup) {
        const parameters = parametersOf(t.id);
        if (parameters.length === 0) return;

        rows.push({ kind: "group", id: t.id, name: t.name });
        parameters.forEach((p) => rows.push({ kind: "parameter", test: { ...p, result: results[p.id] } }));
        return;
      }

      rows.push({ kind: "test", test: { ...t, result: results[t.id] } });
    });

  return byCategory;
}