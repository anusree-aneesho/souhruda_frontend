// src/api/assistantApi.js
// All Lab Assistant calls go through the Laravel API (never straight to ai_service).
// Laravel signs who the user is and forwards the request.
import { API_BASE_URL, activeBranchHeader, request } from "./api";

// ── Chat ──────────────────────────────────────────────

export function assistantAsk(message, { conversationId = null, attachments = [] } = {}) {
  return request("/assistant/ask", {
    method: "POST",
    body: JSON.stringify({ message, conversation_id: conversationId, attachments }),
  });
}

// Token streaming is not proxied through Laravel yet. ChatPanel catches this and
// falls back to assistantAsk(), so answers appear all at once instead of typing out.
export async function assistantAskStream() {
  throw new Error("Streaming is not enabled");
}

// ── Conversation history ──────────────────────────────

export function assistantConversations() {
  return request("/assistant/conversations");
}

export function assistantConversationMessages(id) {
  return request(`/assistant/conversations/${id}/messages`);
}

export function assistantRenameConversation(id, title) {
  return request(`/assistant/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export function assistantDeleteConversation(id) {
  return request(`/assistant/conversations/${id}`, { method: "DELETE" });
}

export function assistantFeedback(messageId, rating) {
  return request(`/assistant/messages/${messageId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
}

// ── Attachments ───────────────────────────────────────

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "pdf", "txt", "csv", "md"];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // same limit as the server

// Returns an error message, or "" when the file is fine.
export function validateUpload(file) {
  const extension = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`;
  }
  if (file.size === 0) return "File is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return "File is too large (max 5 MB).";
  return "";
}

export function assistantUpload(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/assistant/uploads", { method: "POST", body: form });
}

// Attachment urls come back as "/api/v1/assistant/uploads/<name>" (the AI service's
// own path). Only the file name matters; the download goes through Laravel.
function storedNameFromUrl(url) {
  return String(url).split("?")[0].replace(/\/+$/, "").split("/").pop();
}

// Attachments are login-protected, so they are fetched with the token and
// shown from a temporary object URL instead of a plain <img src>.
async function fetchAttachmentBlob(url) {
  const token = localStorage.getItem("souhruda_auth_token");
  const response = await fetch(
    `${API_BASE_URL}/assistant/uploads/${encodeURIComponent(storedNameFromUrl(url))}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...activeBranchHeader(),
      },
    }
  );
  if (!response.ok) throw new Error("Attachment unavailable");
  return response.blob();
}

export async function fetchAttachmentUrl(url) {
  return URL.createObjectURL(await fetchAttachmentBlob(url));
}

export async function downloadAttachment(url, name) {
  try {
    const objectUrl = URL.createObjectURL(await fetchAttachmentBlob(url));
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = name || "attachment";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    window.alert("Could not download this attachment.");
  }
}