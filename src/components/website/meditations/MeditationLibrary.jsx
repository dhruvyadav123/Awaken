
import Link from "next/link";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import {
  meditationCategory,
  meditationDuration,
  meditationFormat,
  meditationRequiresMembership,
} from "@/lib/meditation-display";
import { recordMedia } from "@/lib/record-display";
import MeditationPlayer from "./MeditationPlayer";

export default function MeditationLibrary({
  items = [],
  basePath = "/meditations",
  compact = false,
  circleLayout = false,
}) {
  if (circleLayout) {
    return (
      <div
        className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        aria-label="Meditation library"
      >
        {items.map((item, index) => {
          const title = item.title || item.name || "Guided meditation";
          const identifier = item.slug || item.id || item._id;
          const detailHref = identifier
            ? `${basePath}/${encodeURIComponent(String(identifier))}`
            : null;

          const hasThumbnail =
            recordMedia(item, {
              scope: "public",
              imagesOnly: true,
            }).length > 0;

          return (
            <article
              key={item.id || item._id || identifier || `${title}-${index}`}
              className="group flex min-w-0 flex-col items-center text-center"
            >
              <div className="relative aspect-[8/5] w-full overflow-hidden rounded-xl bg-[#f5f4f5] ring-1 ring-[#eee7ed] transition-shadow duration-200 group-hover:shadow-[0_5px_16px_rgba(41,41,87,0.10)]">
                {!hasThumbnail ? (
                  <div
                    className="absolute inset-0 grid place-items-center text-[#94789d]"
                    aria-hidden="true"
                  >
                    <span className="font-[Georgia,serif] text-3xl">✦</span>
                  </div>
                ) : (
                  <div
                    className="absolute inset-0 h-full w-full overflow-hidden
                      [&_.api-media-gallery]:!absolute
                      [&_.api-media-gallery]:!inset-0
                      [&_.api-media-gallery]:!m-0
                      [&_.api-media-gallery]:!h-full
                      [&_.api-media-gallery]:!w-full
                      [&_.api-media-gallery]:!max-h-none
                      [&_.api-media-gallery]:!max-w-none
                      [&_.api-media-gallery]:!gap-0
                      [&_.api-media-gallery]:!p-0
                      [&_.api-media-asset]:!relative
                      [&_.api-media-asset]:!m-0
                      [&_.api-media-asset]:!h-full
                      [&_.api-media-asset]:!w-full
                      [&_.api-media-asset]:!max-h-none
                      [&_.api-media-asset]:!max-w-none
                      [&_.api-media-asset]:!overflow-hidden
                      [&_.api-media-asset]:!rounded-none
                      [&_.api-media-asset]:!border-0
                      [&_.api-media-asset]:!bg-transparent
                      [&_.api-media-asset]:!p-0
                      [&_.api-media-asset>div]:!h-full
                      [&_.api-media-asset>div]:!w-full
                      [&_picture]:!block
                      [&_picture]:!h-full
                      [&_picture]:!w-full
                      [&_img]:!block
                      [&_img]:!h-full
                      [&_img]:!w-full
                      [&_img]:!max-h-full
                      [&_img]:!max-w-full
                      [&_img]:!rounded-none
                      [&_img]:!object-contain
                      [&_img]:!object-center"
                  >
                    <RecordMedia record={item} compact imagesOnly />
                  </div>
                )}

                {detailHref && (
                  <Link
                    href={detailHref}
                    aria-label={`Open ${title}`}
                    className="absolute inset-0 z-10 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#5651a4]"
                  />
                )}
              </div>

              <h3 className="mt-2 w-full text-[12px] font-semibold leading-[1.35] text-[#292957] sm:text-[13px]">
                {detailHref ? (
                  <Link href={detailHref} className="hover:text-[#5651a4]">
                    {title}
                  </Link>
                ) : (
                  title
                )}
              </h3>

              <p className="mt-0.5 text-[10px] leading-4 text-[#817f9e] sm:text-[11px]">
                {meditationFormat(item)} · {meditationDuration(item)}
              </p>

              <div className="mt-1 w-full [&_audio]:h-8 [&_audio]:w-full">
                <MeditationPlayer meditation={item} compact />
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`${
        compact ? "home-meditation-cards " : ""
      }grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}
      aria-label="Meditation library"
    >
      {items.map((item, index) => {
        const title =
          item.title || item.name || "Guided meditation";

        const identifier =
          item.slug || item.id || item._id;

        const detailHref = identifier
          ? `${basePath}/${encodeURIComponent(
              String(identifier)
            )}`
          : null;

        const locked = meditationRequiresMembership(item);

        const hasThumbnail =
          recordMedia(item, {
            scope: "public",
            imagesOnly: true,
          }).length > 0;

        return (
          <article
            key={
              item.id ||
              item._id ||
              identifier ||
              `${title}-${index}`
            }
            className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#dfe7dd] bg-white shadow-[0_5px_16px_rgba(41,74,61,.045)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8d8c7] hover:shadow-[0_9px_22px_rgba(41,74,61,.075)] [&_audio]:h-8 [&_audio]:max-w-full"
          >
            <div className="relative aspect-[16/8.5] overflow-hidden bg-[radial-gradient(circle_at_25%_20%,#f7f3e8,#dfe9dc_58%,#c8d9c8)] [&_.api-media-gallery]:absolute [&_.api-media-gallery]:inset-0 [&_.api-media-gallery]:m-0 [&_.api-media-gallery]:h-full [&_.api-media-asset]:h-full [&_.api-media-asset]:p-0 [&_.api-media-asset]:bg-transparent [&_img]:h-full [&_img]:!max-h-none [&_img]:!rounded-none [&_img]:object-cover">
              {!hasThumbnail && (
                <div
                  className="absolute inset-0 grid place-items-center text-[#66836d]"
                  aria-hidden="true"
                >
                  <span className="grid h-20 w-20 place-items-center rounded-full border border-white/70 bg-white/35 font-[Georgia,serif] text-4xl italic shadow-inner">
                    ◌
                  </span>
                </div>
              )}

              {hasThumbnail && (
                <RecordMedia
                  record={item}
                  compact
                  imagesOnly
                />
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#29473c]/35 to-transparent" />

              <span className="absolute left-2.5 top-2.5 rounded-full bg-[#fffdf8]/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[.1em] text-[#315a48] backdrop-blur">
                {meditationFormat(item)}
              </span>

              {locked && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-[#29473c]/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[.08em] text-white">
                  Members
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-3.5">
              <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#66836d]">
                {meditationCategory(item)}
              </p>

              <h2 className="mt-1.5 font-[Georgia,serif] text-lg leading-tight text-[#29473c]">
                {detailHref ? (
                  <Link
                    href={detailHref}
                    className="transition-colors hover:text-[#66836d]"
                  >
                    {title}
                  </Link>
                ) : (
                  title
                )}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#647368]">
                <span>{meditationDuration(item)}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {locked
                    ? "Membership access"
                    : "Access checked at playback"}
                </span>
              </div>

              {(item.shortDescription ||
                item.description ||
                item.excerpt) && (
                <p className="mt-2.5 line-clamp-2 text-xs leading-5 text-[#647368]">
                  {item.shortDescription ||
                    item.description ||
                    item.excerpt}
                </p>
              )}

              {detailHref && (
                <Link
                  href={detailHref}
                  className="mt-5 inline-flex min-h-10 w-fit items-center rounded-md border border-[#315a48] px-4 text-xs font-semibold text-[#315a48] transition-colors hover:bg-[#315a48] hover:text-white"
                >
                  View meditation details
                  <span
                    className="ml-2"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              )}

              <MeditationPlayer
                meditation={item}
                compact
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
