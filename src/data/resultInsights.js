// src/data/resultInsights.js
export const insightMessages = {
  hb: {
    Low: "Low hemoglobin — consider iron studies to rule out anemia.",
    High: "High hemoglobin — worth reviewing for underlying causes.",
  },
  fbs: {
    High: "Elevated fasting blood sugar — consider HbA1c and diabetes screening.",
    Low: "Low fasting blood sugar — recheck fasting duration and symptoms.",
  },
  chol: {
    High: "Elevated cholesterol — lifestyle counseling and lipid profile follow-up advised.",
  },
  tsh: {
    High: "Elevated TSH — may indicate hypothyroidism, consider T3/T4 follow-up.",
    Low: "Low TSH — may indicate hyperthyroidism, consider T3/T4 follow-up.",
  },
  widal: {
    Abnormal: "Positive Widal — correlate clinically, consider repeat testing or culture.",
  },
};

export function getInsight(testId, flag) {
  return insightMessages[testId]?.[flag] || null;
}