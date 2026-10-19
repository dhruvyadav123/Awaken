import Link from "next/link";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { meditationCategory, meditationDuration, meditationFormat, meditationRequiresMembership } from "@/lib/meditation-display";
import MeditationPlayer from "./MeditationPlayer";

export default function MeditationLibrary({ items = [], basePath = "/meditations" }) {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Meditation library">
    {items.map((item, index) => {
      const title = item.title || item.name || "Guided meditation";
      const slug = item.slug;
      const locked = meditationRequiresMembership(item);
      return <article key={item.id || slug || `${title}-${index}`} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dfe7dd] bg-white shadow-[0_12px_35px_rgba(41,74,61,.06)]">
        <div className="relative min-h-40 overflow-hidden bg-[linear-gradient(145deg,#dfe8dc,#f2ede3)] [&_.api-media-gallery]:h-full [&_.api-media-asset]:h-full [&_img]:h-full [&_img]:min-h-40 [&_img]:object-cover">
          <RecordMedia record={item} compact imagesOnly />
          <span className="absolute left-4 top-4 rounded-full bg-[#fffdf8]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#315a48] backdrop-blur">{meditationFormat(item)}</span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#66836d]">{meditationCategory(item)}</p>
          <h2 className="mt-3 font-[Georgia,serif] text-2xl leading-tight text-[#29473c]">{title}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#647368]"><span>{meditationDuration(item)}</span><span aria-hidden="true">·</span><span>{locked ? "Membership access" : "Access checked at playback"}</span></div>
          {(item.shortDescription || item.description || item.excerpt) && <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#647368]">{item.shortDescription || item.description || item.excerpt}</p>}
          <MeditationPlayer meditation={item} compact />
          {slug && <Link href={`${basePath}/${encodeURIComponent(slug)}`} className="mt-5 inline-flex text-sm font-semibold text-[#315a48] hover:underline">View meditation details →</Link>}
        </div>
      </article>;
    })}
  </div>;
}
