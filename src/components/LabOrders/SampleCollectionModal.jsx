// src/components/LabOrders/SampleCollectionModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { markSampleCollectedApi, deleteOrderApi, getSampleCollectorsApi, getOrderApi } from "../../api/api";

// "Miss" + "Anusree" -> "Miss Anusree" (skips the title if it's empty)
const displayName = (c) => [c?.title, c?.name].filter(Boolean).join(" ");

export default function SampleCollectionModal({ order, onClose, onConfirmed, onCancelled }) {
  const [loading, setLoading] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [error, setError] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [collectorsLoading, setCollectorsLoading] = useState(true);
  // users.id of the chosen lab assistant / technician
  const [selectedCollector, setSelectedCollector] = useState("");

  // Payment status shown on the modal (Paid / Unpaid). Starts from whatever the
  // list row already knows, then is confirmed from the order itself.
  const [paymentDone, setPaymentDone] = useState(
    Boolean(order.paymentDone) || order.payment_status === "paid"
  );
  const [paymentLoading, setPaymentLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getOrderApi(order.orderId)
      .then((res) => {
        if (!cancelled) setPaymentDone(res.data?.payment_status === "paid");
      })
      .catch((err) => console.error("Failed to load payment status:", err.message))
      .finally(() => {
        if (!cancelled) setPaymentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [order.orderId]);

  useEffect(() => {
    let cancelled = false;
    getSampleCollectorsApi()
      .then((res) => {
        if (!cancelled) setCollectors(res?.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Couldn't load staff list.");
      })
      .finally(() => {
        if (!cancelled) setCollectorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Searchable collector picker ──────────────────────────
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const pickerRef = useRef(null);
  const listRef = useRef(null);

  const selected = collectors.find((c) => String(c.id) === selectedCollector);

  // Flat, filtered list (lab assistants first, then technicians) so keyboard
  // navigation has a single index to walk through.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = collectors.filter(
      (c) => !q || displayName(c).toLowerCase().includes(q)
    );
    return [
      ...matches.filter((c) => c.type === "lab_assistant"),
      ...matches.filter((c) => c.type === "technician"),
    ];
  }, [collectors, search]);

  // Close when clicking outside the picker
  useEffect(() => {
    function onDown(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Keep the highlighted row scrolled into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current
      .querySelector(`[data-index="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  function chooseCollector(c) {
    setSelectedCollector(String(c.id));
    setError(null);
    setOpen(false);
    setSearch("");
  }

  function handlePickerKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && filtered[highlight]) {
        e.preventDefault();
        chooseCollector(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.stopPropagation();
        setOpen(false);
        setSearch("");
      }
    }
  }

  async function handleConfirm() {
    if (!selectedCollector) {
      setError("Please select who collected the sample.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await markSampleCollectedApi(order.orderId, Number(selectedCollector));
      onConfirmed(order.orderId);
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelOrder() {
    setLoading(true);
    setError(null);
    try {
      await deleteOrderApi(order.orderId);
      onCancelled(order.orderId);
    } catch (err) {
      setError(err.message || "Couldn't cancel this order.");
      setConfirmingCancel(false);
    } finally {
      setLoading(false);
    }
  }

  // Home collection orders are managed from the Home Collection page, not cancelled here.
  const canCancelOrder = Boolean(onCancelled) && !order.isHomeCollection;

  const testList = order.testNames?.length ? order.testNames : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 ">
          <h2 className="text-lg font-semibold text-gray-900">
            Sample Collection — #{order.orderId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 tracking-wide mb-1">PATIENT</p>
              <p className="text-sm font-medium text-gray-900">{order.patient || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 tracking-wide mb-1">REG. NO</p>
              <p className="text-sm font-medium text-teal-600">{order.regNo || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 tracking-wide mb-1">PAYMENT</p>
              {paymentLoading ? (
                <span className="inline-block h-6 w-16 rounded-full bg-gray-100 animate-pulse" />
              ) : (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    paymentDone ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}
                >
                  {paymentDone ? "Paid" : "Unpaid"}
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">TESTS</p>
            {testList ? (
              <ul className="space-y-1.5">
                {testList.map((name, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">{order.tests} test(s)</p>
            )}
          </div>

          {!confirmingCancel && (
            <div ref={pickerRef}>
              <label
                htmlFor="sample-collector"
                className="block text-xs font-medium text-gray-400 tracking-wide mb-2"
              >
                COLLECTED BY <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  id="sample-collector"
                  type="text"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={open}
                  aria-controls="sample-collector-list"
                  value={open ? search : selected ? displayName(selected) : ""}
                  placeholder={
                    collectorsLoading
                      ? "Loading staff…"
                      : open && selected
                      ? displayName(selected)
                      : "Search lab assistant or technician"
                  }
                  disabled={collectorsLoading || loading}
                  onFocus={() => {
                    setOpen(true);
                    setHighlight(0);
                  }}
                  onClick={() => setOpen(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                    setHighlight(0);
                  }}
                  onKeyDown={handlePickerKeyDown}
                  className="w-full pl-3 pr-9 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <svg
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {open && (
                <ul
                  id="sample-collector-list"
                  ref={listRef}
                  role="listbox"
                  className="mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm py-1"
                >
                  {filtered.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-gray-400 text-center">
                      No matching staff found
                    </li>
                  ) : (
                    filtered.map((c, i) => {
                      const showHeading = i === 0 || filtered[i - 1].type !== c.type;
                      const isSelected = selectedCollector === String(c.id);
                      return (
                        <li key={`${c.type}-${c.id}`} role="presentation">
                          {showHeading && (
                            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                              {c.type === "lab_assistant" ? "Lab Assistants" : "Technicians"}
                            </p>
                          )}
                          <div
                            role="option"
                            aria-selected={isSelected}
                            data-index={i}
                            onMouseEnter={() => setHighlight(i)}
                            onMouseDown={(e) => {
                              e.preventDefault(); // keep input focus, avoid blur race
                              chooseCollector(c);
                            }}
                            className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer ${
                              highlight === i ? "bg-teal-50" : ""
                            } ${isSelected ? "text-teal-700 font-medium" : "text-gray-800"}`}
                          >
                            <span>{displayName(c)}</span>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>
          )}

          <p className="text-sm text-gray-500 pt-1">
            {confirmingCancel
              ? "Cancel this order? This cannot be undone from here."
              : "Confirm that the sample for this order has been physically collected."}
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          {confirmingCancel ? (
            <>
              <button
                onClick={() => setConfirmingCancel(false)}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={loading}
                className="px-5 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Cancelling…" : "Yes, Cancel Order"}
              </button>
            </>
          ) : (
            <>
              {canCancelOrder ? (
                <button
                  onClick={() => setConfirmingCancel(true)}
                  className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium cursor-pointer"
                >
                  Cancel Order
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={loading || collectorsLoading || !selectedCollector}
                className="px-5 py-2 text-sm rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Marking…" : "Mark Sample Collected"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}