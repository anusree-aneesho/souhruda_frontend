// TestPrice.jsx
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { getTestCategories, getLabTests, updateTestPriceApi } from "../../../api/api";

const PREVIEW_COUNT = 12;   // shown when the search box is empty
const SEARCH_LIMIT = 30;    // max cards shown while searching

function PriceCard({ test, categoryName, onSaved }) {
  const [value, setValue] = useState(String(test.price));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const changed = value !== "" && Number(value) !== test.price;

  async function handleSave() {
    const price = Number(value);
    if (value === "" || Number.isNaN(price) || price < 0) {
      setError("Enter a valid price.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateTestPriceApi(test.id, price);
      onSaved(test.id, price);
    } catch (err) {
      setError(err.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-3 bg-white">
      <div>
        <p className="text-sm font-semibold text-gray-900 truncate">{test.name}</p>
        <p className="text-xs text-gray-400 truncate">{categoryName}</p>
      </div>

      <p className="text-xs text-gray-500">
        Current price{" "}
        <span className="text-sm font-semibold text-teal-600">₹{test.price.toFixed(2)}</span>
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
          <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && changed && handleSave()}
            className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!changed || saving}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? "..." : "Update"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function TestPrice() {
  const [categories, setCategories] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const query = search.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!query) return tests;
    return tests.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (categoryNameById[t.categoryId] || "").toLowerCase().includes(query)
    );
  }, [tests, query, categoryNameById]);

  const visible = matches.slice(0, query ? SEARCH_LIMIT : PREVIEW_COUNT);

  function handleSaved(testId, price) {
    setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, price } : t)));
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Test Price</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Update the price of any test. New orders use the updated price.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests or categories..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-gray-400 py-6">
            <Loader2 size={14} className="animate-spin" /> Loading tests...
          </p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No tests found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map((t) => (
                <PriceCard
                  key={`${t.id}-${t.price}`}  // resets the input after a successful update
                  test={t}
                  categoryName={categoryNameById[t.categoryId]}
                  onSaved={handleSaved}
                />
              ))}
            </div>

            <p className="text-xs text-gray-400">
              {query
                ? matches.length > visible.length
                  ? `Showing ${visible.length} of ${matches.length} matches. Type more to narrow down.`
                  : `${matches.length} match${matches.length === 1 ? "" : "es"}.`
                : `Showing ${visible.length} of ${tests.length} tests. Search to find any other test.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}