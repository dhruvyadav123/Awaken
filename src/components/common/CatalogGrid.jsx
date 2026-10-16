import Link from "next/link";
import { readableDate } from "@/lib/public-api";
import { RecordMedia } from "./ApiRecordDisplay";

export default function CatalogGrid({ items, basePath }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => {
      const title = item.title || item.name || "Explore";
      const slug = item.slug;
      const description = item.excerpt || item.shortDescription || item.description || "";
      return <article key={item.id || slug || title} className="overflow-hidden rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        <RecordMedia record={item} compact imagesOnly />
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#66836d]">{item.categoryName || item.levelName || item.level || item.kind || "Awaken"}</p>
          <h2 className="mt-3 font-[Georgia,serif] text-2xl leading-tight text-[#29473c]">{title}</h2>
          {description && <p className="mt-3 line-clamp-4 text-sm leading-7 text-[#647368]">{description}</p>}
          {readableDate(item.publishedAt || item.startDate) && <p className="mt-4 text-xs text-[#738075]">{readableDate(item.publishedAt || item.startDate)}</p>}
          {slug && <Link href={basePath + "/" + encodeURIComponent(slug)} className="mt-5 inline-block text-sm font-semibold text-[#315a48] hover:underline">View details →</Link>}
        </div>
      </article>;
    })}
  </div>;
}
