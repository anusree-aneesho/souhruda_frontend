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

// ── Authentication ──────────────────────────────

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

// ── Patients ──────────────────────────────

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

// ── Settings ──────────────────────────────

export async function getSettingsApi() {
  return request("/settings");
}

export async function updateSettingsApi(settingsData) {
  return request("/settings", {
    method: "PUT",
    body: JSON.stringify(settingsData),
  });
}

// ── Branch ──────────────────────────────

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

// ── Activity Log ──────────────────────────────

export async function getActivityLogsApi(perPage = 5) {
  return request(`/activity-logs?per_page=${perPage}`);
}