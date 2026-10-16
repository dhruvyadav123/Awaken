
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
} from "lucide-react";

import { getPublicCategories } from "@/lib/category-data";
import { publicApi, validPage } from "@/lib/public-api";
import {
  BlogCards,
  CategoryLinks,
} from "@/components/blog/BlogCards";

export const metadata = {
  title: "Journal | Awaken With Me",
  description:
    "Thoughtful reflections about mindfulness, yoga and everyday wellbeing.",
};

export default async function JournalPage({
  searchParams,
}) {
  const query = await searchParams;
  const page = validPage(query?.page);

  const [blogs, categoryResult] = await Promise.all([
    publicApi("blogs", {
      page,
      limit: 20,
    }),
    getPublicCategories(),
  ]);

  const categories = Array.isArray(categoryResult.data)
    ? categoryResult.data
    : [];

  const posts = Array.isArray(blogs.data)
    ? blogs.data
    : Array.isArray(blogs.data?.items)
      ? blogs.data.items
      : [];

  const pages = Number(blogs.pagination?.pages) || 0;

  return (
    <main className="min-h-screen bg-white text-[#172B24]">
      {/* Journal hero */}
      <section className="relative isolate overflow-hidden bg-[#F7F8F3]">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-l from-[#D9E6D6] via-[#ECF2E8] to-[#F7F8F3]" />
          <div className="absolute -right-16 -top-28 h-[480px] w-[480px] rounded-full bg-[#C5DDC8]/50 blur-3xl" />
          <div className="absolute bottom-0 right-[24%] h-44 w-44 rounded-full bg-white/60 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-[330px] max-w-[1240px] items-center px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[370px]">
          <div className="relative z-10 max-w-[650px]">
            <p className="text-xs font-semibold uppercase tracking-[0.19em] text-[#135443]">
              Awaken Journal
            </p>

            <h1 className="mt-5 max-w-[650px] font-[Georgia,serif] text-[43px] leading-[1.09] tracking-[-0.04em] text-[#152A24] sm:text-[58px] lg:text-[68px]">
              A few thoughtful
              <span className="block">places to begin.</span>
            </h1>

            <p className="mt-6 max-w-[480px] text-[15px] leading-[1.85] text-[#5D6D63] sm:text-base">
              Short reflections for noticing, pausing, and
              making room in an ordinary day.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-8 hidden text-[160px] leading-none text-[#8CA994]/25 lg:block"
          >
            ✳
          </div>
        </div>
      </section>

      {/* Blog catalog */}
      <section className="mx-auto max-w-[1240px] px-5 pb-20 pt-9 sm:px-8 sm:pt-11">
        <CategoryLinks categories={categories} />

        {categoryResult.error && (
          <p role="alert" className="mt-5 text-sm text-[#A2604F]">
            Categories could not be loaded. You can still
            browse all articles.
          </p>
        )}

        <div className="mt-9">
          {blogs.error ? (
            <div
              role="alert"
              className="rounded-xl border border-[#F2DAD3] bg-[#FFF7F4] p-6 text-sm text-[#975B49]"
            >
              {blogs.error}
            </div>
          ) : posts.length ? (
            <BlogCards
              posts={posts}
              categories={categories}
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[20px] border border-[#E7EDE7] py-20 text-center">
              <BookOpenText
                size={32}
                strokeWidth={1.4}
                className="text-[#7FA38D]"
              />

              <h2 className="mt-5 font-[Georgia,serif] text-2xl">
                New reflections are on their way.
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#849088]">
                No articles have been published yet.
                Check back soon.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <nav
            aria-label="Journal pages"
            className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:gap-5"
          >
            {page > 1 ? (
              <Link
                href={`/blog?page=${page - 1}`}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#185441] transition hover:bg-[#F0F5F0]"
              >
                <ArrowLeft size={16} />
                Previous
              </Link>
            ) : (
              <span className="px-3 py-2 text-sm text-[#B0B9B1]">
                Previous
              </span>
            )}

            <div className="flex items-center gap-2">
              {Array.from(
                { length: pages },
                (_, index) => index + 1
              )
                .filter(
                  (number) =>
                    number === 1 ||
                    number === pages ||
                    Math.abs(number - page) <= 1
                )
                .map((number, index, visible) => (
                  <span
                    key={number}
                    className="inline-flex items-center gap-2"
                  >
                    {index > 0 &&
                      number - visible[index - 1] > 1 && (
                        <span className="px-1 text-[#93A097]">
                          …
                        </span>
                      )}

                    <Link
                      href={`/blog?page=${number}`}
                      aria-current={
                        number === page ? "page" : undefined
                      }
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                        number === page
                          ? "bg-[#104F43] text-white"
                          : "bg-[#F1F4F0] text-[#42564A] hover:bg-[#E0EAE1]"
                      }`}
                    >
                      {number}
                    </Link>
                  </span>
                ))}
            </div>

            {page < pages ? (
              <Link
                href={`/blog?page=${page + 1}`}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#185441] transition hover:bg-[#F0F5F0]"
              >
                Next
                <ArrowRight size={16} />
              </Link>
            ) : (
              <span className="px-3 py-2 text-sm text-[#B0B9B1]">
                Next
              </span>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
