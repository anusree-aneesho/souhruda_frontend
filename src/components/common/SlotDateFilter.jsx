import { useEffect, useRef, useState } from "react";

/**
 * Calendar filter: single day, day range, whole month, or whole year.
 * Every choice is reported as { date_from, date_to, label } (YYYY-MM-DD),
 * or null when cleared. No date library needed.
 *
 * <SlotDateFilter onChange={(v) => setDates(v)} />
 */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEK = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const TEAL = "#0d9488";

// Local-time formatting. Do NOT use toISOString(): in IST it shifts the day back by one.
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nice = (d) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const sameDay = (a, b) => a && b && ymd(a) === ymd(b);

function monthCells(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))];
}

export default function SlotDateFilter({ onChange, placeholder = "Select Date Range" }) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("month"); // "month" = year/month, "day" = day range
  const [applied, setApplied] = useState(null);

  // day range draft
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  // year / month draft
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(null); // null = whole year
  const [yearPage, setYearPage] = useState(Math.floor((today.getFullYear() - 2022) / 12));

  const box = useRef(null);
  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pickDay = (d) => {
    if (!start || end) { setStart(d); setEnd(null); }
    else if (d < start) setStart(d);
    else setEnd(d);
  };

  const canApply = tab === "day" ? !!start : year != null;

  const apply = () => {
    let v;
    if (tab === "day") {
      const to = end || start;
      v = {
        date_from: ymd(start),
        date_to: ymd(to),
        label: sameDay(start, to) ? nice(start) : `${nice(start)} – ${nice(to)}`,
      };
    } else if (month === null) {
      v = { date_from: `${year}-01-01`, date_to: `${year}-12-31`, label: String(year) };
    } else {
      const last = new Date(year, month + 1, 0);
      v = { date_from: ymd(new Date(year, month, 1)), date_to: ymd(last), label: `${MONTHS[month]} ${year}` };
    }
    setApplied(v);
    onChange?.(v);
    setOpen(false);
  };

  const clear = () => {
    setStart(null); setEnd(null); setMonth(null); setApplied(null);
    onChange?.(null);
    setOpen(false);
  };

  const shift = (n) => setView((v) => {
    const d = new Date(v.y, v.m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const years = Array.from({ length: 12 }, (_, i) => 2022 + yearPage * 12 + i);

  const renderMonth = (y, m, showPrev, showNext) => (
    <div style={S.cal}>
      <div style={S.calHead}>
        <button style={{ ...S.nav, visibility: showPrev ? "visible" : "hidden" }} onClick={() => shift(-1)}>‹</button>
        <span style={S.calTitle}>{MONTHS[m]} {y}</span>
        <button style={{ ...S.nav, visibility: showNext ? "visible" : "hidden" }} onClick={() => shift(1)}>›</button>
      </div>
      <div style={S.grid7}>
        {WEEK.map((w) => <span key={w} style={S.week}>{w}</span>)}
        {monthCells(y, m).map((d, i) => {
          if (!d) return <span key={i} />;
          const edge = sameDay(d, start) || sameDay(d, end);
          const inside = start && end && d > start && d < end;
          return (
            <button
              key={i}
              onClick={() => pickDay(d)}
              style={{
                ...S.day,
                background: edge ? TEAL : inside ? "#ccfbf1" : "transparent",
                color: edge ? "#fff" : "#1e293b",
                borderRadius: edge ? 999 : inside ? 0 : 999,
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  const next = new Date(view.y, view.m + 1, 1);

  return (
    <div ref={box} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ ...S.trigger, borderColor: open ? TEAL : "#e2e8f0" }}>
        <span>📅</span>
        <span style={{ fontWeight: 600 }}>{applied ? applied.label : placeholder}</span>
        <span style={{ marginLeft: "auto", color: "#64748b" }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div style={S.pop}>
          <div style={S.tabs}>
            <button style={tab === "month" ? S.tabOn : S.tab} onClick={() => setTab("month")}>Year / Month</button>
            <button style={tab === "day" ? S.tabOn : S.tab} onClick={() => setTab("day")}>Day / Range</button>
          </div>

          {tab === "day" ? (
            <div style={{ display: "flex" }}>
              {renderMonth(view.y, view.m, true, false)}
              <div style={{ width: 1, background: "#e2e8f0" }} />
              {renderMonth(next.getFullYear(), next.getMonth(), false, true)}
            </div>
          ) : (
            <div style={{ display: "flex" }}>
              <div style={S.cal}>
                <div style={S.calHead}>
                  <button style={S.nav} onClick={() => setYearPage((p) => p - 1)}>‹</button>
                  <span style={S.calTitle}>Year</span>
                  <button style={S.nav} onClick={() => setYearPage((p) => p + 1)}>›</button>
                </div>
                <div style={S.pick}>
                  {years.map((y) => (
                    <button key={y} onClick={() => setYear(y)} style={y === year ? S.pickOn : S.pickBtn}>{y}</button>
                  ))}
                </div>
              </div>
              <div style={{ width: 1, background: "#e2e8f0" }} />
              <div style={S.cal}>
                <div style={S.calHead}>
                  <span style={{ ...S.calTitle, margin: "0 auto" }}>{year}</span>
                </div>
                <div style={S.pick}>
                  {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => setMonth(month === i ? null : i)} style={month === i ? S.pickOn : S.pickBtn}>{m}</button>
                  ))}
                </div>
                <p style={S.hint}>
                  {month === null ? `Showing all of ${year}. Pick a month to narrow it.` : `Showing ${MONTHS[month]} ${year}. Tap it again for the whole year.`}
                </p>
              </div>
            </div>
          )}

          <div style={S.foot}>
            <button onClick={clear} style={S.clear}>Clear</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setOpen(false)} style={S.cancel}>Cancel</button>
              <button onClick={apply} disabled={!canApply} style={{ ...S.apply, opacity: canApply ? 1 : 0.5 }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  trigger: { display: "flex", alignItems: "center", gap: 10, minWidth: 230, height: 44, padding: "0 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontSize: 14, color: "#0f172a" },
  pop: { position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 12px 32px rgba(15,23,42,.14)", padding: 12 },
  tabs: { display: "flex", gap: 6, marginBottom: 8 },
  tab: { padding: "6px 12px", border: "none", background: "transparent", color: "#64748b", borderRadius: 999, cursor: "pointer", fontSize: 13 },
  tabOn: { padding: "6px 12px", border: "none", background: "#ccfbf1", color: "#0f766e", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  cal: { width: 260, padding: "4px 10px" },
  calHead: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 32, marginBottom: 6 },
  calTitle: { fontWeight: 700, fontSize: 14, color: "#0f172a" },
  nav: { width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#334155" },
  grid7: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 2 },
  week: { textAlign: "center", fontSize: 12, color: "#64748b", padding: "4px 0" },
  day: { height: 32, border: "none", cursor: "pointer", fontSize: 13 },
  pick: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 },
  pickBtn: { height: 38, border: "none", background: "transparent", borderRadius: 999, cursor: "pointer", fontSize: 14, color: "#1e293b" },
  pickOn: { height: 38, border: "none", background: TEAL, color: "#fff", borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  hint: { margin: "10px 0 0", fontSize: 12, color: "#64748b" },
  foot: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", marginTop: 10, paddingTop: 10 },
  clear: { border: "none", background: "transparent", color: TEAL, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  cancel: { padding: "8px 16px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#334155" },
  apply: { padding: "8px 18px", border: "none", background: TEAL, color: "#fff", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 },
};