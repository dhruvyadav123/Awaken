
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getPublicCategories } from "@/lib/category-data";
import {
  allPublicItems,
  validPage,
} from "@/lib/public-api";

import {
  BlogCards,
  CategoryLinks,
} from "@/components/blog/BlogCards";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const result = await getPublicCategories();
  const categories = Array.isArray(result.data)
    ? result.data
    : [];

  const category = categories.find(
    (item) => item.slug === slug
  );

  return {
    title: `${category?.name || "Journal category"} | Awaken With Me`,
    description:
      category?.description ||
      "Explore thoughtful articles from Awaken With Me.",
  };
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}) {
  const [{ slug }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  const page = validPage(query?.page);
  const pageSize = 20;

  const [categoryResult, blogResult] = await Promise.all([
    getPublicCategories(),
    allPublicItems("blogs"),
  ]);

  const categories = Array.isArray(categoryResult.data)
    ? categoryResult.data
    : [];

  const category = categories.find(
    (item) => item.slug === slug
  );

  if (!category && !categoryResult.error) notFound();

  const posts = Array.isArray(blogResult.data)
    ? blogResult.data
    : [];

  const filtered = category
    ? posts.filter(
        (post) =>
          String(post.categoryId) ===
          String(category.id || category._id)
      )
    : [];

  const totalPages = Math.ceil(
    filtered.length / pageSize
  );

  const currentPosts = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <main className="min-h-screen bg-white text-[#172B24]">
      <section className="bg-gradient-to-r from-[#F5F8F2] via-[#F2F6EF] to-[#E0ECE0]">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#205B47]"
          >
            <ArrowLeft size={15} />
            Back to journal
          </Link>

          <p className="mt-9 text-xs font-semibold uppercase tracking-[0.18em] text-[#42715B]">
            Journal category
          </p>

          <h1 className="mt-4 font-[Georgia,serif] text-[45px] leading-tight tracking-[-0.035em] sm:text-[62px]">
            {category?.name || "Journal"}
          </h1>

          {category?.description && (
            <p className="mt-4 max-w-[560px] text-[15px] leading-7 text-[#65776A]">
              {category.description}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-20 pt-10 sm:px-8">
        <CategoryLinks
          categories={categories}
          activeSlug={slug}
        />

        {categoryResult.error || blogResult.error ? (
          <p
            role="alert"
            className="mt-9 rounded-xl bg-[#FFF6F2] p-5 text-sm text-[#9A5F4C]"
          >
            {categoryResult.error || blogResult.error}
          </p>
        ) : (
          <div className="mt-10">
            <BlogCards
              posts={currentPosts}
              categories={categories}
            />
          </div>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Category pages"
            className="mt-12 flex items-center justify-center gap-5 text-sm"
          >
            {page > 1 && (
              <Link
                href={`/blog/category/${encodeURIComponent(slug)}?page=${page - 1}`}
                className="font-semibold text-[#145341]"
              >
                ← Previous
              </Link>
            )}

            <span className="text-[#7F8C82]">
              Page {page} of {totalPages}
            </span>

            {page < totalPages && (
              <Link
                href={`/blog/category/${encodeURIComponent(slug)}?page=${page + 1}`}
                className="font-semibold text-[#145341]"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
