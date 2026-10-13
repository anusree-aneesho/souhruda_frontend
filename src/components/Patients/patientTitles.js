// Shared list of patient titles + the gender each one implies (if any).
export const PATIENT_TITLES = ["Mr", "Mrs", "Ms", "Miss", "Master", "Baby", "Dr"];

// Titles for staff / users (no Master / Baby).
export const STAFF_TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr"];

// "Mr" + "David" -> "Mr. David". Miss / Master / Baby are written without a dot.
const TITLES_WITH_DOT = ["Mr", "Mrs", "Ms", "Dr"];
export function formatNameWithTitle(title, name) {
  if (!title) return name;
  return `${title}${TITLES_WITH_DOT.includes(title) ? "." : ""} ${name}`;
}

export const TITLE_GENDER = {
  Mr: "Male",
  Master: "Male",
  Mrs: "Female",
  Ms: "Female",
  Miss: "Female",
};

// "Mr" + "Pikjh PP" -> "Mr. Pikjh PP" (dot on every title, like the Lab Orders list).
// If the stored name already starts with the title, it is returned as it is,
// so the title is never shown twice.
export function nameWithTitle(title, name) {
  const n = String(name ?? "").trim();
  const t = String(title ?? "").trim().replace(/\.$/, "").toLowerCase();
  if (!t) return n;

  const lower = n.toLowerCase();
  const alreadyHasTitle = lower.startsWith(`${t}.`) || lower.startsWith(`${t} `);

  return alreadyHasTitle ? n : `${String(title).trim().replace(/\.$/, "")}. ${n}`;
}