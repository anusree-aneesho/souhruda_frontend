// src/utils/code128.js
//
// Dependency-free Code128 encoder. Uses Code Set B (all printable ASCII,
// 32–126) and switches to Code Set C when the value is an even-length run of
// 4+ digits (denser, e.g. "20261009"). Returns a string of "1" (bar) and
// "0" (space) modules, including the start, checksum and stop characters.

const PATTERNS = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112",
];

const START_B = 104;
const START_C = 105;
const CODE_B = 100;
const CODE_C = 99;
const STOP = 106;

function patternToModules(pattern) {
  let out = "";
  let bar = true;
  for (const ch of pattern) {
    out += (bar ? "1" : "0").repeat(Number(ch));
    bar = !bar;
  }
  return out;
}

export function encodeCode128(value) {
  const text = String(value);
  if (!text.length) throw new Error("Empty barcode value");
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c < 32 || c > 126) throw new Error("Unsupported character for Code128");
  }

  const codes = [];

  if (/^\d{4,}$/.test(text) && text.length % 2 === 0) {
    // Pure even-length numeric -> Code Set C (two digits per symbol)
    codes.push(START_C);
    for (let i = 0; i < text.length; i += 2) codes.push(Number(text.slice(i, i + 2)));
  } else {
    // Code Set B, switching to Code C for long digit runs (4+ at the end, 6+ in the middle)
    codes.push(START_B);
    let i = 0;
    while (i < text.length) {
      const digitRun = /^\d+/.exec(text.slice(i))?.[0].length ?? 0;
      const useC = digitRun >= 6 || (digitRun >= 4 && i + digitRun === text.length);
      if (useC) {
        const pairs = digitRun - (digitRun % 2);
        codes.push(CODE_C);
        for (let k = 0; k < pairs; k += 2) codes.push(Number(text.slice(i + k, i + k + 2)));
        i += pairs;
        if (i < text.length) codes.push(CODE_B);
      } else {
        codes.push(text.charCodeAt(i) - 32);
        i += 1;
      }
    }
  }

  // Checksum: start code + sum(position * value), mod 103
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) sum += i * codes[i];
  codes.push(sum % 103);
  codes.push(STOP);

  return codes.map((c) => patternToModules(PATTERNS[c])).join("");
}