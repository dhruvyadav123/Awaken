import Link from "next/link";

import CategoryNavigation from "@/components/common/CategoryNavigation";
import ClassesDirectory from "@/components/website/classes/ClassesDirectory";
import { getPublicCategories } from "@/lib/category-data";
import { publicApi, validPage } from "@/lib/public-api";

export const metadata = { title: "Training and Classes | AwakenWithMeheck" };

export default async function ClassesPage({ searchParams }) {
  const query = await searchParams;
  const page = validPage(query?.page);
  const [result, categoryResult] = await Promise.all([
    publicApi("classes", { page, limit: 20 }),
    getPublicCategories(),
  ]);
  const classes = Array.isArray(result.data) ? result.data : [];
  const pages = Number(result.pagination?.pages) || 0;
  const orderedClasses = [...classes].sort((a, b) => Date.parse(a.startsAt || a.startDate || a.date || "") - Date.parse(b.startsAt || b.startDate || b.date || ""));
  const featuredClasses = orderedClasses.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#f7faf6] text-[#29473c]">
      <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8 sm:py-6">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#66836d]">AwakenWithMeheck · Classes</p>
          <h1 className="mt-2 font-[Georgia,serif] text-4xl leading-tight text-[#29473c] sm:text-5xl">Find a class that fits your practice.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#647368]">Browse upcoming classes and workshops by schedule, facilitator and format.</p>
        </header>

        <section className="mt-5 rounded-2xl border border-[#dfe7dd] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(41,74,61,.04)]" aria-label="Class catalogue status">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-semibold text-[#314c3c]"><span className={`h-2 w-2 rounded-full ${result.error ? "bg-[#bd794d]" : "bg-[#60806c]"}`} aria-hidden="true" />{result.error ? "Class catalogue unavailable" : `${classes.length} published ${classes.length === 1 ? "class" : "classes"}`}</span>
            <Link href="/contact" className="font-semibold text-[#315a48] hover:underline">Ask about a class →</Link>
          </div>
        </section>

        <div className="mt-4">
          {categoryResult.error ? <p role="alert" className="text-sm text-[#8a4c3c]">Categories could not be loaded. You can still browse all classes.</p> : <CategoryNavigation categories={categoryResult.data} type="CLASS" compact />}
        </div>

        {result.error ? <p role="alert" className="mt-8 rounded-2xl border border-[#eadbd4] bg-white p-6 text-sm text-[#8a4c3c]">{result.error}</p> : <ClassesDirectory items={classes} featuredItems={featuredClasses} />}

        {pages > 1 && <nav aria-label="Class pages" className="mt-8 flex items-center justify-center gap-5 text-sm"><>{page > 1 && <Link href={`/classes?page=${page - 1}`} className="font-semibold text-[#315a48] hover:underline">← Previous</Link>}</><span>Page {page} of {pages}</span>{page < pages && <Link href={`/classes?page=${page + 1}`} className="font-semibold text-[#315a48] hover:underline">Next →</Link>}</nav>}
      </div>
    </main>
  );
}
