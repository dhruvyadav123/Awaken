import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText } from "lucide-react";

import { getPublicCategories } from "@/lib/category-data";
import { allPublicItems, publicApi, validPage } from "@/lib/public-api";
import { BlogCards } from "@/components/website/blog/BlogCards";
import BlogSidebar from "@/components/website/blog/BlogSidebar";

export const metadata = {
  title: "Journal | AwakenWithMeheck",
  description: "Thoughtful reflections about mindfulness, yoga and everyday wellbeing.",
};

function Pagination({ page, pages, query = "" }) {
  if (pages <= 1) return null;
  const suffix = query ? `&q=${encodeURIComponent(query)}` : "";
  const visible = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === pages || Math.abs(number - page) <= 1
  );

  return (
    <nav aria-label="Journal pages" className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
      {page > 1 ? (
        <Link href={`/blog?page=${page - 1}${suffix}`} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#4E4AE0] hover:bg-[#F0F0FF]">
          <ArrowLeft size={16} /> Previous
        </Link>
      ) : <span className="px-3 py-2 text-sm text-[#B8B8C4]">Previous</span>}

      <div className="flex items-center gap-2">
        {visible.map((number, index) => (
          <span key={number} className="inline-flex items-center gap-2">
            {index > 0 && number - visible[index - 1] > 1 && <span className="px-1 text-[#A2A2B3]">…</span>}
            <Link href={`/blog?page=${number}${suffix}`} aria-current={number === page ? "page" : undefined} className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${number === page ? "bg-[#5854E8] text-white" : "bg-[#F1F1F6] text-[#5F617B] hover:bg-[#E5E4FF]"}`}>
              {number}
            </Link>
          </span>
        ))}
      </div>

      {page < pages ? (
        <Link href={`/blog?page=${page + 1}${suffix}`} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#4E4AE0] hover:bg-[#F0F0FF]">
          Next <ArrowRight size={16} />
        </Link>
      ) : <span className="px-3 py-2 text-sm text-[#B8B8C4]">Next</span>}
    </nav>
  );
}

export default async function JournalPage({ searchParams }) {
  const query = await searchParams;
  const page = validPage(query?.page);
  const searchQuery = typeof query?.q === "string" ? query.q.trim() : "";

  const [blogResult, categoryResult] = await Promise.all([
    searchQuery ? allPublicItems("blogs") : publicApi("blogs", { page, limit: 20 }),
    getPublicCategories(),
  ]);

  const sourcePosts = Array.isArray(blogResult.data)
    ? blogResult.data
    : Array.isArray(blogResult.data?.items)
      ? blogResult.data.items
      : [];
  const normalizedQuery = searchQuery.toLowerCase();
  const matchingPosts = searchQuery
    ? sourcePosts.filter((post) => [post.title, post.excerpt, post.description, post.content].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery))
    : sourcePosts;
  const posts = searchQuery ? matchingPosts.slice((page - 1) * 20, page * 20) : matchingPosts;
  const pages = searchQuery ? Math.max(1, Math.ceil(matchingPosts.length / 20)) : Number(blogResult.pagination?.pages) || 0;
  const categories = Array.isArray(categoryResult.data) ? categoryResult.data : [];
  const sidebarPosts = searchQuery ? sourcePosts : posts;

  return (
    <main className="min-h-screen bg-white text-[#20233E]">
      <div className="mx-auto grid max-w-[1240px] items-start gap-8 px-5 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
        <section className="min-w-0" aria-labelledby="journal-list-heading">
          <div className="mb-7 flex flex-col gap-4 border-b border-[#E7E7ED] pb-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="journal-list-heading" className="mt-2 font-[Georgia,serif] text-3xl tracking-[-0.04em] text-[#171735]">{searchQuery ? `Results for “${searchQuery}”` : "Latest posts"}</h2>
              </div>
              {!blogResult.error && <span className="text-xs text-[#85869B]">{searchQuery ? matchingPosts.length : blogResult.pagination?.total || posts.length} articles</span>}
            </div>
            {categoryResult.error && <p role="alert" className="text-sm text-[#A2604F]">Categories could not be loaded. You can still browse all articles.</p>}
          </div>

          {blogResult.error ? (
            <div role="alert" className="rounded-2xl border border-[#F2DAD3] bg-[#FFF7F4] p-6 text-sm text-[#975B49]">{blogResult.error}</div>
          ) : posts.length ? (
            <BlogCards posts={posts} categories={categories} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E5E5EC] bg-[#FAFAFC] px-6 py-20 text-center">
              <BookOpenText size={34} strokeWidth={1.35} className="text-[#7773EA]" />
              <h2 className="mt-5 font-[Georgia,serif] text-2xl text-[#171735]">No articles found.</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#7D7F92]">Try another search or browse one of the journal categories.</p>
              {searchQuery && <Link href="/blog" className="mt-5 text-sm font-semibold text-[#4E4AE0] hover:underline">Clear search</Link>}
            </div>
          )}

          <Pagination page={page} pages={pages} query={searchQuery} />
        </section>

        <BlogSidebar categories={categories} posts={sidebarPosts} searchQuery={searchQuery} />
      </div>
    </main>
  );
}
