// src/data/followUpConfig.js
export const followUpWeeks = {
  hb: 8,
  fbs: 12,
  chol: 12,
  tsh: 6,
  widal: 2,
};

export function getFollowUpWeeks(testId) {
  return followUpWeeks[testId] || 8;
}