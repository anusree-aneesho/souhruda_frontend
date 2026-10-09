// src/components/common/LabAssistant/ChatPanel.jsx
import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Maximize2,
  Minimize2,
  PanelLeft,
  SquarePen,
  Paperclip,
  FileText,
  Loader2,
  Bot,
} from "lucide-react";
import ChatMessage from "./ChatMessage";
import SuggestedPrompts from "./SuggestedPrompts";
import ChatHistorySidebar from "./ChatHistorySidebar";
import { formatBytes } from "./assistantUtils";
import {
  assistantAsk,
  assistantAskStream,
  assistantConversations,
  assistantConversationMessages,
  assistantRenameConversation,
  assistantDeleteConversation,
  assistantFeedback,
  assistantUpload,
  validateUpload,
} from "../../../api/assistantApi";

const MAX_ATTACHMENTS = 5;

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  // Bumped whenever the visible conversation changes, so in-flight streams
  // stop writing into a conversation the user has navigated away from.
  const epochRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // On mount: restore the most recent conversation (or show the welcome state).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await assistantConversations();
        if (cancelled) return;
        const latest = data?.conversations || [];
        setConversations(latest);
        if (latest.length) await openConversation(latest[0].id);
      } catch {
        // History unavailable — start with an empty chat.
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshConversations() {
    try {
      const data = await assistantConversations();
      setConversations(data?.conversations || []);
    } catch {
      // Keep the current list on failure.
    }
  }

  async function openConversation(id) {
    epochRef.current += 1;
    setActiveId(id);
    setMessages([]);
    try {
      const data = await assistantConversationMessages(id);
      setMessages(
        (data?.messages || []).map((message) => ({
          id: `srv_${message.id}`,
          role: message.role === "assistant" ? "bot" : "user",
          text: message.content || "",
          createdAt: message.created_at,
          response: message.intent
            ? { intent: message.intent, data: message.data, sources: message.sources || [] }
            : undefined,
          attachments: message.attachments || [],
          feedback: message.feedback || null,
          serverId: message.id,
        }))
      );
    } catch {
      setMessages([]);
    }
  }

  function newChat() {
    epochRef.current += 1;
    setActiveId(null);
    setMessages([]);
    setIsHistoryOpen(false);
    setInput("");
    setFiles([]);
    setFileError("");
  }

  async function sendMessage(textToSend) {
    const trimmed = (textToSend ?? input).trim();
    if (isLoading || (!trimmed && files.length === 0)) return;
    setInput("");
    setFileError("");

    // 1. Upload staged attachments before sending the message.
    let attachments = [];
    if (files.length > 0) {
      setFiles((prev) => prev.map((file) => ({ ...file, status: "uploading" })));
      try {
        for (const file of files) {
          const uploaded = await assistantUpload(file.file);
          attachments.push({
            name: uploaded.name,
            size: uploaded.size,
            mime: uploaded.mime,
            url: uploaded.url,
          });
        }
        setFiles([]);
      } catch {
        setFiles((prev) => prev.map((file) => ({ ...file, status: "ready" })));
        setFileError("Upload failed. Your files are still staged — try again.");
        return;
      }
    }

    const epoch = epochRef.current;
    const userMsgId = `usr_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;
    const startedConversationId = activeId;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        text: trimmed,
        createdAt: new Date().toISOString(),
        attachments,
      },
      { id: botMsgId, role: "bot", text: "", createdAt: new Date().toISOString() },
    ]);
    setIsLoading(true);

    const applyMeta = (meta) => {
      if (epochRef.current !== epoch) return;
      if (typeof meta.conversation_id === "number") setActiveId(meta.conversation_id);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === botMsgId
            ? {
                ...message,
                response: {
                  intent: meta.intent,
                  data: meta.data,
                  sources: meta.sources || [],
                },
              }
            : message
        )
      );
    };

    const applyDone = (data) => {
      if (epochRef.current !== epoch) return;
      setMessages((prev) =>
        prev.map((message) => {
          if (data?.user_message_id && message.id === userMsgId) {
            return { ...message, serverId: data.user_message_id };
          }
          if (data?.assistant_message_id && message.id === botMsgId) {
            return { ...message, serverId: data.assistant_message_id };
          }
          return message;
        })
      );
    };

    try {
      await assistantAskStream(
        trimmed,
        { conversationId: startedConversationId, attachments },
        {
          onMeta: applyMeta,
          onToken: (chunk) => {
            if (epochRef.current !== epoch) return;
            setMessages((prev) =>
              prev.map((message) =>
                message.id === botMsgId ? { ...message, text: message.text + chunk } : message
              )
            );
          },
          onDone: applyDone,
        }
      );
    } catch {
      // Streaming unavailable — fall back to the non-streaming endpoint.
      try {
        const data = await assistantAsk(trimmed, {
          conversationId: startedConversationId,
          attachments,
        });
        if (epochRef.current !== epoch) return;
        if (typeof data.conversation_id === "number") setActiveId(data.conversation_id);
        setMessages((prev) =>
          prev.map((message) => {
            if (message.id === botMsgId) {
              return {
                ...message,
                text: data.message || "",
                response: {
                  intent: data.intent,
                  data: data.data,
                  sources: data.sources || [],
                },
                serverId: data.assistant_message_id ?? message.serverId,
              };
            }
            if (message.id === userMsgId && data.user_message_id) {
              return { ...message, serverId: data.user_message_id };
            }
            return message;
          })
        );
      } catch (askErr) {
        if (epochRef.current !== epoch) return;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === botMsgId
              ? { ...message, text: `Error: ${askErr.message || "Failed to process request."}` }
              : message
          )
        );
      }
    } finally {
      setIsLoading(false);
      refreshConversations();
    }
  }

  async function handleFeedback(message, rating) {
    if (!message.serverId) return;
    try {
      await assistantFeedback(message.serverId, rating);
      setMessages((prev) =>
        prev.map((item) => (item.id === message.id ? { ...item, feedback: rating } : item))
      );
    } catch {
      // Feedback is best-effort; keep the current state on failure.
    }
  }

  async function handleRename(id, title) {
    try {
      await assistantRenameConversation(id, title);
    } catch {
      return;
    }
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id ? { ...conversation, title } : conversation
      )
    );
  }

  async function handleDelete(id) {
    try {
      await assistantDeleteConversation(id);
    } catch {
      return;
    }
    setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
    if (id === activeId) newChat();
  }

  function handleFilesSelected(event) {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    setFileError("");

    const accepted = [];
    for (const file of picked) {
      const error = validateUpload(file);
      if (error) {
        setFileError(`${file.name}: ${error}`);
        continue;
      }
      accepted.push({
        id: `${file.name}_${file.lastModified}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        mime: file.type,
        status: "ready",
      });
    }
    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted].slice(0, MAX_ATTACHMENTS));
    }
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  const activeTitle =
    conversations.find((conversation) => conversation.id === activeId)?.title || "Lab Assistant";
  const sizeClass = isWide
    ? "w-[92vw] sm:w-[680px]"
    : isHistoryOpen
      ? "w-[92vw] sm:w-[560px]"
      : "w-80 sm:w-96";

  return (
    <div
      className={`${sizeClass} bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200`}
      style={{ maxHeight: "70vh" }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="bg-teal-600 px-3 py-3 flex items-center gap-1 shrink-0">
        <button
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          title={isHistoryOpen ? "Hide chat history" : "Show chat history"}
          className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/10"
        >
          <PanelLeft size={16} />
        </button>

        <div className="flex-1 min-w-0 px-1">
          <p className="text-sm font-bold text-white truncate">{activeTitle}</p>
          <p className="text-xs text-teal-100 truncate">Ask about orders, revenue, results...</p>
        </div>

        <button
          onClick={newChat}
          title="New chat"
          className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/10"
        >
          <SquarePen size={16} />
        </button>
        <button
          onClick={() => setIsWide((prev) => !prev)}
          title={isWide ? "Collapse panel" : "Expand panel"}
          className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/10"
        >
          {isWide ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          onClick={onClose}
          title="Close"
          className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {isHistoryOpen && (
          <ChatHistorySidebar
            conversations={conversations}
            activeId={activeId}
            loading={historyLoading}
            onSelect={openConversation}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !isLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
                  <Bot size={24} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">How can I help?</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Ask about doctors, patients, orders, reports, or revenue.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id ?? index}
                  role={msg.role}
                  text={msg.text}
                  response={msg.response}
                  createdAt={msg.createdAt}
                  attachments={msg.attachments}
                  feedback={msg.feedback}
                  canRate={msg.role === "bot" && Boolean(msg.serverId) && Boolean(msg.text)}
                  onFeedback={(rating) => handleFeedback(msg, rating)}
                />
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-400">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:120ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {messages.length === 0 && <SuggestedPrompts onSelect={sendMessage} />}

          {fileError && (
            <p className="px-4 pb-1 text-[11px] text-red-600">{fileError}</p>
          )}

          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {files.map((file) => (
                <span
                  key={file.id}
                  className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-700 ${
                    file.status === "uploading" ? "opacity-60" : ""
                  }`}
                >
                  <FileText size={12} className="shrink-0 text-teal-600" />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <span className="text-gray-400">{formatBytes(file.size)}</span>
                  {file.status === "uploading" ? (
                    <Loader2 size={11} className="shrink-0 animate-spin text-teal-600" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      title="Remove file"
                      className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 shrink-0"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept="image/png,image/jpeg,image/gif,image/webp,.pdf,.txt,.csv,.md"
              onChange={handleFilesSelected}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              disabled={files.length >= MAX_ATTACHMENTS}
              className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center hover:border-teal-300 hover:text-teal-600 transition-colors disabled:opacity-40"
            >
              <Paperclip size={16} />
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a question..."
              className="flex-1 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={(!input.trim() && files.length === 0) || isLoading}
              className="h-9 w-9 shrink-0 rounded-lg bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
