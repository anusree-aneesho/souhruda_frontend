const API_BASE_URL = "http://localhost:8000/api/v1";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("souhruda_auth_token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.errors?.email?.[0] ||
        "Something went wrong. Please try again."
    );
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

export async function getPatientsApi(query = "") {
  return request(
    `/patients${query ? `?q=${encodeURIComponent(query)}` : ""}`
  );
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

export async function createBranchApi(branchData) {
  return request("/branches", {
    method: "POST",
    body: JSON.stringify(branchData),
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