#!/usr/bin/env node
/**
 * Downloads royalty-free Unsplash stock imagery for PBPP marketing sections.
 * License: Unsplash License (https://unsplash.com/license) — free for commercial use.
 *
 * Run: node scripts/fetch-stock-imagery.mjs
 */
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import sharp from "sharp";

const OUT = join(process.cwd(), "public/media/stock");

/** id, unsplash photo id path, output filename, target width, target height */
const ASSETS = [
  {
    id: "hero-home-exterior",
    url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
    file: "hero/home-exterior.webp",
    width: 2200,
    height: 1238,
    sourcePage: "https://unsplash.com/photos/white-and-brown-concrete-building-under-blue-sky-during-daytime-ba8f99d2cdde",
  },
  {
    id: "service-window-cleaning",
    url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
    file: "services/window-cleaning.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/person-holding-white-plastic-bottle-c64695cc6952",
  },
  {
    id: "service-pressure-washing",
    url: "https://images.unsplash.com/photo-1600585152915-d208bec867a1",
    file: "services/pressure-washing.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/white-and-brown-concrete-house-near-green-trees-during-daytime-d208bec867a1",
  },
  {
    id: "service-residential-cleaning",
    url: "https://images.unsplash.com/photo-1556912173-46c336c7fd55",
    file: "services/residential-cleaning.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/white-wooden-table-with-chairs-46c336c7fd55",
  },
  {
    id: "service-commercial-cleaning",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c",
    file: "services/commercial-cleaning.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/macbook-pro-on-table-beside-white-imac-and-magic-mouse-37526070297c",
  },
  {
    id: "service-property-care",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    file: "services/property-care.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/white-and-brown-concrete-house-with-swimming-pool-be6161a56a0c",
  },
  {
    id: "service-mobile-detailing",
    url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2",
    file: "services/mobile-detailing.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/white-suv-on-road-during-daytime-bd32c8ce0db2",
  },
  {
    id: "service-carpet-cleaning",
    url: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0",
    file: "services/carpet-cleaning.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/white-wooden-table-with-chairs-cde436f6a4d0",
  },
  {
    id: "service-trash-can-cleaning",
    url: "https://images.unsplash.com/photo-1600607687644-c7171b42498f",
    file: "services/trash-can-cleaning.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/white-and-brown-concrete-house-with-swimming-pool-c7171b42498f",
  },
  {
    id: "service-airbnb-turnover",
    url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf",
    file: "services/airbnb-turnover.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/white-wooden-table-with-chairs-757bb62b4baf",
  },
  {
    id: "service-property-maintenance",
    url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d",
    file: "services/property-maintenance.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://images.unsplash.com/photos/white-and-brown-concrete-house-near-green-trees-990dced4db0d",
  },
  {
    id: "service-vacation-home-checks",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    file: "services/vacation-home-checks.webp",
    width: 1200,
    height: 800,
    sourcePage: "https://unsplash.com/photos/white-and-brown-concrete-house-with-swimming-pool-be6161a56a0c",
  },
  {
    id: "path-residential",
    url: "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    file: "sections/residential-path.webp",
    width: 1400,
    height: 933,
    sourcePage: "https://unsplash.com/photos/gray-couch-and-brown-wooden-table-a197022b5858",
  },
  {
    id: "path-commercial",
    url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    file: "sections/commercial-path.webp",
    width: 1400,
    height: 933,
    sourcePage: "https://unsplash.com/photos/people-sitting-on-chair-beside-table-f200968a6e72",
  },
  {
    id: "section-recurring-care",
    url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
    file: "sections/recurring-property-care.webp",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/white-and-brown-house-near-green-trees-during-daytime-ce09059eeffa",
  },
  {
    id: "section-how-it-works",
    url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4",
    file: "sections/how-it-works.webp",
    width: 1600,
    height: 900,
    sourcePage: "https://unsplash.com/photos/white-bed-linen-on-bed-6ed189bf02f4",
  },
  {
    id: "section-final-cta",
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
    file: "sections/final-cta.webp",
    width: 2000,
    height: 1125,
    sourcePage: "https://unsplash.com/photos/white-and-brown-concrete-building-under-blue-sky-during-daytime-ffad4c1539a9",
  },
];

async function fetchAndOptimize(asset) {
  const dest = join(OUT, asset.file);
  await mkdir(dirname(dest), { recursive: true });

  const res = await fetch(`${asset.url}?auto=format&fit=crop&w=${asset.width}&q=85`, {
    headers: { "User-Agent": "PBPP-Stock-Fetch/1.0" },
  });
  if (!res.ok) throw new Error(`Failed ${asset.id}: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const webp = await sharp(buffer)
    .resize(asset.width, asset.height, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  await writeFile(dest, webp);
  const meta = await sharp(webp).metadata();
  console.log(`✓ ${asset.file} (${meta.width}x${meta.height}, ${(webp.length / 1024).toFixed(0)}KB)`);
  return {
    id: asset.id,
    file: `/media/stock/${asset.file}`,
    sourcePage: asset.sourcePage,
    license: "Unsplash License — commercial use permitted",
    bytes: webp.length,
    width: meta.width,
    height: meta.height,
  };
}

const results = [];
for (const asset of ASSETS) {
  results.push(await fetchAndOptimize(asset));
}

await writeFile(
  join(OUT, "manifest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), license: "Unsplash License", assets: results }, null, 2),
);
console.log(`\nWrote ${results.length} assets to public/media/stock/`);
