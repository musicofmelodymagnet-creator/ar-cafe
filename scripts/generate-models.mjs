/**
 * Generates minimal valid GLB (glTF 2.0 binary) placeholder models
 * for each menu item — pure Node.js, no external dependencies.
 *
 * Each model is a colored box (0.15m × 0.08m × 0.15m) representing a dish.
 * Drinks are taller cylinders (approximated with a narrower box).
 *
 * Also writes empty .usdz stubs (iOS AR Quick Look falls back gracefully
 * when the model can't be parsed; real USDZ should be created in a 3D tool).
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'models');

mkdirSync(OUT_DIR, { recursive: true });

// ─── Box geometry helpers ─────────────────────────────────────────────────────

/** Returns interleaved Float32 positions and Float32 normals for a box. */
function buildBoxGeometry(w = 0.15, h = 0.08, d = 0.15) {
  const hw = w / 2, hh = h / 2, hd = d / 2;

  // 6 faces × 4 verts = 24 verts; each vert has position(3) + normal(3)
  // positions and normals stored separately so accessors can reference them
  const positions = new Float32Array(24 * 3);
  const normals   = new Float32Array(24 * 3);

  const faces = [
    // [normal, v0, v1, v2, v3] — CCW winding
    { n: [0, 0, 1],  verts: [[-hw,-hh, hd],[hw,-hh, hd],[hw, hh, hd],[-hw, hh, hd]] },
    { n: [0, 0,-1],  verts: [[ hw,-hh,-hd],[-hw,-hh,-hd],[-hw, hh,-hd],[hw, hh,-hd]] },
    { n: [-1, 0, 0], verts: [[-hw,-hh,-hd],[-hw,-hh, hd],[-hw, hh, hd],[-hw, hh,-hd]] },
    { n: [1, 0, 0],  verts: [[ hw,-hh, hd],[ hw,-hh,-hd],[ hw, hh,-hd],[ hw, hh, hd]] },
    { n: [0, 1, 0],  verts: [[-hw, hh, hd],[ hw, hh, hd],[ hw, hh,-hd],[-hw, hh,-hd]] },
    { n: [0,-1, 0],  verts: [[-hw,-hh,-hd],[ hw,-hh,-hd],[ hw,-hh, hd],[-hw,-hh, hd]] },
  ];

  let vi = 0;
  for (const { n, verts } of faces) {
    for (const v of verts) {
      positions[vi * 3]     = v[0];
      positions[vi * 3 + 1] = v[1];
      positions[vi * 3 + 2] = v[2];
      normals[vi * 3]     = n[0];
      normals[vi * 3 + 1] = n[1];
      normals[vi * 3 + 2] = n[2];
      vi++;
    }
  }

  // 36 indices (6 faces × 2 triangles × 3)
  const indices = new Uint16Array(36);
  for (let f = 0; f < 6; f++) {
    const base = f * 4;
    const off  = f * 6;
    indices[off]   = base; indices[off+1] = base+1; indices[off+2] = base+2;
    indices[off+3] = base; indices[off+4] = base+2; indices[off+5] = base+3;
  }

  return { positions, normals, indices };
}

// ─── GLB packer ──────────────────────────────────────────────────────────────

function packGLB(r, g, b, w = 0.15, h = 0.08, d = 0.15) {
  const { positions, normals, indices } = buildBoxGeometry(w, h, d);

  const posBuf  = Buffer.from(positions.buffer);
  const normBuf = Buffer.from(normals.buffer);
  const idxBuf  = Buffer.from(indices.buffer);

  // Pad each buffer view to 4-byte alignment
  function padded(buf) {
    const rem = buf.byteLength % 4;
    return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - rem)]);
  }

  const posPadded  = padded(posBuf);
  const normPadded = padded(normBuf);
  const idxPadded  = padded(idxBuf);

  const posLen  = posPadded.byteLength;   // 288
  const normLen = normPadded.byteLength;  // 288
  const idxLen  = idxPadded.byteLength;   // 72 (36 × 2 = 72, already aligned)

  const binLen = posLen + normLen + idxLen;

  // Compute min/max for positions (required by validator)
  let minPos = [Infinity, Infinity, Infinity], maxPos = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 3; j++) {
      minPos[j] = Math.min(minPos[j], positions[i * 3 + j]);
      maxPos[j] = Math.max(maxPos[j], positions[i * 3 + j]);
    }
  }

  const gltf = {
    asset: { version: '2.0', generator: 'ar-cafe-model-generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'Dish' }],
    meshes: [{
      name: 'Dish',
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0,
        mode: 4,
      }],
    }],
    materials: [{
      name: 'DishMaterial',
      pbrMetallicRoughness: {
        baseColorFactor: [r, g, b, 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.6,
      },
      doubleSided: false,
    }],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: 24,
        type: 'VEC3',
        min: minPos,
        max: maxPos,
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: 24,
        type: 'VEC3',
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: 5123, // UNSIGNED_SHORT
        count: 36,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0,                    byteLength: posBuf.byteLength,  target: 34962 },
      { buffer: 0, byteOffset: posLen,               byteLength: normBuf.byteLength, target: 34962 },
      { buffer: 0, byteOffset: posLen + normLen,     byteLength: idxBuf.byteLength,  target: 34963 },
    ],
    buffers: [{ byteLength: binLen }],
  };

  const jsonStr  = JSON.stringify(gltf);
  const jsonBuf  = Buffer.from(jsonStr, 'utf8');
  const jsonPad  = (4 - (jsonBuf.byteLength % 4)) % 4;
  const jsonFull = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]); // pad with spaces

  const binFull = Buffer.concat([posPadded, normPadded, idxPadded]);

  // GLB header
  const totalLen = 12 + 8 + jsonFull.byteLength + 8 + binFull.byteLength;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // magic 'glTF'
  header.writeUInt32LE(2, 4);          // version
  header.writeUInt32LE(totalLen, 8);   // total length

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonFull.byteLength, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // 'JSON'

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binFull.byteLength, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // 'BIN\0'

  return Buffer.concat([header, jsonChunkHeader, jsonFull, binChunkHeader, binFull]);
}

// ─── Minimal stub USDZ ───────────────────────────────────────────────────────
// A USDZ is a zip archive. We write a valid zip with a single empty .usda file.
// model-viewer's iOS Quick Look will fail gracefully — real USDZ needs a 3D tool.

function buildMinimalUSDZ(name) {
  const usda = `#usda 1.0
( upAxis = "Y" )
def Xform "${name.replace(/-/g, '_')}" { }
`;
  const filename = `${name}.usda`;
  const content  = Buffer.from(usda, 'utf8');

  // Local file header
  const fileNameBuf = Buffer.from(filename, 'utf8');
  const lfh = Buffer.alloc(30 + fileNameBuf.byteLength);
  lfh.writeUInt32LE(0x04034b50, 0);  // signature
  lfh.writeUInt16LE(20, 4);          // version needed
  lfh.writeUInt16LE(0, 6);           // flags
  lfh.writeUInt16LE(0, 8);           // compression (stored)
  lfh.writeUInt16LE(0, 10);          // mod time
  lfh.writeUInt16LE(0, 12);          // mod date
  lfh.writeUInt32LE(crc32(content), 14);
  lfh.writeUInt32LE(content.byteLength, 18);
  lfh.writeUInt32LE(content.byteLength, 22);
  lfh.writeUInt16LE(fileNameBuf.byteLength, 26);
  lfh.writeUInt16LE(0, 28);
  fileNameBuf.copy(lfh, 30);

  // Central directory header
  const cdh = Buffer.alloc(46 + fileNameBuf.byteLength);
  cdh.writeUInt32LE(0x02014b50, 0);  // signature
  cdh.writeUInt16LE(20, 4);          // version made by
  cdh.writeUInt16LE(20, 6);          // version needed
  cdh.writeUInt16LE(0, 8);
  cdh.writeUInt16LE(0, 10);
  cdh.writeUInt16LE(0, 12);
  cdh.writeUInt16LE(0, 14);
  cdh.writeUInt32LE(crc32(content), 16);
  cdh.writeUInt32LE(content.byteLength, 20);
  cdh.writeUInt32LE(content.byteLength, 24);
  cdh.writeUInt16LE(fileNameBuf.byteLength, 28);
  cdh.writeUInt16LE(0, 30); // extra
  cdh.writeUInt16LE(0, 32); // comment
  cdh.writeUInt16LE(0, 34); // disk start
  cdh.writeUInt16LE(0, 36); // internal attr
  cdh.writeUInt32LE(0, 38); // external attr
  cdh.writeUInt32LE(0, 42); // offset of local header
  fileNameBuf.copy(cdh, 46);

  const localOffset = lfh.byteLength + content.byteLength;

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4);          // disk number
  eocd.writeUInt16LE(0, 6);          // disk with CD
  eocd.writeUInt16LE(1, 8);          // entries on disk
  eocd.writeUInt16LE(1, 10);         // total entries
  eocd.writeUInt32LE(cdh.byteLength, 12); // CD size
  eocd.writeUInt32LE(localOffset, 16);    // CD offset
  eocd.writeUInt16LE(0, 20);         // comment length

  return Buffer.concat([lfh, content, cdh, eocd]);
}

// CRC-32 implementation (required for valid ZIP)
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─── Menu model definitions ───────────────────────────────────────────────────
// [name, r, g, b, width, height, depth]  (dimensions in metres, real-world scale)

const MODELS = [
  // Appetizers — small flat plates (warm tones)
  ['salmon-tartare',  0.95, 0.45, 0.30, 0.18, 0.05, 0.18],
  ['bruschetta',      0.85, 0.55, 0.25, 0.20, 0.04, 0.10],
  ['carpaccio',       0.80, 0.25, 0.25, 0.22, 0.03, 0.18],

  // Mains — larger plates
  ['ribeye',          0.55, 0.20, 0.10, 0.25, 0.05, 0.25],
  ['carbonara',       0.95, 0.85, 0.50, 0.22, 0.07, 0.22],
  ['dorado',          0.70, 0.80, 0.55, 0.28, 0.06, 0.16],

  // Desserts — small tall items (pastel)
  ['tiramisu',        0.70, 0.55, 0.35, 0.12, 0.10, 0.12],
  ['creme-brulee',    0.95, 0.90, 0.55, 0.13, 0.06, 0.13],

  // Drinks — tall narrow (cups/glasses)
  ['espresso',        0.22, 0.13, 0.08, 0.07, 0.12, 0.07],
  ['lemonade',        0.80, 0.95, 0.50, 0.09, 0.22, 0.09],
];

// ─── Generate files ───────────────────────────────────────────────────────────

let generated = 0;
for (const [name, r, g, b, w, h, d] of MODELS) {
  const glbPath  = join(OUT_DIR, `${name}.glb`);
  const usdzPath = join(OUT_DIR, `${name}.usdz`);

  writeFileSync(glbPath,  packGLB(r, g, b, w, h, d));
  writeFileSync(usdzPath, buildMinimalUSDZ(name));
  generated++;

  console.log(`✓ ${name}.glb  (${(w*100).toFixed(0)}×${(h*100).toFixed(0)}×${(d*100).toFixed(0)} cm)`);
}

console.log(`\n✅ Generated ${generated} GLB + ${generated} USDZ files → public/models/`);
