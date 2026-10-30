import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";

import CategoryNavigation from "@/components/common/CategoryNavigation";
import { getPublicCategories } from "@/lib/category-data";
import { publicApi, validPage } from "@/lib/public-api";

export const metadata = { title: "Training and Classes | AwakenWithMeheck" };

function dateLabel(value) {
  if (!value) return "Schedule to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function classSchedule(item) {
  const date = item.startsAt || item.date;
  const time = item.startTime ? ` · ${item.startTime}${item.endTime ? `–${item.endTime}` : ""}` : "";
  return `${dateLabel(date)}${time}`;
}

function classMode(item) {
  if (item.mode === "OFFLINE") return item.city || item.venue || "In person";
  if (item.mode === "HYBRID") return "Online + in person";
  return "Online";
}

function ClassCard({ item, categoryNames }) {
  const title = item.title || item.name || "Class";
  const category = categoryNames.get(String(item.categoryId));
  const facilitator = item.facilitator?.displayName || "Facilitator details available";
  return <article className="group overflow-hidden rounded-2xl border border-[#dfe7dd] bg-white shadow-[0_8px_22px_rgba(41,74,61,.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#bfd2c2] hover:shadow-[0_12px_28px_rgba(41,74,61,.1)]">
    <div className="relative aspect-[16/8.5] overflow-hidden bg-[#e9efe8] [&_.api-media-gallery]:absolute [&_.api-media-gallery]:inset-0 [&_.api-media-gallery]:m-0 [&_.api-media-gallery]:h-full [&_.api-media-asset]:h-full [&_.api-media-asset]:border-0 [&_.api-media-asset]:bg-transparent [&_.api-media-asset]:p-0 [&_img]:h-full [&_img]:!max-h-none [&_img]:rounded-none [&_img]:object-cover">
      <RecordMedia record={item} compact imagesOnly />
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#315a48] shadow-sm backdrop-blur">{item.kind === "WORKSHOP" ? "Workshop" : "Class"}</span>
    </div>
    <div className="p-5">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#66836d]">
        {category && <span>{category}</span>}
        {item.registrationOpen === true && <span className="rounded-full bg-[#e8f3e7] px-2 py-1 text-[#3d7650]">Registration open</span>}
      </div>
      <h2 className="mt-2 font-[Georgia,serif] text-2xl leading-tight text-[#29473c]">{title}</h2>
      {(item.description || item.shortDescription || item.excerpt) && <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-[#647368]">{item.description || item.shortDescription || item.excerpt}</p>}
      <dl className="mt-4 grid gap-2 border-t border-[#edf0ed] pt-4 text-xs text-[#647368] sm:grid-cols-2">
        <div><dt className="font-semibold text-[#41654e]">When</dt><dd className="mt-0.5">{classSchedule(item)}</dd></div>
        <div><dt className="font-semibold text-[#41654e]">Format</dt><dd className="mt-0.5">{classMode(item)}</dd></div>
        <div className="sm:col-span-2"><dt className="font-semibold text-[#41654e]">Facilitator</dt><dd className="mt-0.5">{facilitator}</dd></div>
      </dl>
      {item.slug && <Link className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-[#315a48] px-4 text-xs font-semibold text-white transition hover:bg-[#254638]" href={`/classes/${encodeURIComponent(item.slug)}`}>View class details <span className="ml-2" aria-hidden="true">→</span></Link>}
    </div>
  </article>;
}

export default async function ClassesPage({ searchParams }) {
  const query = await searchParams;
  const page = validPage(query?.page);
  const [result, categoryResult] = await Promise.all([publicApi("classes", { page, limit: 20 }), getPublicCategories()]);
  const classes = Array.isArray(result.data) ? result.data : [];
  const pages = Number(result.pagination?.pages) || 0;
  const categoryNames = new Map((Array.isArray(categoryResult.data) ? categoryResult.data : []).map((category) => [String(category.id), category.name]));

  return <main className="min-h-screen bg-[#f7faf6] text-[#29473c]">
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <header className="max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#66836d]">AwakenWithMeheck · Classes</p>
        <h1 className="mt-2 font-[Georgia,serif] text-4xl leading-tight text-[#29473c] sm:text-5xl">Find a class that fits your practice.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#647368]">Browse currently published classes and workshops by category, format and schedule.</p>
      </header>

      <section className="mt-7 rounded-2xl border border-[#dfe7dd] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(41,74,61,.04)] sm:px-5" aria-label="Class catalogue status">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2 font-semibold text-[#314c3c]"><span className={`h-2 w-2 rounded-full ${result.error ? "bg-[#bd794d]" : "bg-[#60806c]"}`} aria-hidden="true" />{result.error ? "Class catalogue unavailable" : `${classes.length} published ${classes.length === 1 ? "class" : "classes"}`}</span>
          <Link href="/contact" className="font-semibold text-[#315a48] hover:underline">Ask about a class →</Link>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="class-list-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#66836d]">Explore the catalogue</p><h2 id="class-list-title" className="mt-1 font-[Georgia,serif] text-3xl text-[#29473c]">Current classes</h2></div>
          {!result.error && <p className="text-xs text-[#718078]">Page {page}{pages > 1 ? ` of ${pages}` : ""}</p>}
        </div>
        <div className="mt-4">{categoryResult.error ? <p role="alert" className="text-sm text-[#8a4c3c]">Categories could not be loaded. You can still browse all classes.</p> : <CategoryNavigation categories={categoryResult.data} type="CLASS" compact />}</div>
        {result.error ? <p role="alert" className="mt-6 rounded-xl border border-[#eadbd4] bg-white p-5 text-sm text-[#8a4c3c]">{result.error}</p> : classes.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{classes.map((item) => <ClassCard key={item.id || item.slug} item={item} categoryNames={categoryNames} />)}</div> : <p className="mt-6 rounded-xl border border-[#dfe7dd] bg-white p-6 text-sm text-[#647368]">There are no published classes at the moment.</p>}
        {pages > 1 && <nav aria-label="Class pages" className="mt-6 flex items-center gap-5 text-sm"><>{page > 1 && <Link href={`/classes?page=${page - 1}`} className="font-semibold text-[#315a48] hover:underline">← Previous</Link>}</><span>Page {page} of {pages}</span>{page < pages && <Link href={`/classes?page=${page + 1}`} className="font-semibold text-[#315a48] hover:underline">Next →</Link>}</nav>}
      </section>
    </div>
  </main>;
}
