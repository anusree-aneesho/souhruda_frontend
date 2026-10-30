// src/utils/qrDetails.js
//
// Plain-text content for the label QR, so a normal phone camera / scanner app
// shows the details straight away (no login, no page load):
//
//   HC1038|20010003
//   Ms. akshara, 24Y/F
//   Reg: 20010003
//   Tests: Fasting Blood Sugar
//   Slot: 26 Oct 2026 - Evening - 4-6 PM
//   Tech: Mr. Ravi Kumar
//   Status: Assigned
//   https://your-server/scan/HC1038      <- opens the live status page
//
// The built-in QR generator holds ~213 bytes, so lines are added in priority
// order and anything that doesn't fit is dropped (tests are shortened to
// "+N more").
const MAX_BYTES = 200;

const byteLen = (s) => new TextEncoder().encode(s).length;

// Keep the text plain ASCII-ish: some scanner apps garble "·" and long dashes.
const clean = (s) =>
  String(s ?? "")
    .replace(/[·•]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

function ageGender(p) {
  const age =
    p?.age != null && p.age !== "" && p.age !== "-"
      ? /^\d+$/.test(String(p.age))
        ? `${p.age}Y`
        : String(p.age)
      : "";
  const g = p?.gender ? String(p.gender).charAt(0).toUpperCase() : "";
  return [age, g].filter(Boolean).join("/");
}

function fitTests(names, room) {
  for (let n = names.length; n > 0; n--) {
    const more = names.length - n;
    const line = `Tests: ${names.slice(0, n).join(", ")}${more ? ` +${more} more` : ""}`;
    if (byteLen(line) <= room) return line;
  }
  return `Tests: ${names.length}`;
}

const FLAG_LABEL = { high: "High", low: "Low", abnormal: "Abnormal", critical: "Critical" };

function resultLine(r) {
  const flag = FLAG_LABEL[String(r.flag ?? "").toLowerCase()];
  return `${clean(r.name)}: ${clean(r.value)}${r.unit ? ` ${clean(r.unit)}` : ""}${flag ? ` (${flag})` : ""}`;
}

// As many result lines as fit in `room` bytes, then "+N more results".
function fitResults(rows, room) {
  const lines = rows.map(resultLine);
  for (let n = lines.length; n > 0; n--) {
    const more = lines.length - n;
    const out = lines.slice(0, n);
    if (more) out.push(`+${more} more results`);
    if (byteLen(out.join("\n")) <= room) return out;
  }
  return [];
}

export function buildQrText({ code, patient, testNames = [], results = [], when, staff, status, url }) {
  const name = clean(patient?.name).slice(0, 30);
  const lines = [
    clean(code),
    [name, ageGender(patient)].filter(Boolean).join(", "),
    patient?.regNo && patient.regNo !== "-" ? `Reg: ${clean(patient.regNo)}` : "",
  ].filter(Boolean);

  const used = () => byteLen(lines.join("\n"));
  const tryAdd = (line) => {
    if (line && used() + 1 + byteLen(line) <= MAX_BYTES) lines.push(line);
  };

  // Entered results come first (the link is kept so the rest can be opened)
  const resultRows = results.filter((r) => r && String(r.value ?? "").trim() !== "");
  if (resultRows.length) {
    const room = MAX_BYTES - used() - 1 - (url ? byteLen(url) + 1 : 0);
    fitResults(resultRows, room).forEach((l) => lines.push(l));
    tryAdd(url || "");
    tryAdd(clean(when));
    tryAdd(status ? `Status: ${clean(status)}` : "");
    return lines.join("\n");
  }

  const names = testNames.map(clean).filter(Boolean);
  if (names.length) {
    // leave room for slot / staff / status / link
    tryAdd(fitTests(names, Math.max(40, MAX_BYTES - used() - 1 - 70)));
  }
  tryAdd(clean(when));
  tryAdd(staff ? `Tech: ${clean(staff)}` : "");
  tryAdd(status ? `Status: ${clean(status)}` : "");
  tryAdd(url || "");

  return lines.join("\n");
}