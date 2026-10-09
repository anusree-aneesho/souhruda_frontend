// src/components/common/LabAssistant/Attachments.jsx
// Renders message attachments: image previews + downloadable file chips.
// Attachment endpoints are auth-gated, so blobs are fetched with the token.
import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { fetchAttachmentUrl, downloadAttachment } from "../../../api/assistantApi";
import { formatBytes } from "./assistantUtils";

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function isImage(att) {
  return IMAGE_MIMES.includes((att.mime || "").toLowerCase());
}

function FileChip({ att }) {
  return (
    <button
      type="button"
      onClick={() => downloadAttachment(att.url, att.name)}
      title={`Download ${att.name}`}
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-teal-100 bg-teal-50 px-2 py-1 text-[11px] font-medium text-teal-700 transition-colors hover:bg-teal-100"
    >
      <FileText size={12} className="shrink-0" />
      <span className="truncate">{att.name}</span>
      {att.size ? <span className="shrink-0 text-teal-500">{formatBytes(att.size)}</span> : null}
    </button>
  );
}

function ImageAttachment({ att }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(!att.url);

  useEffect(() => {
    if (!att.url) return undefined;
    let objectUrl = null;
    let cancelled = false;
    (async () => {
      try {
        objectUrl = await fetchAttachmentUrl(att.url);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [att.url]);

  if (failed) return <FileChip att={att} />;

  if (!src) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-400">
        <Loader2 size={11} className="animate-spin" />
        {att.name}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => downloadAttachment(att.url, att.name)}
      title={`Download ${att.name}`}
      className="block"
    >
      <img
        src={src}
        alt={att.name}
        className="max-h-36 rounded-lg border border-gray-200 object-cover"
      />
    </button>
  );
}

export default function Attachments({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((att, index) => {
        const key = att.url || `${att.name}-${index}`;
        return isImage(att) ? (
          <ImageAttachment key={key} att={att} />
        ) : (
          <FileChip key={key} att={att} />
        );
      })}
    </div>
  );
}
