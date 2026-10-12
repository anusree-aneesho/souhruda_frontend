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