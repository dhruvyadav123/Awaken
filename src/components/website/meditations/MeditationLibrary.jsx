import Link from "next/link";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { meditationCategory, meditationDuration, meditationFormat, meditationRequiresMembership } from "@/lib/meditation-display";
import { recordMedia } from "@/lib/record-display";
import MeditationPlayer from "./MeditationPlayer";

export default function MeditationLibrary({ items = [], basePath = "/meditations", compact = false, circleLayout = false }) {
  if (circleLayout) return <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6" aria-label="Meditation library">
    {items.map((item, index) => {
      const title = item.title || item.name || "Guided meditation";
      const identifier = item.slug || item.id || item._id;
      const detailHref = identifier ? `${basePath}/${encodeURIComponent(String(identifier))}` : null;
      const locked = meditationRequiresMembership(item);
      const hasThumbnail = recordMedia(item, { scope: "public", imagesOnly: true }).length > 0;
      return <article key={item.id || item._id || identifier || `${title}-${index}`} className="group flex min-w-0 flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#e9a8d0] bg-[radial-gradient(circle_at_35%_25%,#fff,#f5edf7_60%,#ead5eb)] shadow-[0_7px_18px_rgba(180,94,159,0.13)] transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_rgba(180,94,159,0.22)] sm:h-28 sm:w-28">
          {!hasThumbnail && <div className="grid h-full w-full place-items-center text-[#8d5f96]" aria-hidden="true"><span className="font-[Georgia,serif] text-3xl">✦</span></div>}
          {hasThumbnail && <div className="absolute inset-0 flex items-center justify-center [&_.api-media-gallery]:!m-0 [&_.api-media-gallery]:!flex [&_.api-media-gallery]:!h-full [&_.api-media-gallery]:!w-full [&_.api-media-gallery]:!items-center [&_.api-media-gallery]:!justify-center [&_.api-media-asset]:!flex [&_.api-media-asset]:!h-full [&_.api-media-asset]:!w-full [&_.api-media-asset]:!items-center [&_.api-media-asset]:!justify-center [&_.api-media-asset]:!border-0 [&_.api-media-asset]:!p-0 [&_.api-media-asset]:!bg-transparent [&_img]:!h-full [&_img]:!max-h-none [&_img]:!w-full [&_img]:!rounded-none [&_img]:!object-cover [&_img]:!object-center [&_img]:!scale-[1.12] [&_img]:!translate-y-[3%]"><RecordMedia record={item} compact imagesOnly /></div>}
          {locked && <span className="absolute right-0.5 top-0.5 rounded-full bg-[#292957] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">Pro</span>}
          {detailHref && <Link href={detailHref} aria-label={`Open ${title}`} className="absolute inset-0 rounded-full" />}
        </div>
        <p className="mt-2 max-w-32 text-[10px] font-semibold leading-4 text-[#292957] sm:text-[11px]">{detailHref ? <Link href={detailHref} className="hover:text-[#5b57c0]">{title}</Link> : title}</p>
        <p className="mt-1 text-[9px] text-[#817f9e]">{meditationFormat(item)} · {meditationDuration(item)}</p>
        <div className="mt-1 w-full max-w-[150px] [&_audio]:h-7 [&_audio]:w-full"><MeditationPlayer meditation={item} compact /></div>
      </article>;
    })}
  </div>;

  return <div className={`${compact ? "home-meditation-cards " : ""}grid gap-3 sm:grid-cols-2 lg:grid-cols-3`} aria-label="Meditation library">
    {items.map((item, index) => {
      const title = item.title || item.name || "Guided meditation";
      const identifier = item.slug || item.id || item._id;
      const detailHref = identifier ? `${basePath}/${encodeURIComponent(String(identifier))}` : null;
      const locked = meditationRequiresMembership(item);
      const hasThumbnail = recordMedia(item, { scope: "public", imagesOnly: true }).length > 0;
      return <article key={item.id || item._id || identifier || `${title}-${index}`} className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#dfe7dd] bg-white shadow-[0_5px_16px_rgba(41,74,61,.045)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8d8c7] hover:shadow-[0_9px_22px_rgba(41,74,61,.075)] [&_audio]:h-8 [&_audio]:max-w-full">
        <div className="relative aspect-[16/8.5] overflow-hidden bg-[radial-gradient(circle_at_25%_20%,#f7f3e8,#dfe9dc_58%,#c8d9c8)] [&_.api-media-gallery]:absolute [&_.api-media-gallery]:inset-0 [&_.api-media-gallery]:m-0 [&_.api-media-gallery]:h-full [&_.api-media-asset]:h-full [&_.api-media-asset]:p-0 [&_.api-media-asset]:bg-transparent [&_img]:h-full [&_img]:!max-h-none [&_img]:!rounded-none [&_img]:object-cover">
          {!hasThumbnail && <div className="absolute inset-0 grid place-items-center text-[#66836d]" aria-hidden="true"><span className="grid h-20 w-20 place-items-center rounded-full border border-white/70 bg-white/35 font-[Georgia,serif] text-4xl italic shadow-inner">◌</span></div>}
          {hasThumbnail && <RecordMedia record={item} compact imagesOnly />}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#29473c]/35 to-transparent" />
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#fffdf8]/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[.1em] text-[#315a48] backdrop-blur">{meditationFormat(item)}</span>
          {locked && <span className="absolute right-2.5 top-2.5 rounded-full bg-[#29473c]/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[.08em] text-white">Members</span>}
        </div>
        <div className="flex flex-1 flex-col p-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#66836d]">{meditationCategory(item)}</p>
          <h2 className="mt-1.5 font-[Georgia,serif] text-lg leading-tight text-[#29473c]">{detailHref ? <Link href={detailHref} className="transition-colors hover:text-[#66836d]">{title}</Link> : title}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#647368]"><span>{meditationDuration(item)}</span><span aria-hidden="true">·</span><span>{locked ? "Membership access" : "Access checked at playback"}</span></div>
          {(item.shortDescription || item.description || item.excerpt) && <p className="mt-2.5 line-clamp-2 text-xs leading-5 text-[#647368]">{item.shortDescription || item.description || item.excerpt}</p>}
          {detailHref && <Link href={detailHref} className="mt-5 inline-flex min-h-10 w-fit items-center rounded-md border border-[#315a48] px-4 text-xs font-semibold text-[#315a48] transition-colors hover:bg-[#315a48] hover:text-white">View meditation details <span className="ml-2" aria-hidden="true">→</span></Link>}
          <MeditationPlayer meditation={item} compact />
        </div>
      </article>;
    })}
  </div>;
}
