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