import Link from "next/link";
import { readableDate } from "@/lib/public-api";
import { RecordMedia } from "./ApiRecordDisplay";

export default function CatalogGrid({ items, basePath }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => {
      const title = item.title || item.name || "Explore";
      const slug = item.slug;
      const description = item.excerpt || item.shortDescription || item.description || "";
      const category = item.catalogs?.category?.name || item.categoryName || item.category?.name;
      const level = item.catalogs?.level?.name || item.levelName || (typeof item.level === "string" ? item.level : item.level?.name);
      const metadata = category || level || item.kind;
      const price = item.discountPrice ?? item.regularPrice ?? item.price ?? item.amount;
      const currency = item.currency || "";
      return <article key={item.id || slug || title} className="overflow-hidden rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        <RecordMedia record={item} compact imagesOnly />
        <div className="p-6">
          {metadata && <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#66836d]">{metadata}</p>}
          <h2 className={`${metadata ? "mt-3" : ""} font-[Georgia,serif] text-2xl leading-tight text-[#29473c]`}>{title}</h2>
          {description && <p className="mt-3 line-clamp-4 text-sm leading-7 text-[#647368]">{description}</p>}
          {(price !== undefined || item.lessonCount !== undefined || item.sectionCount !== undefined) && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#738075]">
            {price !== undefined && <span>{currency} {Number(price).toLocaleString("en-IN")}</span>}
            {item.lessonCount !== undefined && <span>{item.lessonCount} {Number(item.lessonCount) === 1 ? "lesson" : "lessons"}</span>}
            {item.sectionCount !== undefined && <span>{item.sectionCount} {Number(item.sectionCount) === 1 ? "section" : "sections"}</span>}
          </div>}
          {readableDate(item.publishedAt || item.startDate) && <p className="mt-4 text-xs text-[#738075]">{readableDate(item.publishedAt || item.startDate)}</p>}
          {slug && <Link href={basePath + "/" + encodeURIComponent(slug)} className="mt-5 inline-block text-sm font-semibold text-[#315a48] hover:underline">View details →</Link>}
        </div>
      </article>;
    })}
  </div>;
}
