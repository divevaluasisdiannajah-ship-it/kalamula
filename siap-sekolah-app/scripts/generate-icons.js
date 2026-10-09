const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create PNG buffer for given width and height with solid color or gradient
function createSolidPng(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8 bits per channel
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // Raw pixel data with filter byte (0) per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter for this row

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Slight rounded squircle corner effect
      const radius = Math.floor(width * 0.22);
      const isCorner =
        (x < radius && y < radius && Math.hypot(radius - x, radius - y) > radius) ||
        (x >= width - radius && y < radius && Math.hypot(x - (width - radius), radius - y) > radius) ||
        (x < radius && y >= height - radius && Math.hypot(radius - x, y - (height - radius)) > radius) ||
        (x >= width - radius && y >= height - radius && Math.hypot(x - (width - radius), y - (height - radius)) > radius);

      if (isCorner) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      } else {
        // iOS Blue with subtle top-to-bottom shading
        const shade = Math.floor((y / height) * 20);
        rawData[pxOffset] = Math.max(0, r - shade);
        rawData[pxOffset + 1] = Math.max(0, g - shade);
        rawData[pxOffset + 2] = Math.max(0, b - shade);
        rawData[pxOffset + 3] = a;
      }
    }
  }

  // Deflate compressed IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calculateCrc32(body), 0);

  return Buffer.concat([len, body, crc]);
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate all icons
const iconDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 192, 512];
// iOS Blue: #007AFF (0, 122, 255)
for (const s of sizes) {
  const png = createSolidPng(s, s, 0, 122, 255, 255);
  const dest = path.join(iconDir, `icon-${s}x${s}.png`);
  fs.writeFileSync(dest, png);
  console.log(`Generated: ${dest}`);
}

// Badge
const badge = createSolidPng(72, 72, 0, 122, 255, 255);
fs.writeFileSync(path.join(iconDir, 'badge-72x72.png'), badge);
console.log('Icons generated successfully.');
