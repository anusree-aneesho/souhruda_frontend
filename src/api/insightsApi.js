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

// Demand forecast (admin / super admin only). `options` can carry an AbortSignal.
export function getForecastBranchesApi(options = {}) {
  return request("/forecast/branches", options);
}

export function getDemandForecastApi({ horizon = 7, branchId } = {}, options = {}) {
  const params = new URLSearchParams({ horizon: String(horizon) });
  if (branchId) params.set("branch_id", String(branchId));
  return request(`/forecast/daily-orders?${params.toString()}`, options);
}

// ---- Bell feed (read state lives on the AI service, not in localStorage) ----
export function getNotificationsApi({ limit = 30, unreadOnly = false } = {}) {
  return request(
    `/insights/notifications?limit=${limit}&unread_only=${unreadOnly ? "true" : "false"}`
  );
}

export function getUnreadNotificationCountApi() {
  return request("/insights/notifications/unread-count");
}

export function markNotificationReadApi(id) {
  return request(`/insights/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsReadApi() {
  return request("/insights/notifications/read-all", { method: "POST" });
}

export function getCriticalReminderApi() {
  return request("/insights/critical-reminder");
}

export function getTestQualityApi() {
  return request("/insights/test-quality");
}