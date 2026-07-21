import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeforeAfterGallery } from "@/components/platform/before-after-slider";
import { getSiteProjectBySlug, getSiteProjects } from "@/lib/site-content/queries";
import { buildBeforeAfterPairsFromProjectMedia } from "@/lib/platform/modules/gallery";
import { PROJECT_CATEGORY_LABELS, resolveMediaUrl, type ProjectCategory } from "@/lib/site-content/types";
import { QUOTE_PATH, SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projects = await getSiteProjects({ publishedOnly: true });
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getSiteProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.title} | ${SITE_NAME}`,
    description: project.short_summary,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getSiteProjectBySlug(slug);
  if (!project) notFound();

  const beforeAfterPairs = buildBeforeAfterPairsFromProjectMedia(project.media ?? [], project.title);
  const phases = ["before", "during", "after", "general"] as const;

  return (
    <div className="bg-cream">
      <article className="mx-auto max-w-6xl px-6 py-16">
        <Link href="/projects" className="text-sm font-semibold text-ocean hover:underline">
          ← All projects
        </Link>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.service_categories.map((cat) => (
            <span key={cat} className="rounded-full bg-sky/60 px-2.5 py-1 text-[11px] font-semibold text-navy">
              {PROJECT_CATEGORY_LABELS[cat as ProjectCategory] ?? cat}
            </span>
          ))}
        </div>

        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {project.title}
        </h1>
        {project.city ? (
          <p className="mt-2 text-sm font-medium uppercase tracking-wide text-charcoal/60">{project.city}</p>
        ) : null}
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-charcoal/90">{project.short_summary}</p>

        {project.long_description ? (
          <section className="prose prose-navy mt-10 max-w-3xl">
            <div className="whitespace-pre-wrap text-charcoal/90">{project.long_description}</div>
          </section>
        ) : null}

        {beforeAfterPairs.length ? (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-navy">Before &amp; after</h2>
            <div className="mt-4">
              <BeforeAfterGallery pairs={beforeAfterPairs} />
            </div>
          </section>
        ) : null}

        {project.media?.length ? (
          <section className="mt-12 space-y-10">
            {phases.map((phase) => {
              const items = project.media!.filter((m) => m.gallery_phase === phase);
              if (!items.length) return null;
              return (
                <div key={phase}>
                  <h2 className="text-lg font-bold capitalize text-navy">{phase.replace("_", " ")}</h2>
                  <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {items.map((item) => {
                      const src = resolveMediaUrl(item.media ?? null);
                      if (!src) return null;
                      return (
                        <li key={item.id} className="overflow-hidden rounded-xl border border-navy/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={item.media?.alt_text ?? project.title}
                            className="aspect-[4/3] w-full object-cover"
                            loading="lazy"
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </section>
        ) : null}

        {project.testimonial ? (
          <blockquote className="mt-12 max-w-3xl rounded-xl border border-leaf/30 bg-white p-6 shadow-md">
            <p className="text-lg italic text-charcoal/90">&ldquo;{project.testimonial}&rdquo;</p>
            {project.testimonial_author ? (
              <footer className="mt-3 text-sm font-semibold text-navy">— {project.testimonial_author}</footer>
            ) : null}
          </blockquote>
        ) : null}

        <div className="mt-12 max-w-3xl rounded-xl bg-navy p-8 text-center text-cream shadow-md">
          <p className="text-lg font-semibold">Want similar results?</p>
          <Link href={QUOTE_PATH} className="btn-inverse-lg mt-6 inline-flex">
            Request a Free Estimate
          </Link>
        </div>
      </article>
    </div>
  );
}
