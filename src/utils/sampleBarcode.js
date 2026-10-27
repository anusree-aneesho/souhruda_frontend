// src/utils/sampleBarcode.js
//
// Text encoded inside the printed Code128 barcode:  HC1038|20010003
//   part 1 = home collection request code (used for lookup)
//   part 2 = patient register number
// A plain barcode scanner/app then shows both. The database `barcode` column
// stores this same text, so new requests need no extra work.
const LEGACY_PREFIX = /^SR-HC-/;

export function barcodeValue(hc) {
  const raw = hc?.sampleBarcode;
  if (!raw) return "";
  const id = String(raw).replace(LEGACY_PREFIX, ""); // older rows: SR-HC-HC1038
  if (id.includes("|")) return id; // already stored as HC1038|register no
  const reg = String(hc?.patient?.regNo ?? "").replace(/[^\x20-\x7e]/g, "").trim();
  return reg ? `${id}|${reg}` : id;
}

// Lab order barcode: "<order no>|<register no>", e.g. 48213|20010003
export function orderBarcodeValue(orderNo, regNo) {
  const no = String(orderNo ?? "").trim();
  if (!no) return "";
  const reg = String(regNo ?? "").replace(/[^\x20-\x7e]/g, "").trim();
  return reg && reg !== "-" ? `${no}|${reg}` : no;
}

// Back from scanned text to the lookup code: "HC1038|20010003" -> "HC1038"
// (older labels "SR-HC-HC1038|20010003" work too)
export function parseScannedCode(text) {
  return String(text ?? "").split("|")[0].trim().replace(LEGACY_PREFIX, "");
}