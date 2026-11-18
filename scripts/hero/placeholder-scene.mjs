/**
 * Renders the PLACEHOLDER hero sequence as SVG frames (1920x1080).
 *
 * Story: aerial over palms at golden hour → camera drops to a driveway →
 * glides up to the front door → doors open to warm light → fade to cream.
 *
 * This is a stylized stand-in until real footage exists. It is only used by
 * build-hero-frames.mjs when no source clip is given.
 */

const W = 1920;
const H = 1080;
const CREAM = "#FAF8F4";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const range = (t, a, b) => clamp((t - a) / (b - a));

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- shared defs ---------- */
const DEFS = `
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3E5C82"/>
    <stop offset="0.45" stop-color="#C98C6B"/>
    <stop offset="0.8" stop-color="#F2C48D"/>
    <stop offset="1" stop-color="#F8E1B8"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.22" cy="0.42" r="0.45">
    <stop offset="0" stop-color="#FFF1CF" stop-opacity="0.95"/>
    <stop offset="0.25" stop-color="#FFD89A" stop-opacity="0.55"/>
    <stop offset="1" stop-color="#FFD89A" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5E7A4E"/>
    <stop offset="1" stop-color="#2F4A2E"/>
  </linearGradient>
  <linearGradient id="drive" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#E9DCC4"/>
    <stop offset="1" stop-color="#CDB892"/>
  </linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#2F6E86"/>
    <stop offset="1" stop-color="#5FA0AE"/>
  </linearGradient>
  <linearGradient id="facade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F6EBDA"/>
    <stop offset="1" stop-color="#E4D2B6"/>
  </linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3B2A1F"/>
    <stop offset="0.5" stop-color="#5A4030"/>
    <stop offset="1" stop-color="#3B2A1F"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.55" r="0.6">
    <stop offset="0" stop-color="#FFF8EA"/>
    <stop offset="0.5" stop-color="#FBE7C2"/>
    <stop offset="1" stop-color="#E9C48A"/>
  </radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
    <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#0B1A2C" stop-opacity="0.45"/>
  </radialGradient>
</defs>`;

/* ---------- palm drawings ---------- */
function palmTop(cx, cy, r, rot, color = "#2E4B2C") {
  // Canopy seen from above: radiating fronds.
  let p = "";
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * r;
    const y2 = cy + Math.sin(a) * r;
    const cxp = cx + Math.cos(a + 0.35) * r * 0.6;
    const cyp = cy + Math.sin(a + 0.35) * r * 0.6;
    p += `<path d="M${cx} ${cy} Q${cxp} ${cyp} ${x2} ${y2}" stroke="${color}" stroke-width="${r * 0.22}" stroke-linecap="round" fill="none"/>`;
  }
  p += `<circle cx="${cx}" cy="${cy}" r="${r * 0.14}" fill="#4A3B28"/>`;
  return p;
}

function palmSide(baseX, baseY, height, lean, color = "#1F3524") {
  // Palm seen from the side (silhouette against sunset).
  const topX = baseX + lean * height;
  const topY = baseY - height;
  const w = Math.max(1.5, height * 0.035);
  let s = `<path d="M${baseX} ${baseY} Q${baseX + lean * height * 0.2} ${baseY - height * 0.55} ${topX} ${topY}" stroke="#3A2E22" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const fl = height * 0.42;
  const angles = [-2.7, -2.2, -1.75, -1.3, -0.9, -0.45, 0.0, -3.1];
  for (const a of angles) {
    const ex = topX + Math.cos(a) * fl;
    const ey = topY + Math.sin(a) * fl * 0.55 + fl * 0.35;
    const qx = topX + Math.cos(a) * fl * 0.55;
    const qy = topY + Math.sin(a) * fl * 0.7 - fl * 0.08;
    s += `<path d="M${topX} ${topY} Q${qx} ${qy} ${ex} ${ey}" stroke="${color}" stroke-width="${w * 1.6}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

/* ---------- scene A: aerial ---------- */
const aerialPalms = (() => {
  const r = rng(7);
  const list = [];
  for (let i = 0; i < 70; i++) {
    const x = r() * 2400 - 240;
    const y = r() * 1700 - 300;
    // keep the driveway and the house clear
    if (Math.abs(x - 960) < 170 && y > 250) continue;
    if (Math.abs(x - 960) < 380 && y > 120 && y < 420) continue;
    list.push({ x, y, s: 38 + r() * 34, rot: r() * 6.28 });
  }
  return list;
})();

function sceneAerial(t) {
  // t in [0,1] across the aerial segment: descend + glide toward house.
  const k = smooth(t);
  const scale = lerp(1, 2.3, k);
  const ty = lerp(-60, 380, k);
  let g = `<g transform="translate(960 540) scale(${scale}) translate(-960 ${-540 + ty})">`;
  g += `<rect x="-800" y="-900" width="3600" height="3200" fill="url(#lawn)"/>`;
  // ocean band at the top (east)
  g += `<rect x="-800" y="-900" width="3600" height="760" fill="url(#sea)"/>`;
  g += `<rect x="-800" y="-150" width="3600" height="40" fill="#E9D7B0" opacity="0.9"/>`;
  for (let i = 0; i < 9; i++) {
    g += `<rect x="-800" y="${-860 + i * 80}" width="3600" height="3" fill="#FFF3D6" opacity="${0.12 + 0.05 * Math.sin(i + t * 6)}"/>`;
  }
  // street
  g += `<rect x="-800" y="1250" width="3600" height="110" fill="#5C5A55"/>`;
  // driveway
  g += `<path d="M880 1250 L1040 1250 L1010 420 L910 420 Z" fill="url(#drive)"/>`;
  // motor court
  g += `<ellipse cx="960" cy="430" rx="190" ry="70" fill="url(#drive)"/>`;
  // house roof (top-down)
  g += `<rect x="640" y="140" width="640" height="250" rx="6" fill="#B86A4B"/>`;
  g += `<path d="M640 140 L960 265 L1280 140 M640 390 L960 265 L1280 390" stroke="#9D5A3F" stroke-width="6" fill="none"/>`;
  g += `<rect x="500" y="200" width="140" height="160" fill="#B86A4B"/>`;
  g += `<rect x="1280" y="200" width="140" height="160" fill="#B86A4B"/>`;
  // pool
  g += `<rect x="760" y="-30" width="400" height="120" rx="14" fill="#6CC1CF" stroke="#EFE3CC" stroke-width="14"/>`;
  // hedges along drive
  g += `<rect x="845" y="470" width="22" height="760" rx="11" fill="#28432A"/>`;
  g += `<rect x="1053" y="470" width="22" height="760" rx="11" fill="#28432A"/>`;
  for (const p of aerialPalms) g += palmTop(p.x, p.y, p.s, p.rot + t * 0.4);
  // drive palms
  for (let i = 0; i < 6; i++) {
    g += palmTop(820, 520 + i * 125, 46, i, "#33522F");
    g += palmTop(1100, 560 + i * 125, 46, i + 2, "#33522F");
  }
  g += `</g>`;
  // warm golden-hour wash + long-shadow tint
  g += `<rect width="${W}" height="${H}" fill="#F6B66E" opacity="0.18"/>`;
  g += `<rect width="${W}" height="${H}" fill="url(#sun)" opacity="0.6"/>`;
  return g;
}

/* ---------- scene B: driveway approach in perspective ---------- */
const F = 900; // focal length (px per world unit at depth 1)
const HORIZON = 500;
const CAM_H = 1.6;
const HOUSE_Z = 40;
const CAM_END = 35.6;

const sidePalms = (() => {
  const r = rng(11);
  const list = [];
  for (let z = 3; z < HOUSE_Z - 2; z += 3.2) {
    list.push({ x: -4.2 - r() * 0.6, z, h: 8.5 + r() * 2, lean: -0.08 - r() * 0.1 });
    list.push({ x: 4.2 + r() * 0.6, z: z + 1.5, h: 8.5 + r() * 2, lean: 0.08 + r() * 0.1 });
  }
  // background palms behind the house
  for (let i = 0; i < 9; i++) {
    list.push({ x: -16 + i * 4 + r() * 1.5, z: HOUSE_Z + 6 + r() * 6, h: 11 + r() * 3, lean: (r() - 0.5) * 0.2 });
  }
  return list;
})();

function proj(x, y, z, camZ) {
  const d = Math.max(0.05, z - camZ);
  return { x: 960 + (x * F) / d, y: HORIZON + ((CAM_H - y) * F) / d, s: F / d };
}

function house(camZ, doorOpen) {
  const z = HOUSE_Z;
  const P = (x, y) => proj(x, y, z, camZ);
  let g = "";
  const a = P(-9, 0), b = P(9, 6.2);
  // main body
  g += `<rect x="${a.x}" y="${b.y}" width="${b.x - a.x}" height="${a.y - b.y}" fill="url(#facade)"/>`;
  // roof
  const r1 = P(-10, 6.2), r2 = P(10, 6.2), r3 = P(0, 9.2);
  g += `<path d="M${r1.x} ${r1.y} L${r3.x} ${r3.y} L${r2.x} ${r2.y} Z" fill="#B0634A"/>`;
  g += `<rect x="${r1.x}" y="${r1.y}" width="${r2.x - r1.x}" height="${a.s * 0.25}" fill="#8F4F3B"/>`;
  // wings
  for (const sx of [-1, 1]) {
    const w1 = P(sx * 9, 0), w2 = P(sx * 14, 4.6);
    const x0 = Math.min(w1.x, w2.x);
    g += `<rect x="${x0}" y="${w2.y}" width="${Math.abs(w2.x - w1.x)}" height="${w1.y - w2.y}" fill="#EADBC3"/>`;
    // windows
    for (const wx of [10.2, 12.4]) {
      const q1 = P(sx * wx - 0.6, 1), q2 = P(sx * wx + 0.6, 3.4);
      g += `<rect x="${Math.min(q1.x, q2.x)}" y="${q2.y}" width="${Math.abs(q2.x - q1.x)}" height="${q1.y - q2.y}" fill="#F7D79F" opacity="0.85"/>`;
    }
  }
  // arched windows on main facade
  for (const wx of [-6.5, -3.8, 3.8, 6.5]) {
    const q1 = P(wx - 0.7, 1), q2 = P(wx + 0.7, 4.4);
    const ww = q2.x - q1.x;
    g += `<path d="M${q1.x} ${q1.y} L${q1.x} ${q2.y + ww / 2} A${ww / 2} ${ww / 2} 0 0 1 ${q2.x} ${q2.y + ww / 2} L${q2.x} ${q1.y} Z" fill="#F4CF92" opacity="0.9"/>`;
    g += `<path d="M${(q1.x + q2.x) / 2} ${q1.y} L${(q1.x + q2.x) / 2} ${q2.y}" stroke="#E4D2B6" stroke-width="${a.s * 0.06}"/>`;
  }
  // columns & portico
  for (const cx of [-2.4, 2.4]) {
    const c1 = P(cx - 0.28, 0), c2 = P(cx + 0.28, 5.0);
    g += `<rect x="${c1.x}" y="${c2.y}" width="${c2.x - c1.x}" height="${c1.y - c2.y}" fill="#FBF4E8"/>`;
  }
  const pe1 = P(-2.9, 5.0), pe2 = P(2.9, 5.6);
  g += `<rect x="${pe1.x}" y="${pe2.y}" width="${pe2.x - pe1.x}" height="${pe1.y - pe2.y}" fill="#F3E6D1"/>`;
  // door surround
  const d1 = P(-1.35, 0), d2 = P(1.35, 3.7);
  const dw = d2.x - d1.x;
  const archR = dw / 2;
  const doorPath = `M${d1.x} ${d1.y} L${d1.x} ${d2.y + archR} A${archR} ${archR} 0 0 1 ${d2.x} ${d2.y + archR} L${d2.x} ${d1.y} Z`;
  g += `<path d="${doorPath}" fill="#D9C4A2"/>`;
  // inner opening (light behind doors)
  const i1 = P(-1.1, 0), i2 = P(1.1, 3.45);
  const iw = i2.x - i1.x, ir = iw / 2;
  const inner = `M${i1.x} ${i1.y} L${i1.x} ${i2.y + ir} A${ir} ${ir} 0 0 1 ${i2.x} ${i2.y + ir} L${i2.x} ${i1.y} Z`;
  g += `<clipPath id="doorclip"><path d="${inner}"/></clipPath>`;
  g += `<path d="${inner}" fill="url(#glow)"/>`;
  // two door leaves swinging inward (narrowing toward hinges)
  const open = smooth(doorOpen);
  const leafW = (iw / 2) * (1 - open * 0.92);
  const top = i2.y;
  const hh = i1.y - top;
  g += `<g clip-path="url(#doorclip)">`;
  g += `<rect x="${i1.x}" y="${top}" width="${leafW}" height="${hh}" fill="url(#wood)"/>`;
  g += `<rect x="${i2.x - leafW}" y="${top}" width="${leafW}" height="${hh}" fill="url(#wood)"/>`;
  if (open < 0.6) {
    const hx = (i1.x + i2.x) / 2;
    const hy = i1.y - hh * 0.45;
    g += `<rect x="${hx - iw * 0.06}" y="${hy}" width="${iw * 0.025}" height="${hh * 0.12}" rx="${iw * 0.01}" fill="#C9A45C" opacity="${1 - open}"/>`;
    g += `<rect x="${hx + iw * 0.035}" y="${hy}" width="${iw * 0.025}" height="${hh * 0.12}" rx="${iw * 0.01}" fill="#C9A45C" opacity="${1 - open}"/>`;
  }
  g += `</g>`;
  // lanterns
  for (const lx of [-1.9, 1.9]) {
    const l = P(lx, 2.6);
    g += `<circle cx="${l.x}" cy="${l.y}" r="${a.s * 0.22}" fill="#FFE2A8" opacity="0.9"/>`;
    g += `<circle cx="${l.x}" cy="${l.y}" r="${a.s * 0.6}" fill="#FFE2A8" opacity="0.18"/>`;
  }
  // steps
  for (let i = 0; i < 3; i++) {
    const s1 = P(-2.2 - i * 0.3, -0.0), s2 = P(2.2 + i * 0.3, 0);
    const sy = proj(0, 0, z - 0.4 * (i + 1), camZ).y;
    g += `<rect x="${s1.x}" y="${sy - a.s * 0.18}" width="${s2.x - s1.x}" height="${a.s * 0.18}" fill="#EFE3CF"/>`;
  }
  // hedges at facade
  for (const sx of [-1, 1]) {
    const h1 = P(sx * 3.2, 0), h2 = P(sx * 8.6, 1.2);
    g += `<rect x="${Math.min(h1.x, h2.x)}" y="${h2.y}" width="${Math.abs(h2.x - h1.x)}" height="${h1.y - h2.y}" rx="${a.s * 0.4}" fill="#2C4A2D"/>`;
  }
  return g;
}

function sceneDrive(t, doorOpen) {
  // t in [0,1]: camera travel along the driveway
  const camZ = lerp(0, CAM_END, Math.pow(smooth(t), 1.15));
  let g = `<rect width="${W}" height="${HORIZON + 2}" fill="url(#sky)"/>`;
  g += `<rect width="${W}" height="${HORIZON + 2}" fill="url(#sun)"/>`;
  g += `<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#lawn)"/>`;
  // background palms first (far)
  const palms = sidePalms
    .filter((p) => p.z - camZ > 0.6)
    .sort((a, b) => b.z - a.z);
  for (const p of palms.filter((p) => p.z > HOUSE_Z)) {
    const base = proj(p.x, 0, p.z, camZ);
    g += palmSide(base.x, base.y, p.h * base.s, p.lean, "#24402A");
  }
  g += house(camZ, doorOpen);
  // driveway
  const near = camZ + 0.6;
  const l1 = proj(-2.3, 0, near, camZ), r1 = proj(2.3, 0, near, camZ);
  const l2 = proj(-2.3, 0, HOUSE_Z - 1.2, camZ), r2 = proj(2.3, 0, HOUSE_Z - 1.2, camZ);
  g += `<path d="M${l1.x} ${l1.y} L${r1.x} ${r1.y} L${r2.x} ${r2.y} L${l2.x} ${l2.y} Z" fill="url(#drive)"/>`;
  // paver joints
  for (let z = Math.ceil(near / 1.2) * 1.2; z < HOUSE_Z - 1.2; z += 1.2) {
    const a = proj(-2.3, 0, z, camZ), b = proj(2.3, 0, z, camZ);
    g += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#BFA77F" stroke-width="${Math.max(0.6, a.s * 0.02)}" opacity="0.7"/>`;
  }
  // edge hedges
  for (const sx of [-1, 1]) {
    const h1 = proj(sx * 2.6, 0, near, camZ), h2 = proj(sx * 2.6, 0, HOUSE_Z - 1.5, camZ);
    const t1 = proj(sx * 2.6, 0.7, near, camZ), t2 = proj(sx * 2.6, 0.7, HOUSE_Z - 1.5, camZ);
    g += `<path d="M${h1.x} ${h1.y} L${h2.x} ${h2.y} L${t2.x} ${t2.y} L${t1.x} ${t1.y} Z" fill="#284429"/>`;
  }
  // near palms (sorted far → near)
  for (const p of palms.filter((p) => p.z <= HOUSE_Z)) {
    const base = proj(p.x, 0, p.z, camZ);
    g += `<ellipse cx="${base.x + base.s * 1.2}" cy="${base.y}" rx="${base.s * 1.6}" ry="${base.s * 0.18}" fill="#1D3220" opacity="0.35"/>`;
    g += palmSide(base.x, base.y, p.h * base.s, p.lean, "#1F3A25");
  }
  g += `<rect width="${W}" height="${H}" fill="#F6B66E" opacity="0.12"/>`;
  return g;
}

/**
 * Full sequence. p in [0,1].
 *  0.00–0.30 aerial descent
 *  0.26–0.36 crossfade aerial → driveway
 *  0.30–0.86 glide up the drive to the door
 *  0.84–0.95 doors open
 *  0.92–1.00 warm light fades to cream (site background)
 */
export function renderFrameSvg(p) {
  const aerialT = range(p, 0, 0.34);
  const driveT = range(p, 0.28, 0.86);
  const doorT = range(p, 0.84, 0.95);
  const fadeT = smooth(range(p, 0.92, 1));
  const mix = smooth(range(p, 0.26, 0.36));

  let body = "";
  if (mix < 1) body += `<g opacity="${1}">${sceneAerial(aerialT)}</g>`;
  if (mix > 0) body += `<g opacity="${mix}">${sceneDrive(driveT, doorT)}</g>`;
  body += `<rect width="${W}" height="${H}" fill="url(#vignette)" opacity="${1 - fadeT}"/>`;
  if (fadeT > 0) body += `<rect width="${W}" height="${H}" fill="${CREAM}" opacity="${fadeT}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}${body}</svg>`;
}

export const SCENE_SIZE = { width: W, height: H };
