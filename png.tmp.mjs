import { deflateSync } from 'node:zlib';

/** Minimaler PNG-Encoder (RGB, 8 Bit) — nur für Platzhalterbilder. */
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/**
 * Erzeugt ein Platzhalter-"Hautfoto": Hautton-Verlauf mit ein paar
 * dunkleren Flecken, deren Anzahl vom Score abhängt. So ist im
 * Vorher/Nachher-Vergleich ein sichtbarer Unterschied vorhanden.
 */
export function placeholderPhoto(width, height, score, seed) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let rnd = seed * 2654435761 % 2147483647;
  const next = () => (rnd = (rnd * 1103515245 + 12345) % 2147483647) / 2147483647;

  const blemishes = Math.round((100 - score) / 4);
  const spots = Array.from({ length: blemishes }, () => ({
    x: next() * width,
    y: next() * height,
    r: 6 + next() * 12,
  }));

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0; // Filtertyp "none"
    for (let x = 0; x < width; x++) {
      const vign = 1 - 0.35 * Math.hypot(x / width - 0.5, y / height - 0.5);
      let r = 232 * vign;
      let g = 194 * vign;
      let b = 176 * vign;

      for (const spot of spots) {
        const d = Math.hypot(x - spot.x, y - spot.y);
        if (d < spot.r) {
          const k = 1 - d / spot.r;
          r -= 55 * k;
          g -= 78 * k;
          b -= 74 * k;
        }
      }

      const i = rowStart + 1 + x * 3;
      raw[i] = Math.max(0, Math.min(255, r));
      raw[i + 1] = Math.max(0, Math.min(255, g));
      raw[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // Truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
