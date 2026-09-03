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

export async function loginApi(email, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
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

// NEW — Activity Log
export async function getActivityLogsApi(perPage = 5) {
  return request(`/activity-logs?per_page=${perPage}`);
}