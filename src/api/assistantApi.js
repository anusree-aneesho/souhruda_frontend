// src/api/assistantApi.js
// API client for the SOUHRUDA Lab Assistant (FastAPI service, lab_aiservice).
// Base URL: VITE_ASSISTANT_API_URL (optional) or http://127.0.0.1:8004
// (the lab_aiservice default port). Authentication reuses the Souhruda SPA
// Laravel Sanctum token stored under `souhruda_auth_token`.

const DEFAULT_BASE_URL = "http://127.0.0.1:8004";

function getBaseUrl() {
  const configured = import.meta.env.VITE_ASSISTANT_API_URL;
  return (configured || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function authHeaders() {
  const token = localStorage.getItem("souhruda_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getSessionId() {
  let sessionId = sessionStorage.getItem("souhruda_assistant_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("souhruda_assistant_session_id", sessionId);
  }
  return sessionId;
}

function metaHeaders() {
  return {
    "X-Session-ID": getSessionId(),
    "X-Request-ID": `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };
}

function errorMessage(payload, status) {
  return payload?.detail || `Server error (${status})`;
}

async function request(path, { method = "GET", body, headers = {}, formData } = {}) {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...authHeaders(),
      ...metaHeaders(),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: formData || (body ? JSON.stringify(body) : undefined),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(errorMessage(data, response.status));
  }
  if (response.status === 204) return null;
  return response.json();
}

// ---------------------------------------------------------------------------
// Chat (ask / stream)
// ---------------------------------------------------------------------------

function askPayload(message, options = {}) {
  const attachments = (options.attachments || []).map((a) => ({
    name: a.name,
    mime: a.mime,
    size: a.size,
    url: a.url,
  }));
  return {
    message,
    conversation_id: typeof options.conversationId === "number" ? options.conversationId : null,
    attachments,
  };
}

// Non-streaming JSON response:
// { request_id, intent, message, data, sources, conversation_id,
//   user_message_id, assistant_message_id }
export async function assistantAsk(message, options = {}) {
  return request("/api/v1/assistant/ask", {
    method: "POST",
    body: askPayload(message, options),
  });
}

// Server-Sent Events streaming: emits `meta`, `token` deltas, then `done`.
// `options`: { conversationId, attachments }, callbacks: { onMeta, onToken, onDone }
export async function assistantAskStream(message, options = {}, { onMeta, onToken, onDone } = {}) {
  const response = await fetch(`${getBaseUrl()}/api/v1/assistant/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeaders(),
      ...metaHeaders(),
    },
    body: JSON.stringify(askPayload(message, options)),
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw new Error(errorMessage(data, response.status));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  const emitDone = (data) => {
    if (finished) return;
    finished = true;
    onDone?.(data || {});
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";

      for (const frame of frames) {
        const trimmed = frame.trim();
        if (!trimmed.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(trimmed.slice(6));
          if (data.type === "meta") onMeta?.(data);
          else if (data.type === "token") onToken?.(data.content);
          else if (data.type === "done") emitDone(data);
        } catch {
          // Ignore malformed SSE frames.
        }
      }
    }
  } finally {
    emitDone({});
  }
}

// ---------------------------------------------------------------------------
// Conversations (history)
// ---------------------------------------------------------------------------

export function assistantConversations(query = "") {
  const params = query ? `?query=${encodeURIComponent(query)}` : "";
  return request(`/api/v1/assistant/conversations${params}`);
}

export function assistantCreateConversation() {
  return request("/api/v1/assistant/conversations", { method: "POST", body: {} });
}

export function assistantConversationMessages(conversationId) {
  return request(`/api/v1/assistant/conversations/${conversationId}/messages`);
}

export function assistantRenameConversation(conversationId, title) {
  return request(`/api/v1/assistant/conversations/${conversationId}`, {
    method: "PATCH",
    body: { title },
  });
}

export function assistantDeleteConversation(conversationId) {
  return request(`/api/v1/assistant/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export function assistantFeedback(messageId, rating) {
  return request(`/api/v1/assistant/messages/${messageId}/feedback`, {
    method: "POST",
    body: { rating },
  });
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateUpload(file) {
  const allowed = ["png", "jpg", "jpeg", "gif", "webp", "pdf", "txt", "csv", "md"];
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!allowed.includes(ext)) return `.${ext} files are not supported`;
  if (file.size > MAX_UPLOAD_BYTES) return "File exceeds 5 MB limit";
  return null;
}

export async function assistantUpload(file) {
  const formData = new FormData();
  formData.append("file", file);
  const data = await request("/api/v1/assistant/uploads", { method: "POST", formData });
  return data;
}

// Attachment endpoints are auth-gated, so a plain <a href> cannot fetch them.
// Fetch the blob with the Bearer token and hand back an object URL.
export async function fetchAttachmentUrl(url) {
  const path = url.startsWith("http") ? url.replace(getBaseUrl(), "") : url;
  const response = await fetch(`${getBaseUrl()}${path}`, {
    headers: { Accept: "*/*", ...authHeaders() },
  });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function downloadAttachment(url, name) {
  const objectUrl = await fetchAttachmentUrl(url);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = name || "attachment";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
}
