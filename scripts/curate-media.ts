import { curateAllProjects } from "../lib/media-curation/curate";

async function main() {
  console.log("PBPP Media Curation Pipeline\n");
  const manifest = await curateAllProjects();
  console.log("\nHomepage recommendations:");
  console.log(`  Hero image: ${manifest.homepage.heroImage?.src ?? "—"}`);
  console.log(`  Hero clip:  ${manifest.homepage.heroClip?.src ?? "—"}`);
  console.log(`  Featured:   ${manifest.homepage.featuredTransformation?.label ?? "—"}`);
  console.log(`  Projects:   ${manifest.projects.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
