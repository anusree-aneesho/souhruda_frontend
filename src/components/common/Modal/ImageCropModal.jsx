// src/components/common/Modal/ImageCropModal.jsx
//
// Dependency-free image cropper (canvas based). Free aspect ratio: drag the box
// to move it, drag any corner / edge handle to resize it. Works with mouse and
// touch. Transparent PNGs stay transparent.
//
// Props:
//   file       File          image chosen by the user
//   title      string        modal heading
//   onCancel   () => void    user closed the cropper — nothing is saved
//   onConfirm  (File) => void  cropped image as a new File
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, RotateCcw } from "lucide-react";

const MAX_BOX_W = 520; // on-screen size of the image area
const MAX_BOX_H = 340;
const MIN_SIZE = 24; // smallest crop box, in on-screen px
const MAX_OUTPUT_SIDE = 1400; // longest side of the saved image, in real px

const HANDLES = [
  { mode: "nw", cls: "-top-1.5 -left-1.5 cursor-nwse-resize" },
  { mode: "n", cls: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { mode: "ne", cls: "-top-1.5 -right-1.5 cursor-nesw-resize" },
  { mode: "e", cls: "top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize" },
  { mode: "se", cls: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
  { mode: "s", cls: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { mode: "sw", cls: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
  { mode: "w", cls: "top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize" },
];

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export default function ImageCropModal({ file, title = "Crop image", onCancel, onConfirm }) {
  const imgRef = useRef(null);
  const dragRef = useRef(null);

  const [url, setUrl] = useState(null);
  const [view, setView] = useState(null); // { dw, dh, nw, nh } once the image has loaded
  const [crop, setCrop] = useState(null); // { x, y, w, h } in on-screen px
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  function handleLoad(e) {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const scale = Math.min(MAX_BOX_W / nw, MAX_BOX_H / nh, 2);
    const dw = Math.round(nw * scale);
    const dh = Math.round(nh * scale);
    setView({ dw, dh, nw, nh });
    setCrop({ x: 0, y: 0, w: dw, h: dh });
  }

  function resetCrop() {
    if (view) setCrop({ x: 0, y: 0, w: view.dw, h: view.dh });
  }

  function onPointerDown(e) {
    if (!crop) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      mode: e.target.dataset.handle || "move",
      startX: e.clientX,
      startY: e.clientY,
      start: crop,
    };
  }

  function onPointerMove(e) {
    const d = dragRef.current;
    if (!d || !view) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const { x, y, w, h } = d.start;
    const { dw, dh } = view;

    if (d.mode === "move") {
      setCrop({ x: clamp(x + dx, 0, dw - w), y: clamp(y + dy, 0, dh - h), w, h });
      return;
    }

    let left = x;
    let top = y;
    let right = x + w;
    let bottom = y + h;
    if (d.mode.includes("w")) left = clamp(x + dx, 0, right - MIN_SIZE);
    if (d.mode.includes("e")) right = clamp(x + w + dx, left + MIN_SIZE, dw);
    if (d.mode.includes("n")) top = clamp(y + dy, 0, bottom - MIN_SIZE);
    if (d.mode.includes("s")) bottom = clamp(y + h + dy, top + MIN_SIZE, dh);
    setCrop({ x: left, y: top, w: right - left, h: bottom - top });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || !view || !crop) return;
    setBusy(true);
    setError("");

    // On-screen box -> real image pixels.
    const ratio = view.nw / view.dw;
    const sx = Math.round(crop.x * ratio);
    const sy = Math.round(crop.y * ratio);
    const sw = Math.max(1, Math.min(view.nw - sx, Math.round(crop.w * ratio)));
    const sh = Math.max(1, Math.min(view.nh - sy, Math.round(crop.h * ratio)));

    // Keep the saved file reasonably small.
    const shrink = Math.min(1, MAX_OUTPUT_SIDE / Math.max(sw, sh));
    const ow = Math.max(1, Math.round(sw * shrink));
    const oh = Math.max(1, Math.round(sh * shrink));

    const canvas = document.createElement("canvas");
    canvas.width = ow;
    canvas.height = oh;
    const ctx = canvas.getContext("2d");

    // JPEG has no transparency, so give it a white background. PNG / WEBP keep theirs.
    const isJpeg = file.type === "image/jpeg";
    const outType = isJpeg ? "image/jpeg" : file.type === "image/webp" ? "image/webp" : "image/png";
    if (isJpeg) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, ow, oh);
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, ow, oh);

    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (!blob) {
          setError("Couldn't crop this image. Please try again.");
          return;
        }
        const ext = outType === "image/jpeg" ? "jpg" : outType === "image/webp" ? "webp" : "png";
        const stem = (file.name || "signature").replace(/\.[^.]+$/, "");
        onConfirm(new File([blob], `${stem}-cropped.${ext}`, { type: outType }));
      },
      outType,
      0.92
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs text-gray-500 mb-3">
            Drag the box to move it. Drag the corners or edges to resize it.
          </p>

          <div className="flex justify-center">
            <div
              className="relative select-none overflow-hidden rounded-md border border-gray-200"
              style={{
                width: view?.dw,
                height: view?.dh,
                // checkerboard so transparent areas are visible
                backgroundColor: "#fff",
                backgroundImage:
                  "linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 8px 8px",
              }}
            >
              {url && (
                <img
                  ref={imgRef}
                  src={url}
                  alt="To crop"
                  onLoad={handleLoad}
                  draggable={false}
                  style={view ? { width: view.dw, height: view.dh } : { maxWidth: MAX_BOX_W, maxHeight: MAX_BOX_H }}
                  className="block pointer-events-none"
                />
              )}

              {crop && (
                <div
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className="absolute border-2 border-teal-500 cursor-move"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.w,
                    height: crop.h,
                    touchAction: "none",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)", // dims everything outside the box
                  }}
                >
                  {HANDLES.map((h) => (
                    <span
                      key={h.mode}
                      data-handle={h.mode}
                      className={`absolute h-3 w-3 rounded-sm border border-teal-600 bg-white ${h.cls}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-gray-100">
          <button
            type="button"
            onClick={resetCrop}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!crop || busy}
              className="px-4 py-2 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40 cursor-pointer"
            >
              {busy ? "Cropping…" : "Crop & use"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}