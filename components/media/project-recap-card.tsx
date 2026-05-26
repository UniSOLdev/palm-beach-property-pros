import Link from "next/link";
import { MediaAssetImage } from "@/components/media/media-asset-image";
import { MediaFrame } from "@/components/media/media-frame";
import { ScaffoldNotice } from "@/components/media/scaffold-notice";
import type { ProjectRecap } from "@/lib/media/types";

export function ProjectRecapCard({ project }: { project: ProjectRecap }) {
  return (
    <article className="project-recap-card group flex flex-col overflow-hidden">
      <MediaFrame aspect="landscape" className="image-frame rounded-b-none border-b-0">
        <MediaAssetImage asset={project.image} width={900} />
        <div className="absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-navy-deep/75 via-navy-deep/20 to-transparent p-5 pt-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-aqua/90">
            {project.division}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-cream">{project.title}</h3>
        </div>
        {project.isScaffold ? (
          <div className="absolute right-3 top-3 z-[4]">
            <ScaffoldNotice compact />
          </div>
        ) : null}
      </MediaFrame>
      <div className="flex flex-1 flex-col rounded-b-2xl border border-t-0 border-navy/[0.08] bg-gradient-to-b from-white to-cream/40 p-6 md:rounded-b-3xl md:p-7">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal/55">
          <span>{project.location}</span>
          <span aria-hidden>·</span>
          <span>{project.duration}</span>
        </div>
        <p className="mt-4 text-sm font-semibold text-navy">What we handled</p>
        <ul className="mt-3 space-y-2">
          {project.handled.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-charcoal/75">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-aqua/80" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <Link href="/quote" className="link-luxury mt-6 inline-block">
          Discuss a similar scope
        </Link>
      </div>
    </article>
  );
}
