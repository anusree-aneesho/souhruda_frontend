import { useEffect, useRef, useState } from "react";

/**
 * Range calendar in the style of the Windows taskbar calendar.
 *
 *  Shows two months side by side (previous + current by default).
 *  Click "Oct 2026" -> month picker, click the year there -> year picker.
 *  Apply works at every level: pick a year (whole year), a month (year + month),
 *  or a start day then an end day (range). Future dates are blocked.
 *
 * onChange receives { date_from, date_to, label } (YYYY-MM-DD) or null when cleared.
 *
 * <SlotDateFilter onChange={(v) => setDates(v)} />
 */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEK = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const TEAL = "#0d9488";
const FLOOR_YEAR = 2000; // earliest year you can browse to

// Local-time formatting. Do NOT use toISOString(): in IST it shifts the day back by one.
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nice = (d) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const sameDay = (a, b) => !!a && !!b && ymd(a) === ymd(b);
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const longDay = (d) =>
  d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

/* ---------- shared pieces ---------- */

function Header({ title, onTitle, onPrev, onNext, prevOff, nextOff }) {
  const arrow = (off) => ({ ...S.arrow, opacity: off ? 0.25 : 1, cursor: off ? "not-allowed" : "pointer" });
  return (
    <div style={S.head}>
      <button type="button" style={S.title} onClick={onTitle}>{title}</button>
      <div style={{ display: "flex", gap: 2 }}>
        <button type="button" style={arrow(prevOff)} disabled={prevOff} onClick={onPrev} aria-label="Previous">▲</button>
        <button type="button" style={arrow(nextOff)} disabled={nextOff} onClick={onNext} aria-label="Next">▼</button>
      </div>
    </div>
  );
}

function Tile({ label, on, off, dim, ring, onClick }) {
  return (
    <button
      type="button"
      disabled={off}
      onClick={onClick}
      style={{
        ...S.tile,
        background: on ? TEAL : "transparent",
        color: on ? "#fff" : off ? "#cbd5e1" : dim ? "#94a3b8" : "#0f172a",
        boxShadow: ring && !on ? `inset 0 0 0 1.5px ${TEAL}` : "none",
        cursor: off ? "not-allowed" : "pointer",
        fontWeight: on ? 700 : 500,
      }}
    >
      {label}
    </button>
  );
}

function Footer({ onClear, onCancel, onApply, canApply }) {
  return (
    <div style={S.foot}>
      <button type="button" onClick={onClear} style={S.clear}>Clear</button>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={onCancel} style={S.cancel}>Cancel</button>
        <button type="button" onClick={onApply} disabled={!canApply} style={{ ...S.apply, opacity: canApply ? 1 : 0.45 }}>Apply</button>
      </div>
    </div>
  );
}

/* ---------- range calendar: two months side by side ---------- */

const idxOf = (y, m) => y * 12 + m;

function DayCell({ d, from, to, hover, maxDate, onPick, onHover }) {
  const end = to || (from && !to && hover && hover >= from ? hover : null);
  const isStart = sameDay(d, from);
  const isEnd = !!end && sameDay(d, end);
  const hasBand = !!from && !!end && !sameDay(from, end);
  const between = hasBand && d > from && d < end;
  const band = "#ccfbf1";
  let bg = "none";
  if (between) bg = band;
  else if (hasBand && isStart) bg = `linear-gradient(to right, transparent 50%, ${band} 50%)`;
  else if (hasBand && isEnd) bg = `linear-gradient(to left, transparent 50%, ${band} 50%)`;
  const off = d > maxDate;
  return (
    <div style={{ ...S.cell, background: bg }} onMouseEnter={() => !off && onHover(d)}>
      <Tile
        label={d.getDate()}
        off={off}
        on={isStart || isEnd}
        ring={sameDay(d, startOfDay(new Date()))}
        onClick={() => onPick(d)}
      />
    </div>
  );
}

function MonthGrid({ y, m, ...rest }) {
  const first = new Date(y, m, 1);
  const count = new Date(y, m + 1, 0).getDate();
  const blanks = first.getDay();
  return (
    <div style={S.grid7}>
      {WEEK.map((w) => <span key={w} style={S.week}>{w}</span>)}
      {Array.from({ length: blanks }, (_, i) => <span key={"b" + i} />)}
      {Array.from({ length: count }, (_, i) => (
        <DayCell key={i} d={new Date(y, m, i + 1)} {...rest} />
      ))}
    </div>
  );
}

function RangeCalendar({ from, to, onPick, maxDate, mode, selY, selM, onSelectYear, onSelectMonth, anchor }) {
  const today = startOfDay(new Date());
  const curYear = maxDate.getFullYear();
  const curMonth = maxDate.getMonth();
  const curIdx = idxOf(curYear, curMonth);
  // left month never goes past the month before the latest allowed one, so the right month is always allowed
  const maxIdx = curIdx - 1;
  const minIdx = idxOf(FLOOR_YEAR, 0);

  const startIdx = Math.max(minIdx, Math.min(maxIdx, anchor ? idxOf(anchor.getFullYear(), anchor.getMonth()) : maxIdx));
  const [view, setView] = useState(startIdx); // index of the LEFT month
  const [level, setLevel] = useState("days");
  const [py, setPy] = useState(Math.floor(startIdx / 12)); // year shown in the month picker
  const [decade, setDecade] = useState(Math.floor(Math.floor(startIdx / 12) / 10) * 10);
  const [hover, setHover] = useState(null);

  const clamp = (i) => Math.max(minIdx, Math.min(maxIdx, i));
  const ly = Math.floor(view / 12), lm = view % 12;
  const ry = Math.floor((view + 1) / 12), rm = (view + 1) % 12;

  if (level === "years") {
    const years = Array.from({ length: 12 }, (_, i) => decade - 1 + i);
    return (
      <div style={S.pickWrap}>
        <Header
          title={`${decade} – ${decade + 9}`}
          onTitle={() => setLevel("months")}
          onPrev={() => setDecade((d) => d - 10)}
          onNext={() => setDecade((d) => d + 10)}
          prevOff={decade <= FLOOR_YEAR}
          nextOff={decade + 10 > curYear}
        />
        <div style={S.pick}>
          {years.map((y) => (
            <Tile
              key={y}
              label={y}
              dim={y < decade || y > decade + 9}
              off={y > curYear || y < FLOOR_YEAR}
              on={mode !== "range" && y === selY}
              ring={y === curYear}
              onClick={() => { onSelectYear(y); setPy(y); setLevel("months"); }}
            />
          ))}
        </div>
        <p style={S.hint}>Pick a year to filter the whole year. You can narrow it to a month next.</p>
      </div>
    );
  }

  if (level === "months") {
    const dayMonth = mode === "month" && selY === py ? selM : py === curYear ? curMonth : 0;
    return (
      <div style={S.pickWrap}>
        <Header
          title={String(py)}
          onTitle={() => { setDecade(Math.floor(py / 10) * 10); setLevel("years"); }}
          onPrev={() => setPy((y) => y - 1)}
          onNext={() => setPy((y) => y + 1)}
          prevOff={py <= FLOOR_YEAR}
          nextOff={py >= curYear}
        />
        <div style={S.pick}>
          {MONTHS.map((n, i) => (
            <Tile
              key={n}
              label={n}
              off={idxOf(py, i) > curIdx || py < FLOOR_YEAR}
              on={mode === "month" && selY === py && selM === i}
              ring={py === curYear && i === curMonth}
              onClick={() => (mode === "month" && selY === py && selM === i ? onSelectYear(py) : onSelectMonth(py, i))}
            />
          ))}
        </div>
        <p style={S.hint}>
          {mode === "range" || selY !== py
            ? "Tap a month to filter by that month, or tap the year to pick another year."
            : mode === "year"
            ? `Whole of ${py}. Tap a month to narrow it.`
            : `${MONTHS_LONG[selM]} ${py}. Tap the month again for the whole year.`}
        </p>
        <button
          type="button"
          style={S.link}
          onClick={() => { setView(clamp(idxOf(py, dayMonth))); setLevel("days"); }}
        >
          Pick days instead
        </button>
      </div>
    );
  }

  const shared = { from: mode === "range" ? from : null, to: mode === "range" ? to : null, hover, maxDate, onPick, onHover: setHover };
  return (
    <div style={S.two} onMouseLeave={() => setHover(null)}>
      <div style={S.half}>
        <div style={S.mHead}>
          <button type="button" style={{ ...S.nav, opacity: view <= minIdx ? 0.25 : 1 }} disabled={view <= minIdx} onClick={() => setView((v) => clamp(v - 1))} aria-label="Previous month">‹</button>
          <button type="button" style={S.pill} onClick={() => { setPy(ly); setLevel("months"); }}>{MONTHS[lm]} {ly}</button>
        </div>
        <MonthGrid y={ly} m={lm} {...shared} />
      </div>
      <div style={S.divider} />
      <div style={S.half}>
        <div style={{ ...S.mHead, justifyContent: "space-between" }}>
          <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{MONTHS[rm]} {ry}</span>
          <button type="button" style={{ ...S.nav, opacity: view >= maxIdx ? 0.25 : 1 }} disabled={view >= maxIdx} onClick={() => setView((v) => clamp(v + 1))} aria-label="Next month">›</button>
        </div>
        <MonthGrid y={ry} m={rm} {...shared} />
      </div>
    </div>
  );
}

/* ---------- the filter ---------- */

export default function SlotDateFilter({ onChange, placeholder = "Select Date Range" }) {
  const todayStart = startOfDay(new Date());

  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(null);

  // what Apply will filter by: a day range, a whole year, or one month of a year
  const [mode, setMode] = useState("range"); // "range" | "year" | "month"
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [selY, setSelY] = useState(null);
  const [selM, setSelM] = useState(null);

  // snapshot of the last applied selection, so reopening (or cancelling) shows it again
  const snap = useRef(null);

  const restore = () => {
    const v = snap.current || { mode: "range", from: null, to: null, selY: null, selM: null };
    setMode(v.mode); setFrom(v.from); setTo(v.to); setSelY(v.selY); setSelM(v.selM);
  };
  const closePanel = () => { setOpen(false); restore(); };

  const box = useRef(null);
  const closeRef = useRef(closePanel);
  closeRef.current = closePanel;
  useEffect(() => {
    const onDown = (e) => box.current && !box.current.contains(e.target) && closeRef.current();
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // which month the calendar should open on
  const anchor =
    mode === "range" ? from
    : mode === "year" && selY !== null ? new Date(selY, 0, 1)
    : mode === "month" && selY !== null ? new Date(selY, selM, 1)
    : null;

  // 1st click = start, 2nd click = end (earlier date swaps), 3rd click starts over
  const onDay = (d) => {
    if (mode !== "range" || !from || (from && to)) { setMode("range"); setFrom(d); setTo(null); }
    else if (d < from) { setTo(from); setFrom(d); }
    else setTo(d);
  };
  const onSelectYear = (y) => { setMode("year"); setSelY(y); setSelM(null); };
  const onSelectMonth = (y, m) => { setMode("month"); setSelY(y); setSelM(m); };

  const canApply = mode === "range" ? !!from : selY !== null;

  const commit = (v) => {
    setApplied(v);
    onChange?.(v);
  };

  const apply = () => {
    if (!canApply) return;
    let v;
    if (mode === "range") {
      const end = to || from;
      v = {
        date_from: ymd(from),
        date_to: ymd(end),
        label: sameDay(from, end) ? nice(from) : `${nice(from)} – ${nice(end)}`,
      };
    } else if (mode === "year") {
      v = { date_from: `${selY}-01-01`, date_to: `${selY}-12-31`, label: String(selY) };
    } else {
      v = {
        date_from: ymd(new Date(selY, selM, 1)),
        date_to: ymd(new Date(selY, selM + 1, 0)),
        label: `${MONTHS[selM]} ${selY}`,
      };
    }
    snap.current = { mode, from, to, selY, selM };
    commit(v);
    setOpen(false);
  };

  const clearAll = () => {
    snap.current = null;
    setMode("range"); setFrom(null); setTo(null); setSelY(null); setSelM(null);
    if (applied) commit(null);
  };

  return (
    <div ref={box} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => (open ? closePanel() : setOpen(true))}
        style={{ ...S.trigger, borderColor: open ? TEAL : "#e2e8f0" }}
      >
        <span>📅</span>
        <span style={{ fontWeight: 600 }}>{applied ? applied.label : placeholder}</span>
        <span style={{ marginLeft: "auto", color: "#64748b" }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div style={S.pop}>
          <RangeCalendar
            from={from} to={to} onPick={onDay} maxDate={todayStart}
            mode={mode} selY={selY} selM={selM}
            onSelectYear={onSelectYear} onSelectMonth={onSelectMonth}
            anchor={anchor}
          />
          <Footer onClear={clearAll} onCancel={closePanel} onApply={apply} canApply={canApply} />
        </div>
      )}
    </div>
  );
}

const S = {
  trigger: { display: "flex", alignItems: "center", gap: 10, minWidth: 200, height: 38, padding: "0 12px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontSize: 13, color: "#0f172a" },
  pop: { position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 12px 32px rgba(15,23,42,.16)", padding: 8, maxWidth: "calc(100vw - 32px)", overflowX: "auto" },
  tabs: { display: "flex", gap: 6, marginBottom: 8, paddingLeft: 2 },
  tab: { padding: "6px 12px", border: "none", background: "transparent", color: "#64748b", borderRadius: 999, cursor: "pointer", fontSize: 13 },
  tabOn: { padding: "6px 12px", border: "none", background: "#ccfbf1", color: "#0f766e", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  row: { display: "flex", gap: 10, flexWrap: "nowrap" },
  box: { width: 288, flexShrink: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" },
  strip: { padding: "11px 14px", fontSize: 14, color: "#0f172a", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cal: { padding: "8px 10px 6px", minHeight: 300 },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 32, padding: "0 4px" },
  title: { border: "none", background: "transparent", padding: "6px 8px", marginLeft: -8, borderRadius: 6, fontSize: 13, fontWeight: 700, color: "#0f172a", cursor: "pointer" },
  arrow: { width: 24, height: 24, border: "none", background: "transparent", color: "#475569", fontSize: 10, borderRadius: 6 },
  grid7: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 2, justifyItems: "center", alignItems: "center" },
  week: { fontSize: 11, fontWeight: 600, color: "#475569", padding: "4px 0" },
  pick: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, padding: "6px 0", justifyItems: "center" },
  tile: { width: 30, height: 30, border: "none", borderRadius: 999, fontSize: 12, padding: 0 },
  hint: { margin: "4px 4px 0", fontSize: 11, color: "#64748b", lineHeight: 1.4 },
  two: { display: "flex", alignItems: "flex-start", gap: 0, padding: "2px 4px 4px", minHeight: 240 },
  half: { width: 232, flexShrink: 0, padding: "0 8px" },
  divider: { width: 1, alignSelf: "stretch", background: "#e2e8f0", margin: "0 4px" },
  mHead: { display: "flex", alignItems: "center", gap: 6, height: 36 },
  nav: { width: 26, height: 26, border: "none", background: "transparent", color: "#475569", fontSize: 18, lineHeight: 1, borderRadius: 6, cursor: "pointer" },
  pill: { padding: "4px 10px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#0f172a", cursor: "pointer" },
  cell: { width: "100%", display: "flex", justifyContent: "center" },
  pickWrap: { width: 232, padding: "2px 8px 6px", minHeight: 235, margin: "0 auto" },
  cancel: { padding: "5px 14px", border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  link: { display: "block", margin: "8px 6px 0", border: "none", background: "transparent", color: TEAL, fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 },
  foot: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px 0", marginTop: 4, borderTop: "1px solid #e2e8f0" },
  clear: { border: "none", background: "transparent", color: TEAL, fontWeight: 600, cursor: "pointer", fontSize: 13 },
  apply: { padding: "5px 14px", border: "none", background: TEAL, color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
};