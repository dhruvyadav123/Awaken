import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCategories } from "@/lib/category-data";
import { allPublicItems, validPage } from "@/lib/public-api";
import { categoriesForType, categoryCatalogs, matchesCategory } from "@/lib/public-categories";
import CategoryNavigation from "./CategoryNavigation";
import CatalogGrid from "./CatalogGrid";
import { BlogCards } from "../blog/BlogCards";
import ProductCatalogPage from "../shop/ProductCatalogPage";

export async function categoryMetadata(params, type) {
  const { slug } = await params;
  const result = await getPublicCategories();
  const category = categoriesForType(result.data, type).find((item) => item.slug === slug);
  return { title: `${category?.name || "Category"} | ${categoryCatalogs[type].label} | Awaken With Me`, description: category?.description || undefined };
}

export default async function CategoryCatalogPage({ params, searchParams, type }) {
  const { slug } = await params;
  const query = await searchParams;
  const page = validPage(query?.page);
  const taxonomy = await getPublicCategories();
  const catalog = categoryCatalogs[type];
  const category = categoriesForType(taxonomy.data, type).find((item) => item.slug === slug);
  if (!taxonomy.error && !category) notFound();
  const result = category ? await allPublicItems(catalog.collection) : { data: [], error: null };
  const items = category && Array.isArray(result.data) ? result.data.filter((item) => matchesCategory(item, category)) : [];
  const pages = Math.ceil(items.length / 20);
  if (!taxonomy.error && !result.error && page > Math.max(1, pages)) notFound();
  const shown = items.slice((page - 1) * 20, page * 20);
  const error = taxonomy.error || result.error;
  const filters = <CategoryNavigation categories={taxonomy.data} type={type} activeSlug={slug} />;
  const pagination = pages > 1 ? <nav aria-label={`${catalog.label} pages`} className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[#315a48]">
    {page > 1 && <Link prefetch={false} href={`${catalog.path}/category/${encodeURIComponent(slug)}?page=${page - 1}`}>Previous</Link>}
    <span>Page {page} of {pages}</span>
    {page < pages && <Link prefetch={false} href={`${catalog.path}/category/${encodeURIComponent(slug)}?page=${page + 1}`}>Next</Link>}
  </nav> : null;
  if (type === "PRODUCT") return <ProductCatalogPage products={shown} error={error} title={category?.name || "Shop category"} description={category?.description} filters={filters} pagination={pagination} />;
  return <section className="bg-white px-5 py-12 text-[#29473c] sm:px-8 sm:py-16"><div className="mx-auto max-w-6xl">
    <Link href={catalog.path} prefetch={false} className="text-sm text-[#315a48] hover:underline">All {catalog.label.toLowerCase()}</Link>
    <h1 className="mt-5 break-words font-[Georgia,serif] text-4xl sm:text-5xl">{category?.name || `${catalog.label} category`}</h1>
    {category?.description && <p className="mt-4 max-w-2xl text-base leading-8 text-[#647368]">{category.description}</p>}
    <div className="mt-6">{filters}</div>
    <div className="mt-8">{error ? <p role="alert" className="text-sm text-[#8a4c3c]">{error}</p> : shown.length ? type === "BLOG" ? <BlogCards posts={shown} categories={taxonomy.data} /> : <CatalogGrid items={shown} basePath={catalog.path} /> : <p className="text-sm leading-7 text-[#647368]">No {catalog.label === "Shop" ? "products" : catalog.label.toLowerCase()} are published in this category yet.</p>}</div>
    {pagination}
  </div></section>;
}
