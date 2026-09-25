const API_BASE_URL = "http://localhost:8000/api/v1";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("souhruda_auth_token");
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      // Let the browser set "Content-Type: multipart/form-data; boundary=..."
      // itself when sending a file — setting it manually breaks the boundary.
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && token) {
    // Session expired (or token invalid) — clear it and redirect with a message
    localStorage.removeItem("souhruda_auth_token");
    localStorage.removeItem("souhruda_auth_user");
    sessionStorage.setItem(
      "souhruda_session_message",
      data.message || "Your session has expired. Please log in again."
    );
    window.location.href = "/login";
    return new Promise(() => {}); // halt further processing; we're navigating away
  }

  if (!response.ok) {
    const message =
      data.message ||
      Object.values(data.errors || {})[0]?.[0] ||
      "Something went wrong. Please try again.";
    const err = new Error(message);
    if (data.errors) err.errors = data.errors;
    throw err;
  }

  return data;
}

// ── Authentication ─────────────────────────────────────────

export async function loginApi(email, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMeApi() {
  return request("/me");
}

export async function logoutApi() {
  return request("/logout", {
    method: "POST",
  });
}

// ── Technicians ──────────────────────────────

export async function getTechniciansApi() {
  return request("/technicians");
}

export async function createTechnicianApi(payload) {
  return request("/technicians", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTechnicianApi(id, payload) {
  return request(`/technicians/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTechnicianApi(id) {
  return request(`/technicians/${id}`, {
    method: "DELETE",
  });
}

// ── Patients ───────────────────────────────────────────────

export async function getPatientsApi(query = "", page = 1) {       //<-paginate
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  params.append("page", page);
  return request(`/patients?${params.toString()}`);
}

export async function getPatientApi(id) {
  return request(`/patients/${id}`);
}

export async function createPatientApi(data) {
  return request("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePatientApi(id, data) {
  return request(`/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePatientApi(id) {
  return request(`/patients/${id}`, {
    method: "DELETE",
  });
}

// ── Settings ───────────────────────────────────────────────

export async function getSettingsApi() {
  return request("/settings");
}

export async function updateSettingsApi(settingsData) {
  return request("/settings", {
    method: "PUT",
    body: JSON.stringify(settingsData),
  });
}

// ── Branch ─────────────────────────────────────────────────

export async function getBranchesApi() {
  return request("/branches");
}

export async function getBranchApi(id) {
  return request(`/branches/${id}`);
}

function toBranchFormData(branchData) {
  const formData = new FormData();
  Object.entries(branchData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "logo") {
      if (value instanceof File) formData.append("logo", value);
      return;
    }
    if (key === "is_active" || key === "remove_logo") {
      formData.append(key, value ? "1" : "0");
      return;
    }
    formData.append(key, value);
  });
  return formData;
}

export async function createBranchApi(branchData) {
  return request("/branches", {
    method: "POST",
    body: toBranchFormData(branchData),
  });
}

export async function updateBranchApi(id, branchData) {
  // Laravel can't parse multipart bodies on a real PUT request, so we POST
  // with a _method override, which Laravel treats as a PUT.
  const formData = toBranchFormData(branchData);
  formData.append("_method", "PUT");
  return request(`/branches/${id}`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteBranchApi(id) {
  return request(`/branches/${id}`, {
    method: "DELETE",
  });
}

export async function getGstSettingsApi() {
  return request("/settings/gst");
}

export async function updateGstSettingsApi(gstData) {
  return request("/settings/gst", {
    method: "PUT",
    body: JSON.stringify(gstData),
  });
}

// ── Activity Log ───────────────────────────────────────────

export async function getActivityLogsApi(perPage = 5, page = 1) {
  return request(`/activity-logs?per_page=${perPage}&page=${page}`);
}

// ── Test Category ──────────────────────────────────────────

export function getTestCategories() {
  return request("/test-categories", {
    method: "GET",
  });
}

export function createTestCategory(payload) {
  return request("/test-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTestCategory(id, payload) {
  return request(`/test-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTestCategory(id) {
  return request(`/test-categories/${id}`, {
    method: "DELETE",
  });
}

// ── Home Collection ──────────────────────────────

export async function getHomeCollectionRequestsApi() {
  return request("/home-collection-requests");
}

export async function createHomeCollectionRequestApi(payload) {
  return request("/home-collection-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Fee preview for a pinned location — same distance/fee code the backend
// uses when booking, so the modal never shows a different price than the one stored.
export async function quoteHomeCollectionApi(latitude, longitude) {
  return request("/home-collection-requests/quote", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
  });
}

export async function getHomeCollectionRequestApi(hcCode) {
  return request(`/home-collection-requests/${hcCode}`);
}

export async function getNearbyTechniciansApi(hcCode) {
  return request(`/home-collection-requests/${hcCode}/nearby-technicians`);
}

export async function assignTechnicianApi(hcCode, technicianId) {
  return request(`/home-collection-requests/${hcCode}/assign-technician`, {
    method: "POST",
    body: JSON.stringify({ technician_id: technicianId }),
  });
}

export async function updateHomeCollectionStatusApi(hcCode, status, otp = null) {
  return request(`/home-collection-requests/${hcCode}/status`, {
    method: "POST",
    body: JSON.stringify(otp ? { status, otp } : { status }),
  });
}
export async function resolveHomeCollectionOrderApi(hcCode) {
  return request(`/home-collection-requests/${hcCode}/order`, {
    method: "POST",
  });
}
// ── Lab Test ───────────────────────────────────────────────

export function getLabTests(categoryId = null) {
  const query = categoryId ? `?category_id=${categoryId}` : "";

  return request(`/lab-tests${query}`, {
    method: "GET",
  });
}

export function createLabTest(payload) {
  return request("/lab-tests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLabTest(id, payload) {
  return request(`/lab-tests/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteLabTest(id) {
  return request(`/lab-tests/${id}`, {
    method: "DELETE",
  });
}

// ── Test Package ───────────────────────────────────────────────

export function getTestPackages() {
  return request("/test-packages", {
    method: "GET",
  });
}

export function createTestPackage(payload) {
  return request("/test-packages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTestPackage(id, payload) {
  return request(`/test-packages/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTestPackage(id) {
  return request(`/test-packages/${id}`, {
    method: "DELETE",
  });
}

// ── Front Officer ──────────────────────────────

export async function getFrontOfficersApi() {
  return request("/front-officers");
}

export async function createFrontOfficerApi(data) {
  return request("/front-officers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFrontOfficerApi(id, data) {
  return request(`/front-officers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteFrontOfficerApi(id) {
  return request(`/front-officers/${id}`, {
    method: "DELETE",
  });
}

// ── Lab Assistants ─────────────────────────────

export async function getLabAssistantsApi() {
  return request("/lab-assistants");
}

export async function createLabAssistantApi(data) {
  return request("/lab-assistants", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLabAssistantApi(id, data) {
  return request(`/lab-assistants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteLabAssistantApi(id) {
  return request(`/lab-assistants/${id}`, {
    method: "DELETE",
  });
}

// ── Reset Password ─────────────────────────────

export async function requestProfilePasswordResetApi() {
  return request("/profile/reset-password", {
    method: "POST",
  });
}

export async function resetPasswordApi({
  token,
  email,
  password,
  password_confirmation,
}) {
  return request("/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token,
      email,
      password,
      password_confirmation,
    }),
  });
}

export async function forgotPasswordApi(email) {
  return request("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// ── Orders ──────────────────────────────────────

export async function createOrderApi(payload) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrdersApi(params = {}) {
  const query = new URLSearchParams();
  if (params.today) query.set("today", "1");
  if (!params.today && params.status && params.status !== "All") query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", params.page);

  const qs = query.toString();
  return request(`/orders${qs ? `?${qs}` : ""}`);
}

export async function getTodaysOrdersApi() {
  return request("/orders?today=1");
}

export async function getOrderApi(id) {
  return request(`/orders/${id}`);
}

export async function saveOrderResultsApi(orderId, results) {
  return request(`/orders/${orderId}/results`, {
    method: "PATCH",
    body: JSON.stringify({ results }),
  });
}

export async function completeOrderApi(orderId, results) {
  return request(`/orders/${orderId}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ results }),
  });
}

export async function deleteOrderApi(orderId) {
  return request(`/orders/${orderId}`, {
    method: "DELETE",
  });
}

// ── Order Reports ──────────────────────────────────────

export async function getOrderReportUrlApi(orderId, letterhead = true) {
  return request(
    `/orders/${orderId}/report.pdf?letterhead=${letterhead ? 1 : 0}`
  );
}

export async function getOrderBillUrlApi(orderId) {
  return request(`/orders/${orderId}/bill.pdf`);
}

// ── FollowUp ──────────────────────────────────────

export async function getFollowUpRemindersApi(page = 1) {
  return request(`/follow-up-reminders?page=${page}`);
}

export async function markFollowUpReminderDoneApi(id) {
  return request(`/follow-up-reminders/${id}/done`, {
    method: "PATCH",
  });
}

// ── Staff Management ──────────────────────────────────────

export async function addStaffApi(payload) {
  return request("/staff-members", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getStaffMembersApi() {
  return request("/staff-members");
}

export async function updateStaffMemberApi(id, payload) {
  return request(`/staff-members/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteStaffMemberApi(id) {
  return request(`/staff-members/${id}`, {
    method: "DELETE",
  });
}

// ── Test Configuration ──────────────────────────────────────

export async function updateTestPriceApi(testId, price) {
  return request(`/lab-tests/${testId}/price`, {
    method: "PATCH",
    body: JSON.stringify({ price }),
  });
}

// ── Doctors ──────────────────────────────────────────────

export async function getDoctorsApi(page = 1) {
  return request(`/doctors?page=${page}`);
}

export async function createDoctorApi(payload) {
  return request("/doctors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDoctorApi(id, payload) {
  return request(`/doctors/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteDoctorApi(id) {
  return request(`/doctors/${id}`, {
    method: "DELETE",
  });
}
// ── Reports ──────────────────────────────────────────────
export async function getPatientsReportApi({ dateFrom, dateTo, q } = {}) {
  const params = new URLSearchParams();
  if (dateFrom) params.append("date_from", dateFrom);
  if (dateTo) params.append("date_to", dateTo);
  if (q) params.append("q", q);
  const qs = params.toString();
  return request(`/reports/patients${qs ? `?${qs}` : ""}`);
}

export async function getFinanceReportApi({ dateFrom, dateTo } = {}) {
  const params = new URLSearchParams();
  if (dateFrom) params.append("date_from", dateFrom);
  if (dateTo) params.append("date_to", dateTo);
  const qs = params.toString();
  return request(`/reports/finance${qs ? `?${qs}` : ""}`);
}

export async function getDayReportApi(date) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  const qs = params.toString();
  return request(`/reports/daily${qs ? `?${qs}` : ""}`);
}

export async function getWeeklyReportApi(weekStart) {
  const params = new URLSearchParams();
  if (weekStart) params.append("week_start", weekStart);
  const qs = params.toString();
  return request(`/reports/weekly${qs ? `?${qs}` : ""}`);
}

export async function getMonthlyReportApi(month, year) {
  const params = new URLSearchParams();
  if (month) params.append("month", month);
  if (year) params.append("year", year);
  const qs = params.toString();
  return request(`/reports/monthly${qs ? `?${qs}` : ""}`);
}

export async function getYearlyReportApi(year) {
  const params = new URLSearchParams();
  if (year) params.append("year", year);
  const qs = params.toString();
  return request(`/reports/yearly${qs ? `?${qs}` : ""}`);
}


// ── Statistics ──────────────────────────────────────

export async function getStatisticsSummaryApi() {
  return request("/statistics/summary");
}

export async function getOrdersForRangeApi(range = "today") {
  return request(`/statistics/orders-for-range?range=${range}`);
}

export async function getStatisticsRankingsApi(limit = 5) {
    return request(`/statistics/rankings?limit=${limit}`);
}

export async function getStatisticsCollectionTypesApi() {
    return request("/statistics/collection-types");
}

export async function getStatisticsAttentionAlertsApi() {
  const res = await api.get("/statistics/attention-alerts");
  return res.data;
}