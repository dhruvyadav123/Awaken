import Link from "next/link";
import { readableDate } from "@/lib/public-api";
import { RecordMedia } from "./ApiRecordDisplay";

export default function CatalogGrid({ items, basePath, variant = "" }) {
  const course = variant === "course";
  return <div className={course ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
    {items.map((item) => {
      const title = item.title || item.name || "Explore";
      const slug = item.slug;
      const description = item.excerpt || item.shortDescription || item.description || "";
      const category = item.catalogs?.category?.name || item.categoryName || item.category?.name;
      const level = item.catalogs?.level?.name || item.levelName || (typeof item.level === "string" ? item.level : item.level?.name);
      const metadata = category || level || item.kind;
      const price = item.discountPrice ?? item.regularPrice ?? item.price ?? item.amount;
      const currency = item.currency || "";
      return <article key={item.id || slug || title} className={course ? "group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#dfe7dd] bg-white shadow-[0_5px_16px_rgba(41,74,61,.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#c8d8c7] hover:shadow-[0_12px_26px_rgba(41,74,61,.09)]" : "overflow-hidden rounded-xl border border-[#dfe7dd] bg-white shadow-sm"}>
        <div className={course ? "overflow-hidden bg-[#edf3ea] [&_.api-media-asset]:!bg-transparent [&_.api-media-asset]:!p-0 [&_img]:!max-h-none [&_img]:!rounded-none" : ""}><RecordMedia record={item} compact imagesOnly /></div>
        <div className={course ? "flex flex-1 flex-col p-4 sm:p-5" : "p-6"}>
          {metadata && <p className={course ? "text-[10px] font-semibold uppercase tracking-[.16em] text-[#66836d]" : "text-xs font-semibold uppercase tracking-[.16em] text-[#66836d]"}>{metadata}</p>}
          <h2 className={`${metadata ? (course ? "mt-2" : "mt-3") : ""} font-[Georgia,serif] ${course ? "line-clamp-2 text-xl leading-[1.18]" : "text-2xl leading-tight"} text-[#29473c]`}>{title}</h2>
          {description && <p className={course ? "mt-2 line-clamp-3 text-xs leading-6 text-[#647368]" : "mt-3 line-clamp-4 text-sm leading-7 text-[#647368]"}>{description}</p>}
          {(price !== undefined || item.lessonCount !== undefined || item.sectionCount !== undefined) && <div className={course ? "mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs text-[#738075]" : "mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#738075]"}>
            {price !== undefined && <span>{currency} {Number(price).toLocaleString("en-IN")}</span>}
            {item.lessonCount !== undefined && <span>{item.lessonCount} {Number(item.lessonCount) === 1 ? "lesson" : "lessons"}</span>}
            {item.sectionCount !== undefined && <span>{item.sectionCount} {Number(item.sectionCount) === 1 ? "section" : "sections"}</span>}
          </div>}
          {readableDate(item.publishedAt || item.startDate) && <p className={course ? "mt-2 text-xs text-[#738075]" : "mt-4 text-xs text-[#738075]"}>{readableDate(item.publishedAt || item.startDate)}</p>}
          {slug && <Link href={`${basePath}/${encodeURIComponent(slug)}`} className={course ? "mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#315a48] px-4 text-xs font-semibold !text-white transition hover:bg-[#254638]" : "mt-5 inline-block text-sm font-semibold text-[#315a48] hover:underline"}>{course ? <>View course <span className="ml-2" aria-hidden="true">→</span></> : "View details →"}</Link>}
        </div>
      </article>;
    })}
  </div>;
}
