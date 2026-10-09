// src/components/common/LabAssistant/ChatHistorySidebar.jsx
// Slide-in conversation history: search, date groups, inline rename + delete.
import { useState } from "react";
import { Search, Pencil, Trash2, MessageSquare } from "lucide-react";
import { formatRelative, groupByDate } from "./time";

export default function ChatHistorySidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onRename,
  onDelete,
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const filtered = conversations.filter((conversation) =>
    (conversation.title || "").toLowerCase().includes(query.trim().toLowerCase())
  );
  const groups = groupByDate(filtered);

  function startRename(conversation) {
    setConfirmId(null);
    setEditingId(conversation.id);
    setDraft(conversation.title || "");
  }

  function commitRename() {
    const value = draft.trim();
    const original = conversations.find((conversation) => conversation.id === editingId);
    if (value && original && value !== original.title) onRename(editingId, value);
    setEditingId(null);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename();
    } else if (event.key === "Escape") {
      setEditingId(null);
    }
  }

  function renderItem(conversation) {
    const isActive = conversation.id === activeId;
    const isEditing = conversation.id === editingId;
    const isConfirming = conversation.id === confirmId;

    return (
      <div
        key={conversation.id}
        className={`group rounded-lg px-2.5 py-2 transition-colors ${
          isActive ? "bg-white shadow-sm ring-1 ring-teal-100" : "hover:bg-white"
        }`}
      >
        <div className="flex items-start gap-1.5">
          {isEditing ? (
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              maxLength={120}
              className="min-w-0 flex-1 rounded border border-teal-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-teal-500"
            />
          ) : (
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              onDoubleClick={() => startRename(conversation)}
              className="min-w-0 flex-1 text-left"
              title={conversation.title}
            >
              <p className="truncate text-xs font-medium text-gray-700">
                {conversation.title || "Untitled chat"}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {formatRelative(conversation.updated_at)}
              </p>
            </button>
          )}

          {!isEditing && !isConfirming && (
            <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
              <button
                type="button"
                onClick={() => startRename(conversation)}
                title="Rename chat"
                className="rounded p-1 text-gray-400 transition-colors hover:bg-teal-50 hover:text-teal-600"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmId(conversation.id)}
                title="Delete chat"
                className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {isConfirming && (
          <div className="mt-1.5 flex items-center gap-2 text-[10px]">
            <span className="text-gray-500">Delete this chat?</span>
            <button
              type="button"
              onClick={() => {
                setConfirmId(null);
                onDelete(conversation.id);
              }}
              className="font-semibold text-red-600 hover:underline"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmId(null)}
              className="text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-gray-100 bg-gray-50/70">
      <div className="border-b border-gray-100 px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5">
          <Search size={13} className="shrink-0 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            className="min-w-0 flex-1 text-xs text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-2.5 py-3">
        {loading && <p className="px-1 text-xs text-gray-400">Loading chats...</p>}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 px-2 py-6 text-center">
            <MessageSquare size={18} className="text-gray-300" />
            <p className="text-xs text-gray-400">No chats yet</p>
          </div>
        )}

        {!loading && conversations.length > 0 && filtered.length === 0 && (
          <p className="px-1 text-xs text-gray-400">No matching chats</p>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {group.label}
            </p>
            <div className="space-y-1">{group.items.map(renderItem)}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
