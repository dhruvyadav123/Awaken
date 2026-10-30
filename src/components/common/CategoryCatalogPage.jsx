import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCategories } from "@/lib/category-data";
import { allPublicItems, validPage } from "@/lib/public-api";
import { categoriesForType, categoryCatalogs, matchesCategory } from "@/lib/public-categories";
import CategoryNavigation from "./CategoryNavigation";
import CatalogGrid from "./CatalogGrid";
import { BlogCards } from "@/components/website/blog/BlogCards";
import ProductCatalogPage from "@/components/website/shop/ProductCatalogPage";
import MeditationLibrary from "@/components/website/meditations/MeditationLibrary";
import MeditationCategoryCircles from "@/components/website/meditations/MeditationCategoryCircles";
import { meditationRequiresMembership } from "@/lib/meditation-display";

export async function categoryMetadata(params, type) {
  const { slug } = await params;
  const result = await getPublicCategories();
  const category = categoriesForType(result.data, type).find((item) => item.slug === slug);
  return { title: `${category?.name || "Category"} | ${categoryCatalogs[type].label} | AwakenWithMeheck`, description: category?.description || undefined };
}

export default async function CategoryCatalogPage({ params, searchParams, type }) {
  const { slug } = await params;
  const query = await searchParams;
  const page = validPage(query?.page);
  const taxonomy = await getPublicCategories();
  const catalog = categoryCatalogs[type];
  const category = categoriesForType(taxonomy.data, type).find((item) => item.slug === slug);
  if (!taxonomy.error && !category) notFound();
  const result = category
    ? await allPublicItems(
        catalog.collection,
        type === "PRODUCT" ? { cache: "no-store" } : {}
      )
    : { data: [], error: null };
  const allItems = category && Array.isArray(result.data) ? result.data : [];
  const items = allItems.filter((item) => matchesCategory(item, category));
  const premiumCount = type === "MEDITATION" ? allItems.filter(meditationRequiresMembership).length : 0;
  const pages = Math.ceil(items.length / 20);
  if (!taxonomy.error && !result.error && page > Math.max(1, pages)) notFound();
  const shown = items.slice((page - 1) * 20, page * 20);
  const error = taxonomy.error || result.error;
  const filters = type === "MEDITATION"
    ? <MeditationCategoryCircles categories={taxonomy.data} items={allItems} activeSlug={slug} />
    : <CategoryNavigation categories={taxonomy.data} type={type} activeSlug={slug} items={type === "PRODUCT" ? allItems : undefined} />;
  const pagination = pages > 1 ? <nav aria-label={`${catalog.label} pages`} className={`flex flex-wrap items-center gap-5 text-sm text-[#315a48] ${type === "MEDITATION" ? "mt-6" : "mt-8"}`}>
    {page > 1 && <Link prefetch={false} href={`${catalog.path}/category/${encodeURIComponent(slug)}?page=${page - 1}`}>Previous</Link>}
    <span>Page {page} of {pages}</span>
    {page < pages && <Link prefetch={false} href={`${catalog.path}/category/${encodeURIComponent(slug)}?page=${page + 1}`}>Next</Link>}
  </nav> : null;
  if (type === "PRODUCT") return <ProductCatalogPage products={shown} error={error} title={category?.name || "Shop category"} description={category?.description} filters={filters} pagination={pagination} />;
  return <section className={`bg-white px-4 text-[#29473c] sm:px-6 ${type === "MEDITATION" || type === "COURSE" ? "py-7 sm:py-9" : "py-12 sm:py-16"}`}><div className={`mx-auto w-full ${type === "MEDITATION" || type === "COURSE" ? "max-w-[1400px]" : "max-w-6xl"}`}>
    <Link href={catalog.path} prefetch={false} className="text-sm text-[#315a48] hover:underline">All {catalog.label.toLowerCase()}</Link>
    <h1 className={`${type === "MEDITATION" || type === "COURSE" ? "mt-2" : "mt-5"} break-words font-[Georgia,serif] text-4xl sm:text-5xl`}>{category?.name || `${catalog.label} category`}</h1>
    {category?.description && <p className={`${type === "MEDITATION" ? "mt-3" : "mt-4"} max-w-2xl text-base leading-8 text-[#647368]`}>{category.description}</p>}
    <div className={type === "MEDITATION" || type === "COURSE" ? "mt-4" : "mt-6"}>{filters}</div>
    {premiumCount > 0 && <section className="mx-auto mt-5 flex w-full max-w-md flex-col items-center rounded-2xl border border-[#dedcff] bg-[#fbfbff] px-5 py-4 text-center shadow-[0_6px_18px_rgba(91,87,192,0.06)]" aria-labelledby="premium-meditations-title"><h2 id="premium-meditations-title" className="font-[Georgia,serif] text-lg font-semibold text-[#292957]">Unlock premium meditations</h2><p className="mt-1 text-xs leading-5 text-[#77769a]">Become a member to access {premiumCount} premium {premiumCount === 1 ? "practice" : "practices"}.</p><Link href="/infinity/membership" className="mt-3 inline-flex min-h-9 items-center justify-center rounded-full bg-[#514bd1] px-5 text-xs font-semibold text-white shadow-[0_5px_12px_rgba(81,75,209,0.22)] transition hover:bg-[#3f3ab6]">Join membership</Link></section>}
    <div className={type === "MEDITATION" || type === "COURSE" ? "mt-6" : "mt-8"}>{error ? <p role="alert" className="text-sm text-[#8a4c3c]">{error}</p> : shown.length ? type === "BLOG" ? <BlogCards posts={shown} categories={taxonomy.data} /> : type === "MEDITATION" ? <MeditationLibrary items={shown} basePath={catalog.path} circleLayout /> : <CatalogGrid items={shown} basePath={catalog.path} variant={type === "COURSE" ? "course" : ""} /> : <p className="text-sm leading-7 text-[#647368]">No {catalog.label === "Shop" ? "products" : catalog.label.toLowerCase()} are published in this category yet.</p>}</div>
    {pagination}
  </div></section>;
}
