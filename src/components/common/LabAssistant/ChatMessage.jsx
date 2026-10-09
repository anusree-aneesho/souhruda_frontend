// src/components/common/LabAssistant/ChatMessage.jsx
import { Link, useNavigate } from "react-router-dom";
import { Bot, User } from "lucide-react";
import { renderBold, renderDataTables } from "./assistantUtils";
import Attachments from "./Attachments";
import MessageFeedback from "./MessageFeedback";
import { formatMessageStamp } from "./time";

function getUserInitials() {
  try {
    const raw = localStorage.getItem("souhruda_auth_user");
    const name = raw ? JSON.parse(raw)?.name : null;
    if (name) {
      return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
    }
  } catch {
    // Fall through to the generic avatar.
  }
  return null;
}

function resolveNavigationUrl(rawUrl) {
  if (!rawUrl) return { isInternal: true, path: "/" };
  const trimmed = rawUrl.trim();

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return { isInternal: true, path: trimmed };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const pathname = parsed.pathname;

      const appRoutePrefixes = [
        "/lab-orders",
        "/home-collection",
        "/test-master",
        "/patients",
        "/follow-ups",
        "/reports",
        "/staff",
        "/technicians",
        "/lab-assistants",
        "/statistics",
        "/activity-logs",
        "/settings",
      ];

      const isAppRoute =
        pathname === "/" ||
        appRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));

      if (isAppRoute) {
        return { isInternal: true, path: pathname + parsed.search + parsed.hash };
      }
    } catch {
      // Fall through if URL constructor fails
    }
    return { isInternal: false, path: trimmed };
  }

  return { isInternal: true, path: "/" + trimmed };
}

export default function ChatMessage({
  role,
  text,
  response,
  createdAt,
  attachments,
  feedback,
  canRate,
  onFeedback,
}) {
  const isBot = role === "bot";
  const navigate = useNavigate();

  const handleLinkClick = (e, rawUrl) => {
    const target = resolveNavigationUrl(rawUrl);
    if (target.isInternal) {
      e.preventDefault();
      e.stopPropagation();
      try {
        navigate(target.path);
      } catch {
        window.location.href = target.path;
      }
    }
  };

  const navMatches = [];
  const contentLines = [];
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;

  const lines = (text || "").split("\n");
  let quickActionFound = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Nav:") || trimmed.includes("Quick Action") || trimmed.startsWith("⚡")) {
      quickActionFound = true;
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        navMatches.push({ label: match[1], url: match[2] });
      }
    } else if (quickActionFound && trimmed.startsWith("[")) {
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        navMatches.push({ label: match[1], url: match[2] });
      }
    } else {
      contentLines.push(line);
    }
  }

  const contentRegex = /\[([^\]]*)\]\(([^)]*)\)|(https?:\/\/[^\s<>()]+)/g;

  const textElements = contentLines.map((part, pIdx) => {
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = contentRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        elements.push(...renderBold(part.substring(lastIndex, match.index), `${pIdx}-${match.index}`));
      }
      if (match[1] !== undefined) {
        const rawUrl = match[2];
        const target = resolveNavigationUrl(rawUrl);
        if (target.isInternal) {
          elements.push(
            <Link
              key={`${pIdx}-${match.index}`}
              to={target.path}
              onClick={(e) => handleLinkClick(e, rawUrl)}
              className="font-semibold text-teal-600 hover:underline cursor-pointer"
            >
              {match[1]}
            </Link>
          );
        } else {
          elements.push(
            <a
              key={`${pIdx}-${match.index}`}
              href={target.path}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal-600 hover:underline"
            >
              {match[1]}
            </a>
          );
        }
      } else {
        let href = match[3];
        let trailing = "";
        while (href.length && ".,;:!?".includes(href[href.length - 1])) {
          trailing = href.slice(-1) + trailing;
          href = href.slice(0, -1);
        }
        elements.push(
          <a
            key={`${pIdx}-${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-600 hover:underline"
          >
            {href}
          </a>
        );
        if (trailing) elements.push(trailing);
      }
      lastIndex = contentRegex.lastIndex;
    }
    if (lastIndex < part.length) {
      elements.push(...renderBold(part.substring(lastIndex), `tail-${pIdx}`));
    }

    return (
      <span key={pIdx}>
        {elements}
        {pIdx < contentLines.length - 1 && <br />}
      </span>
    );
  });

  const stamp = formatMessageStamp(createdAt);
  const initials = getUserInitials();

  return (
    <div className={`flex gap-2 ${isBot ? "justify-start" : "flex-row-reverse justify-end"}`}>
      <div
        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isBot ? "bg-teal-50 text-teal-600" : "bg-gray-200 text-gray-600"
        }`}
        title={isBot ? "Lab Assistant" : "You"}
      >
        {isBot ? <Bot size={14} /> : initials ? (
          <span className="text-[10px] font-bold">{initials}</span>
        ) : (
          <User size={14} />
        )}
      </div>

      <div className="flex max-w-[85%] min-w-0 flex-col items-start">
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            isBot ? "bg-gray-100 text-gray-800" : "bg-teal-600 text-white"
          }`}
        >
          {textElements}

          {response?.data && renderDataTables(response.data)}

          <Attachments items={attachments} />

          {navMatches.length > 0 && (
            <div className="mt-2.5 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2.5">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                ⚡ Quick Action
              </p>
              <div className="flex flex-wrap gap-1.5">
                {navMatches.map((m, idx) => {
                  const target = resolveNavigationUrl(m.url);
                  if (target.isInternal) {
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => handleLinkClick(e, m.url)}
                        className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors cursor-pointer"
                      >
                        <span>{m.label}</span>
                        <span>→</span>
                      </button>
                    );
                  }
                  return (
                    <a
                      key={idx}
                      href={target.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
                    >
                      <span>{m.label}</span>
                      <span>→</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {(stamp || (isBot && canRate)) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {stamp && <span className="text-[10px] text-gray-400">{stamp}</span>}
            {isBot && canRate && (
              <MessageFeedback rating={feedback} onRate={onFeedback} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
