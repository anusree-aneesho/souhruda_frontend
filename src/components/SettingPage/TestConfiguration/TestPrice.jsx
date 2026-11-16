// TestPrice.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Droplet,
  FlaskConical,
  HeartPulse,
  IndianRupee,
  LayoutGrid,
  List,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  TestTube2,
  Check,
  X,
} from "lucide-react";
import { getTestCategories, getLabTests, updateTestPriceApi } from "../../../api/api";
import Toast from "../../common/Toast/Toast";
import { useToast } from "../../common/Toast/useToast";

const PAGE_SIZE = 8;

const PRICE_RANGES = [
  { key: "all", label: "Price Range", test: () => true },
  { key: "u100", label: "Up to ₹100", test: (p) => p <= 100 },
  { key: "100-300", label: "₹101 – ₹300", test: (p) => p > 100 && p <= 300 },
  { key: "300-500", label: "₹301 – ₹500", test: (p) => p > 300 && p <= 500 },
  { key: "o500", label: "Above ₹500", test: (p) => p > 500 },
];

// One colour + icon per category (cycled by category position)
const TONES = [
  { badge: "bg-sky-50 text-sky-700", tile: "bg-rose-50 text-rose-500", icon: Droplet },
  { badge: "bg-emerald-50 text-emerald-700", tile: "bg-teal-50 text-teal-600", icon: FlaskConical },
  { badge: "bg-red-50 text-red-600", tile: "bg-red-50 text-red-500", icon: HeartPulse },
  { badge: "bg-violet-50 text-violet-700", tile: "bg-violet-50 text-violet-600", icon: Activity },
  { badge: "bg-amber-50 text-amber-700", tile: "bg-amber-50 text-amber-600", icon: TestTube2 },
];

const money = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

function KpiCard({ icon: Icon, tint, label, value, children }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      {children}
    </div>
  );
}

// Inline price editor used by both the table row and the grid card
function PriceEditor({ initial, saving, onSave, onCancel, error }) {
  const [value, setValue] = useState(String(initial));
  const changed = value !== "" && Number(value) !== initial;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
          <input
            autoFocus
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && changed) onSave(value);
              if (e.key === "Escape") onCancel();
            }}
            className="w-24 rounded-lg border border-gray-200 py-1 pl-5 pr-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => onSave(value)}
          disabled={!changed || saving}
          title="Save"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
        </button>
        <button
          onClick={onCancel}
          title="Cancel"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const base = "flex h-8 min-w-8 items-center justify-center rounded-lg border text-sm cursor-pointer";
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${base} border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <ChevronLeft size={15} />
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-gray-400">…</span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`${base} px-2 ${
              n === page
                ? "border-teal-600 bg-teal-600 font-medium text-white"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {n}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className={`${base} border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

export default function TestPrice() {
  const { toast, showToast, hideToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [rowError, setRowError] = useState({ id: null, message: "" });

  // Bulk mode ("Update Prices" button): every visible row gets an input
  const [bulk, setBulk] = useState(false);
  const [bulkValues, setBulkValues] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getTestCategories();
        const cats = res.data || [];
        if (cancelled) return;
        setCategories(cats);

        const results = await Promise.all(
          cats.map((c) =>
            getLabTests(c.id)
              .then((r) =>
                (r.data || []).map((t) => ({
                  id: t.id,
                  name: t.name,
                  price: Number(t.price) || 0,
                  categoryId: c.id,
                  updatedAt: t.updated_at,
                }))
              )
              .catch(() => [])
          )
        );
        if (!cancelled) setTests(results.flat());
      } catch (err) {
        console.error("Failed to load tests:", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const catIndex = useMemo(
    () => Object.fromEntries(categories.map((c, i) => [c.id, i])),
    [categories]
  );
  const catName = (id) => categories[catIndex[id]]?.name || "";
  const toneFor = (id) => TONES[(catIndex[id] ?? 0) % TONES.length];

  const countByCat = useMemo(() => {
    const m = {};
    tests.forEach((t) => (m[t.categoryId] = (m[t.categoryId] || 0) + 1));
    return m;
  }, [tests]);

  // KPI numbers
  const average = tests.length ? tests.reduce((s, t) => s + t.price, 0) / tests.length : 0;
  const lastUpdated = tests.reduce(
    (latest, t) => (t.updatedAt && (!latest || t.updatedAt > latest) ? t.updatedAt : latest),
    null
  );

  // Filtering: tab + search (name / category / price) + price range
  const query = search.trim().toLowerCase();
  const priceQuery = query.replace(/[₹,\s]/g, "");
  const isPriceQuery = /^\d+(\.\d+)?$/.test(priceQuery);
  const rangeTest = PRICE_RANGES.find((r) => r.key === priceRange).test;

  const filtered = useMemo(() => {
    const found = tests.filter((t) => {
      if (activeCat !== "all" && t.categoryId !== activeCat) return false;
      if (!rangeTest(t.price)) return false;
      if (!query) return true;
      if (t.name.toLowerCase().includes(query)) return true;
      if (catName(t.categoryId).toLowerCase().includes(query)) return true;
      return isPriceQuery && t.price.toFixed(2).includes(priceQuery);
    });
    if (!query || !isPriceQuery) return found;
    const exact = (t) => (t.price === Number(priceQuery) ? 0 : 1);
    return [...found].sort((a, b) => exact(a) - exact(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tests, activeCat, query, priceRange, categories]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const resetPage = (fn) => (v) => {
    fn(v);
    setPage(1);
  };

  function applySaved(id, price) {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, price, updatedAt: new Date().toISOString() } : t))
    );
  }

  async function saveOne(test, raw) {
    const price = Number(raw);
    if (raw === "" || Number.isNaN(price) || price < 0) {
      setRowError({ id: test.id, message: "Enter a valid price." });
      return;
    }
    setRowError({ id: null, message: "" });
    setSavingId(test.id);
    try {
      await updateTestPriceApi(test.id, price);
      applySaved(test.id, price);
      setEditingId(null);
      showToast(`${test.name} price updated to ${money(price)}.`, "success");
    } catch (err) {
      const message = err.message || "Failed to update.";
      setRowError({ id: test.id, message });
      showToast(`${test.name}: ${message}`, "error");
    } finally {
      setSavingId(null);
    }
  }

  // ---- bulk update ----
  function startBulk() {
    setEditingId(null);
    setBulkValues({});
    setBulk(true);
  }
  function cancelBulk() {
    setBulk(false);
    setBulkValues({});
  }
  const bulkChanges = Object.entries(bulkValues)
    .map(([id, v]) => ({ test: tests.find((t) => t.id === Number(id)), raw: v }))
    .filter(({ test, raw }) => test && raw !== "" && Number(raw) !== test.price);
  const bulkInvalid = bulkChanges.some(({ raw }) => Number.isNaN(Number(raw)) || Number(raw) < 0);

  async function saveBulk() {
    if (!bulkChanges.length || bulkInvalid) return;
    setBulkSaving(true);
    const results = await Promise.allSettled(
      bulkChanges.map(({ test, raw }) =>
        updateTestPriceApi(test.id, Number(raw)).then(() => applySaved(test.id, Number(raw)))
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    setBulkSaving(false);
    if (failed) {
      showToast(`${ok} updated, ${failed} failed. Please retry the failed ones.`, "error");
      // keep only failed rows in the edit state
      setBulkValues(
        Object.fromEntries(
          bulkChanges.filter((_, i) => results[i].status === "rejected").map(({ test, raw }) => [test.id, raw])
        )
      );
    } else {
      showToast(`${ok} price${ok === 1 ? "" : "s"} updated.`, "success");
      cancelBulk();
    }
  }

  const tabBase =
    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer";

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={FlaskConical} tint="bg-teal-50 text-teal-600" label="Total Tests" value={tests.length} />
        <KpiCard
          icon={IndianRupee}
          tint="bg-emerald-50 text-emerald-600"
          label="Average Price"
          value={money(average)}
        />
        <KpiCard
          icon={Calendar}
          tint="bg-sky-50 text-sky-600"
          label="Last Updated"
          value={formatDate(lastUpdated)}
        />
        <button
          onClick={bulk ? cancelBulk : startBulk}
          className="flex items-center justify-between gap-3 rounded-xl bg-teal-600 p-4 text-left text-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:bg-teal-700 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <RefreshCw size={22} />
            </span>
            <span>
              <span className="block text-base font-semibold">{bulk ? "Cancel Bulk Edit" : "Update Prices"}</span>
              <span className="block text-sm text-teal-50/90">
                {bulk ? "Discard unsaved changes" : "Edit many prices at once"}
              </span>
            </span>
          </span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => resetPage(setActiveCat)("all")}
            className={`${tabBase} ${
              activeCat === "all" ? "bg-teal-600 text-white" : "bg-teal-50/60 text-gray-600 hover:bg-teal-50"
            }`}
          >
            <LayoutGrid size={15} /> All ({tests.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => resetPage(setActiveCat)(c.id)}
              className={`${tabBase} ${
                activeCat === c.id ? "bg-teal-600 text-white" : "bg-teal-50/60 text-gray-600 hover:bg-teal-50"
              }`}
            >
              {c.name}
              <span className={activeCat === c.id ? "text-teal-100" : "text-gray-400"}>
                {countByCat[c.id] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
              placeholder="Search tests, categories or price..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <select
            value={priceRange}
            onChange={(e) => resetPage(setPriceRange)(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-500 cursor-pointer"
          >
            {PRICE_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>

          <div className="ml-auto flex overflow-hidden rounded-lg border border-gray-200">
            {[
              { key: "list", icon: List },
              { key: "grid", icon: LayoutGrid },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                title={key === "list" ? "List view" : "Grid view"}
                className={`flex h-9 w-10 items-center justify-center cursor-pointer ${
                  view === key ? "bg-teal-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Bulk bar */}
        {bulk && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-100 bg-teal-50/60 px-4 py-2.5 text-sm">
            <span className="text-teal-800">
              Bulk edit is on. Change prices below, then save.{" "}
              <strong>{bulkChanges.length}</strong> changed.
            </span>
            <div className="flex gap-2">
              <button
                onClick={cancelBulk}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveBulk}
                disabled={!bulkChanges.length || bulkInvalid || bulkSaving}
                className="rounded-lg bg-teal-600 px-3 py-1.5 font-medium text-white hover:bg-teal-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                {bulkSaving ? "Saving..." : `Save ${bulkChanges.length || ""} change${bulkChanges.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <p className="flex items-center gap-2 py-8 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading tests...
          </p>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No tests found.</p>
        ) : view === "list" ? (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-teal-50/70 text-left text-gray-700">
                  <th className="w-14 px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Test Name</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Current Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t, i) => {
                  const tone = toneFor(t.categoryId);
                  const Icon = tone.icon;
                  const editing = editingId === t.id;
                  return (
                    <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-gray-500">{start + i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.tile}`}>
                            <Icon size={15} />
                          </span>
                          <span className="font-medium text-gray-900">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${tone.badge}`}>
                          {catName(t.categoryId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {bulk ? (
                          <div className="relative w-28">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={bulkValues[t.id] ?? String(t.price)}
                              onChange={(e) => setBulkValues((p) => ({ ...p, [t.id]: e.target.value }))}
                              className="w-full rounded-lg border border-gray-200 py-1 pl-5 pr-2 text-sm font-normal outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                        ) : (
                          money(t.price)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editing && !bulk ? (
                          <div className="flex justify-end">
                            <PriceEditor
                              initial={t.price}
                              saving={savingId === t.id}
                              error={rowError.id === t.id ? rowError.message : ""}
                              onSave={(v) => saveOne(t, v)}
                              onCancel={() => setEditingId(null)}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setRowError({ id: null, message: "" });
                              setEditingId(t.id);
                            }}
                            disabled={bulk}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((t) => {
              const tone = toneFor(t.categoryId);
              const Icon = tone.icon;
              const editing = editingId === t.id;
              return (
                <div key={t.id} className="space-y-3 rounded-lg border border-gray-100 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.tile}`}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{t.name}</p>
                      <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${tone.badge}`}>
                        {catName(t.categoryId)}
                      </span>
                    </div>
                  </div>
                  {editing && !bulk ? (
                    <PriceEditor
                      initial={t.price}
                      saving={savingId === t.id}
                      error={rowError.id === t.id ? rowError.message : ""}
                      onSave={(v) => saveOne(t, v)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : bulk ? (
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={bulkValues[t.id] ?? String(t.price)}
                        onChange={(e) => setBulkValues((p) => ({ ...p, [t.id]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 py-1.5 pl-6 pr-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-900">{money(t.price)}</span>
                      <button
                        onClick={() => {
                          setRowError({ id: null, message: "" });
                          setEditingId(t.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Showing {start + 1}–{start + visible.length} of {filtered.length} tests
            </p>
            <Pagination page={safePage} pages={pages} onChange={setPage} />
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}