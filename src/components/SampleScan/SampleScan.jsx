// src/components/SampleScan/SampleScan.jsx
//
// Opened by scanning the QR on a sample label (/scan/HC1037), or by scanning
// the Code128 barcode into the box at the top (barcode scanners type the
// value + Enter, so no extra setup is needed).
//
// Shows: 1) patient & sample details, 2) tests & sample info,
//        3) live processing status.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSampleScanApi } from "../../api/api";
import { parseScannedCode } from "../../utils/sampleBarcode";
import { formatNameWithTitle } from "../Patients/patientTitles";

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function Row({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 tracking-wide uppercase">{label}</p>
      <div className="text-sm font-semibold text-gray-900 break-words">{children || "—"}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

const DOT = {
  done: "bg-teal-600 border-teal-600 text-white",
  current: "bg-white border-teal-600 text-teal-600 ring-4 ring-teal-100",
  pending: "bg-white border-gray-300 text-gray-300",
};

export default function SampleScan() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) {
      setData(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    getSampleScanApi(parseScannedCode(code))
      .then((d) => !cancelled && setData(d))
      .catch((e) => {
        if (!cancelled) {
          setData(null);
          setError(e.message || "No sample found for this code.");
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [code]);

  function onSubmit(e) {
    e.preventDefault();
    const v = parseScannedCode(input);
    if (v) {
      navigate(`/scan/${encodeURIComponent(v)}`);
      setInput("");
    }
  }

  const p = data?.patient;
  const ageGender = [p?.age != null ? `${p.age} yrs` : null, p?.gender].filter(Boolean).join(" · ");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Sample scan</h1>

      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scan barcode or type sample ID (e.g. HC1037 or 48213)"
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700">
          Look up
        </button>
      </form>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {data && (
        <>
          {data.status === "cancelled" && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              This request was cancelled.
            </p>
          )}

          <div className="flex items-center justify-between gap-4 rounded-xl bg-teal-50 border border-teal-100 px-5 py-4">
            <div className="min-w-0">
              <p className="text-[10px] text-teal-700 tracking-wide uppercase">Patient</p>
              <p className="text-lg font-semibold text-gray-900 truncate">
                {p && formatNameWithTitle(p.title, p.name)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-teal-700 tracking-wide uppercase">Register number</p>
              <p className="text-lg font-bold text-teal-700">{p?.patient_id || "—"}</p>
            </div>
          </div>

          <Section title="1. Patient & sample details">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Row label="Patient name">{p && formatNameWithTitle(p.title, p.name)}</Row>
              <Row label="Register number">{p?.patient_id}</Row>
              <Row label="Sample ID / barcode">{data.barcode}</Row>
              {data.order_no && <Row label="Order no">{data.order_no}</Row>}
              {data.hc_code && <Row label="Home collection code">{data.hc_code}</Row>}
              <Row label="Age / gender">{ageGender}</Row>
              <Row label="Registered">{fmtDateTime(p?.registered_at)}</Row>
            </div>
          </Section>

          <Section title="2. Tests & results">
            <div className="divide-y divide-gray-100 mb-5">
              {data.tests.map((t, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                    {t.range && <p className="text-xs text-gray-400">Normal: {t.range}</p>}
                  </div>
                  {t.result != null ? (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {t.result} {t.unit}
                      </p>
                      {t.flag && (
                        <span
                          className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            String(t.flag).toLowerCase() === "normal"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {t.flag}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 shrink-0">Result pending</span>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Row label="Collection date & time">{fmtDateTime(data.collection.collected_at)}</Row>
              <Row label="Collected by">{data.collection.collected_by}</Row>
              {data.collection.slot && <Row label="Booked slot">{data.collection.slot}</Row>}
            </div>
          </Section>

          <Section title="3. Sample processing status">
            <ol className="space-y-4">
              {data.stages.map((s) => (
                <li key={s.key} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${DOT[s.state]}`}
                  >
                    {s.state === "done" ? "✓" : ""}
                  </span>
                  <div>
                    <p
                      className={`text-sm ${
                        s.state === "pending" ? "text-gray-400" : "font-semibold text-gray-900"
                      }`}
                    >
                      {s.label}
                      {s.state === "current" && (
                        <span className="ml-2 text-xs font-medium text-teal-600">In progress</span>
                      )}
                    </p>
                    {(s.detail || s.at) && (
                      <p className="text-xs text-gray-500">
                        {[s.detail, s.at && fmtDateTime(s.at)].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </>
      )}
    </div>
  );
}