/* eslint-disable @next/next/no-img-element -- Category artwork can come from the public media API and must not forward cookies through an image optimizer. */
import Link from "next/link";
import { categoriesForType, matchesCategory } from "@/lib/public-categories";
import { recordMedia } from "@/lib/record-display";

function categoryTitle(category) {
  return category.name || category.title || "Meditation";
}

function initials(value) {
  return String(value || "M").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function CategoryArtwork({ category, glyph = false }) {
  const image = category && recordMedia(category, { scope: "public", imagesOnly: true })[0]?.source;
  const title = category ? categoryTitle(category) : "All meditations";
  return <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#dddafa] bg-[radial-gradient(circle_at_35%_25%,#fff,#f0efff_62%,#e2e0fb)] text-[#5b57c0] shadow-[0_3px_10px_rgba(91,87,192,0.08)]">
    {image ? <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <span className="font-[Georgia,serif] text-sm font-semibold tracking-wide">{glyph ? "✦" : initials(title)}</span>}
  </span>;
}

function CategoryLink({ href, title, count, active, category, glyph = false }) {
  return <Link href={href} prefetch={false} aria-current={active ? "page" : undefined} className={`group flex min-h-14 w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-[#aaa6e8] hover:bg-white hover:shadow-[0_6px_15px_rgba(91,87,192,0.08)] ${active ? "border-[#716ddd] bg-white shadow-[0_0_0_2px_#e6e4ff]" : "border-[#e4e2f5] bg-[#fbfbff]/80"}`}>
    <CategoryArtwork category={category} glyph={glyph} />
    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#292957] group-hover:text-[#514bd1]">{title}</span>{count > 0 && <span className="mt-0.5 block text-[10px] text-[#8582a8]">{count} {count === 1 ? "practice" : "practices"}</span>}</span>
  </Link>;
}

export default function MeditationCategoryCircles({ categories = [], items = [], activeSlug = "" }) {
  const entries = categoriesForType(categories, "MEDITATION");
  if (!entries.length) return null;

  return <section aria-labelledby="meditation-categories-title" className="mt-6 rounded-2xl border border-[#e5e3f5] bg-white/75 p-4 shadow-[0_6px_18px_rgba(91,87,192,0.035)] sm:p-5">
    <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 id="meditation-categories-title" className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d5f96]">Browse by category</h2><p className="mt-1 text-xs text-[#8582a8]">Choose a theme for your next practice.</p></div><span className="text-[10px] text-[#8582a8]">{entries.length + 1} categories</span></div>
    <nav aria-label="Meditation categories" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <CategoryLink href="/meditations" title="All meditations" count={items.length} active={!activeSlug} glyph />
      {entries.map((category) => {
        const title = categoryTitle(category);
        const count = items.filter((item) => matchesCategory(item, category)).length;
        return <CategoryLink key={category.id} href={`/meditations/category/${encodeURIComponent(category.slug)}`} title={title} count={count} active={activeSlug === category.slug} category={category} />;
      })}
    </nav>
  </section>;
}
