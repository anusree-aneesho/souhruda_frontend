// src/data/demographicGroups.js
// Standard age groups offered in the Add Test modal ("Age & Gender Based" tab).
// The API receives the bounds explicitly, so custom groups work the same way.
// min is inclusive, max is exclusive, max: null means no upper limit.

export const RANGE_MODES = {
  GENERAL: "general",
  GENDER: "gender",
  AGE_GENDER: "age_gender",
};

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other", optional: true },
];

export const AGE_UNITS = ["days", "weeks", "months", "years"];

// Must match LabTestRange::PREGNANT_LABEL on the backend.
export const PREGNANT_LABEL = "Pregnant Women";

export const AGE_GROUP_PRESETS = [
  { label: "Newborns", hint: "0–2 weeks", min: { value: 0, unit: "days" }, max: { value: 15, unit: "days" } },
  { label: "Infants", hint: "2–6 months", min: { value: 15, unit: "days" }, max: { value: 6, unit: "months" } },
  { label: "Children", hint: "6 months–12 years", min: { value: 6, unit: "months" }, max: { value: 13, unit: "years" } },
  { label: "Teenagers", hint: "13–17 years", min: { value: 13, unit: "years" }, max: { value: 18, unit: "years" } },
  { label: "Adults", hint: "18–65 years", min: { value: 18, unit: "years" }, max: { value: 66, unit: "years" } },
  { label: "Older Adults", hint: "Over 65 years", min: { value: 66, unit: "years" }, max: null },
  { label: PREGNANT_LABEL, hint: "", special: true },
];

// TEMPORARY: other files may still import this. Once
//   grep -rn DEMOGRAPHIC_GROUPS src
// shows no results outside this file, delete it.
// export const DEMOGRAPHIC_GROUPS = [
//   "Newborns (0–2 weeks)",
//   "Infants (2–6 months)",
//   "Children (6 months–12 years)",
//   "Teenagers (13–17 years)",
//   "Adult Men (18–65 years)",
//   "Adult Women (18–65 years)",
//   "Pregnant Women",
//   "Older Adults (Over 65 years)",
// ];