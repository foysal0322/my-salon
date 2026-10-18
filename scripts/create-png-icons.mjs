import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height) {
  // A simple solid teal PNG with CRC
  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(width, 0);
  IHDR.writeUInt32BE(height, 4);
  IHDR.writeUInt8(8, 8); // 8-bit depth
  IHDR.writeUInt8(2, 9); // Truecolor (RGB)
  IHDR.writeUInt8(0, 10); // Compression
  IHDR.writeUInt8(0, 11); // Filter
  IHDR.writeUInt8(0, 12); // Interlace

  const rowSize = width * 3 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Brand Teal RGB: 13, 148, 136
      rawData[pxOffset] = 13;
      rawData[pxOffset + 1] = 148;
      rawData[pxOffset + 2] = 136;
    }
  }

  const IDAT = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', IHDR);
  const idatChunk = makeChunk('IDAT', IDAT);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const dir = path.join(process.cwd(), 'public', 'icons');
fs.writeFileSync(path.join(dir, 'icon-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(dir, 'icon-512x512.png'), createPng(512, 512));
console.log('Valid PNG icons generated successfully.');
