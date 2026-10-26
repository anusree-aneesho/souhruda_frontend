// src/utils/rangeUtils.js
// Shared helpers for the reference-range UI (Add/Edit modal + View popup).
//
// API row shape (what GET /lab-tests returns in test.ranges and what POST/PUT expects):
//   { age_label, age_min_value, age_min_unit, age_max_value, age_max_unit, gender, range_raw }
// min is inclusive, max is exclusive, null max = no upper limit.

import { AGE_GROUP_PRESETS, PREGNANT_LABEL, GENDERS } from "../data/demographicGroups";

export const RANGE_FORMAT_REGEX =
  /^(-?\d+(\.\d+)?\s*-\s*-?\d+(\.\d+)?|[<>]\s*-?\d+(\.\d+)?|[A-Za-z][A-Za-z\s]*)$/;

export const RANGE_FORMAT_HINT = 'Use a format like "70-100", "<200", ">40", or "Negative".';

const UNIT_DAYS = { days: 1, weeks: 7, months: 30.4375, years: 365.25 };

let idCounter = 0;
const nextId = () => {
  idCounter += 1;
  return idCounter;
};

export const emptyGenders = () => ({ male: "", female: "", other: "" });
const blankBound = () => ({ value: "", unit: "years" });

const isWhole = (v) => v !== "" && v !== null && Number.isInteger(Number(v)) && Number(v) >= 0;
const boundDays = (b) => Number(b.value) * UNIT_DAYS[b.unit];

// ── Group factories ─────────────────────────────────────────────────────────

export function groupFromPreset(preset) {
  return {
    id: nextId(),
    label: preset.label,
    special: Boolean(preset.special),
    custom: false,
    min: preset.min ? { ...preset.min } : blankBound(),
    max: preset.max ? { ...preset.max } : blankBound(),
    range: "",
    split: false,
    genders: emptyGenders(),
  };
}

export function newCustomGroup() {
  return {
    id: nextId(),
    label: "",
    special: false,
    custom: true,
    min: blankBound(),
    max: blankBound(),
    range: "",
    split: false,
    genders: emptyGenders(),
  };
}

export const defaultAgeGroups = () => AGE_GROUP_PRESETS.map(groupFromPreset);

export const emptyRangeState = () => ({
  mode: "general",
  general: "",
  genders: emptyGenders(),
  groups: defaultAgeGroups(),
});

// ── API rows → grouped view (used by the View popup and the edit form) ──────

export function groupApiRows(rows = []) {
  const map = new Map();

  rows.forEach((r) => {
    const label = r.age_label || "Unnamed group";

    if (!map.has(label)) {
      map.set(label, {
        label,
        special: label === PREGNANT_LABEL,
        min: { value: r.age_min_value ?? "", unit: r.age_min_unit || "years" },
        max: { value: r.age_max_value ?? "", unit: r.age_max_unit || "years" },
        range: "",
        genders: emptyGenders(),
        split: false,
      });
    }

    const g = map.get(label);

    if (r.gender) {
      g.genders[r.gender] = r.range_raw || "";
      g.split = true;
    } else {
      g.range = r.range_raw || "";
    }
  });

  return [...map.values()];
}

export function rangeStateFromApi(mode, rows = []) {
  const state = {
    mode: mode || (rows.length ? "age_gender" : "general"),
    general: "",
    genders: emptyGenders(),
    groups: defaultAgeGroups(),
  };

  if (rows.length === 0) return state;

  if (state.mode === "general") {
    state.general = rows[0].range_raw || "";
  } else if (state.mode === "gender") {
    rows.forEach((r) => {
      if (r.gender) state.genders[r.gender] = r.range_raw || "";
    });
  } else {
    state.groups = groupApiRows(rows).map((g) => ({
      id: nextId(),
      ...g,
      custom: !AGE_GROUP_PRESETS.some((p) => p.label === g.label),
    }));
  }

  return state;
}

// ── Display ─────────────────────────────────────────────────────────────────

// max is exclusive, so "18 to <66 years" is shown as "18–65 years".
export function formatAgeRange(min, max) {
  const hasMin = min && min.value !== "" && min.value !== null && min.value !== undefined;
  const hasMax = max && max.value !== "" && max.value !== null && max.value !== undefined;

  if (!hasMin) return "";

  const minV = Number(min.value);

  if (!hasMax) return `${minV} ${min.unit} and above`;

  const maxV = Number(max.value);

  if (min.unit === max.unit) return `${minV}–${Math.max(maxV - 1, minV)} ${max.unit}`;

  return `${minV} ${min.unit} – under ${maxV} ${max.unit}`;
}

// ── Validation ──────────────────────────────────────────────────────────────

// Returns a flat object of error messages. Keys:
//   summary, general, gender.<g>, group.<id>, group.<id>.range, group.<id>.gender.<g>
export function validateRanges(rs) {
  const e = {};
  const bad = (v) => v.trim() !== "" && !RANGE_FORMAT_REGEX.test(v.trim());

  if (rs.mode === "general") {
    if (!rs.general.trim()) e.summary = "Enter a range.";
    else if (bad(rs.general)) e.general = RANGE_FORMAT_HINT;
    return e;
  }

  if (rs.mode === "gender") {
    const filled = GENDERS.filter((g) => rs.genders[g.value].trim() !== "");
    if (filled.length === 0) e.summary = "Enter a range for at least one gender.";
    filled.forEach((g) => {
      if (bad(rs.genders[g.value])) e[`gender.${g.value}`] = RANGE_FORMAT_HINT;
    });
    return e;
  }

  // age_gender
  const seen = new Set();
  const spans = [];
  let anyFilled = false;

  rs.groups.forEach((g) => {
    const filled = g.split
      ? GENDERS.some((x) => g.genders[x.value].trim() !== "")
      : g.range.trim() !== "";

    if (filled) anyFilled = true;
    // Untouched standard groups are simply skipped.
    if (!filled && !g.custom) return;

    const key = `group.${g.id}`;
    const label = g.label.trim();

    if (!label) e[key] = "Give this age group a name.";
    else if (label.length > 30) e[key] = "Name must be 30 characters or fewer.";
    else if (seen.has(label.toLowerCase())) e[key] = "That name is already used.";
    seen.add(label.toLowerCase());

    if (!g.special && !e[key]) {
      if (!isWhole(g.min.value)) {
        e[key] = "Enter a valid minimum age.";
      } else if (g.max.value !== "") {
        if (!isWhole(g.max.value)) e[key] = "Enter a valid maximum age.";
        else if (boundDays(g.max) <= boundDays(g.min)) e[key] = "Maximum age must be greater than minimum age.";
      }

      if (!e[key]) {
        spans.push({
          label,
          min: boundDays(g.min),
          max: g.max.value === "" ? Infinity : boundDays(g.max),
        });
      }
    }

    if (!filled) {
      e[`${key}.range`] = "Enter a range for this group.";
    } else if (g.split) {
      GENDERS.forEach((x) => {
        if (bad(g.genders[x.value])) e[`${key}.gender.${x.value}`] = RANGE_FORMAT_HINT;
      });
    } else if (bad(g.range)) {
      e[`${key}.range`] = RANGE_FORMAT_HINT;
    }
  });

  for (let i = 0; i < spans.length; i += 1) {
    for (let j = i + 1; j < spans.length; j += 1) {
      if (spans[i].min < spans[j].max && spans[j].min < spans[i].max) {
        e.summary = `Age groups "${spans[i].label}" and "${spans[j].label}" overlap.`;
      }
    }
  }

  if (!anyFilled && !e.summary) e.summary = "Enter a range for at least one age group.";

  return e;
}

// ── Form state → API rows ───────────────────────────────────────────────────

export function buildRanges(rs) {
  const row = (extra) => ({
    age_label: null,
    age_min_value: null,
    age_min_unit: null,
    age_max_value: null,
    age_max_unit: null,
    gender: null,
    range_raw: "",
    ...extra,
  });

  if (rs.mode === "general") {
    return rs.general.trim() ? [row({ range_raw: rs.general.trim() })] : [];
  }

  if (rs.mode === "gender") {
    return GENDERS.filter((g) => rs.genders[g.value].trim() !== "").map((g) =>
      row({ gender: g.value, range_raw: rs.genders[g.value].trim() })
    );
  }

  const rows = [];

  rs.groups.forEach((g) => {
    const base = g.special
      ? { age_label: g.label.trim() }
      : {
          age_label: g.label.trim(),
          age_min_value: Number(g.min.value),
          age_min_unit: g.min.unit,
          age_max_value: g.max.value === "" ? null : Number(g.max.value),
          age_max_unit: g.max.value === "" ? null : g.max.unit,
        };

    if (g.split && !g.special) {
      GENDERS.forEach((x) => {
        const v = g.genders[x.value].trim();
        if (v) rows.push(row({ ...base, gender: x.value, range_raw: v }));
      });
    } else if (g.range.trim()) {
      rows.push(row({ ...base, range_raw: g.range.trim() }));
    }
  });

  return rows;
}