// src/api/insightsApi.js
// AI insights go through Laravel (it signs the AI-service token with the
// user's role + active branch), so they reuse the same auth/branch handling.
import { request } from "./api";

export function getDailyBriefApi() {
  return request("/insights/daily-brief");
}

export function getCriticalAlertsApi(limit = 20) {
  return request(`/insights/critical-alerts?limit=${limit}`);
}

export function getCriticalAlertDetailApi(orderItemId) {
  return request(`/insights/critical-alerts/${orderItemId}`);
}

export function getTatAlertsApi() {
  return request("/insights/tat-alerts");
}

export function getTestWatchApi(limit = 5) {
  return request(`/insights/test-watch?limit=${limit}`);
}

export function getTestWatchResultsApi(testId, limit = 50) {
  return request(`/insights/test-watch/${testId}/results?limit=${limit}`);
}

export function getOutbreakWatchApi() {
  return request("/insights/outbreak-watch");
}

export function getFollowUpRadarApi(limit = 5) {
  return request(`/insights/follow-up-radar?limit=${limit}`);
}