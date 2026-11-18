#!/usr/bin/env node
/**
 * Generates PLACEHOLDER "detail of work" tiles in public/site/details/.
 * Replace each file with a real close-up photo of the same name (800x1000,
 * portrait, .webp or .jpg — update lib/site/details.ts if you change names).
 * Rule: details only — no house exteriors, faces, addresses, gates, or plates.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const W = 800, H = 1000;
const bg = (a, b) => `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`;
const s = (body, a, b) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${bg(a, b)}${body}</svg>`;

const tiles = {
  "thermostat": s(`<rect x="250" y="330" width="300" height="340" rx="40" fill="#F7F2E9" stroke="#C9B48E" stroke-width="6"/><circle cx="400" cy="470" r="95" fill="none" stroke="#0C2340" stroke-width="10"/><text x="400" y="495" font-family="Georgia" font-size="76" text-anchor="middle" fill="#0C2340">76°</text><text x="400" y="620" font-family="Arial" font-size="28" text-anchor="middle" fill="#7A5A28">HUMIDITY 50%</text>`, "#E8DCC8", "#CDBB98"),
  "shutters": s(Array.from({length: 14}, (_, i) => `<rect x="170" y="${180 + i * 46}" width="460" height="30" rx="6" fill="#E9E4DA" stroke="#B8AE9C" stroke-width="3"/>`).join("") + `<rect x="150" y="160" width="20" height="680" fill="#9E9584"/><rect x="630" y="160" width="20" height="680" fill="#9E9584"/>`, "#7E9AA8", "#4F6E7E"),
  "photo-report": s(`<rect x="230" y="140" width="340" height="700" rx="48" fill="#0C2340"/><rect x="250" y="200" width="300" height="580" rx="10" fill="#FAF8F4"/><rect x="270" y="225" width="260" height="22" rx="6" fill="#C2A06A"/>${[0,1,2].map(r=>[0,1].map(c=>`<rect x="${272+c*132}" y="${270+r*150}" width="120" height="132" rx="8" fill="${["#8FB3A3","#D9C29A","#9BB7C9"][(r+c)%3]}"/>`).join("")).join("")}<rect x="272" y="725" width="200" height="16" rx="6" fill="#B8C4CE"/>`, "#F1E7D6", "#D9C7A6"),
  "keys": s(`<circle cx="330" cy="420" r="90" fill="none" stroke="#C2A06A" stroke-width="18"/><rect x="380" y="460" width="230" height="34" rx="10" fill="#C2A06A" transform="rotate(35 380 460)"/><rect x="520" y="560" width="22" height="50" fill="#C2A06A" transform="rotate(35 520 560)"/><rect x="250" y="560" width="190" height="120" rx="14" fill="#F7F2E9" stroke="#7A5A28" stroke-width="4"/><text x="345" y="635" font-family="Arial" font-size="40" font-weight="700" text-anchor="middle" fill="#0C2340">K-17</text>`, "#2F4A5E", "#1A2F40"),
  "pool-equipment": s(`<rect x="160" y="520" width="480" height="40" fill="#5C6670"/><rect x="200" y="360" width="150" height="170" rx="20" fill="#D8DEE3" stroke="#8A96A0" stroke-width="5"/><circle cx="520" cy="430" r="90" fill="#2A6F97"/><circle cx="520" cy="430" r="55" fill="#E6F3F8"/><path d="M350 440 H430" stroke="#8A96A0" stroke-width="22"/><path d="M275 360 V250 H520 V340" stroke="#8A96A0" stroke-width="18" fill="none"/>`, "#CFE2E8", "#9EC3CF"),
  "flowers": s(`<rect x="320" y="560" width="160" height="230" rx="30" fill="#E6F3F8" stroke="#B8C4CE" stroke-width="5"/>${[[400,380],[330,430],[470,430],[360,330],[445,325],[400,460]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="58" fill="${["#F4E3E0","#FBF4E8","#F2D6CF"][i%3]}"/><circle cx="${x}" cy="${y}" r="16" fill="#E2C27A"/>`).join("")}<path d="M400 560 V470 M360 560 L340 470 M440 560 L460 470" stroke="#6A8F6B" stroke-width="8"/>`, "#FAF3E6", "#E8DCC8"),
};

mkdirSync("public/site/details", { recursive: true });
for (const [name, svg] of Object.entries(tiles)) {
  await sharp(Buffer.from(svg)).resize(480, 600).webp({ quality: 72 }).toFile(`public/site/details/${name}.webp`);
}
console.log("Wrote", Object.keys(tiles).length, "placeholder detail tiles");
