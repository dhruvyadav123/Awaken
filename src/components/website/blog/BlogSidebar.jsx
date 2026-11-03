import Link from "next/link";
import { CalendarDays, ChevronRight, Search } from "lucide-react";

import { categoriesForType } from "@/lib/public-categories";
import { BlogCover, formatBlogDate } from "./BlogCards";

export default function BlogSidebar({ categories = [], posts = [], searchQuery = "" }) {
  const blogCategories = categoriesForType(categories, "BLOG");
  const latestPosts = posts.filter((post) => post?.slug).slice(0, 4);

  return (
    <aside className="space-y-5 lg:sticky lg:top-6" aria-label="Blog sidebar">
      <form action="/blog" method="get" className="rounded-[14px] bg-[#F6F6F8] p-3">
        <label htmlFor="blog-search" className="sr-only">Search the blog</label>
        <div className="flex min-h-11 items-center gap-2 rounded-[10px] border border-transparent bg-white px-3.5 py-2 transition focus-within:border-[#7773EA] focus-within:ring-2 focus-within:ring-[#7773EA]/15">
          <input
            id="blog-search"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search here"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#30314E] outline-none placeholder:text-[#9392A4]"
          />
          <button type="submit" aria-label="Search" className="text-[#5753E9] transition hover:text-[#3431B6]">
            <Search size={18} strokeWidth={1.9} />
          </button>
        </div>
      </form>

      <section className="rounded-[16px] bg-[#F6F6F8] p-6" aria-labelledby="blog-categories-heading">
        <h2 id="blog-categories-heading" className="font-[Georgia,serif] text-[21px] font-semibold text-[#171735]">Categories</h2>
        <ul className="mt-4 space-y-1">
          {blogCategories.length ? blogCategories.map((category) => (
            <li key={category.id || category.slug}>
              <Link href={`/blog/category/${encodeURIComponent(category.slug)}`} className="group flex items-center gap-2 rounded-lg px-1 py-2 text-sm text-[#68708B] transition hover:bg-white hover:text-[#4E4AE0]">
                <ChevronRight size={16} className="text-[#5753E9] transition-transform group-hover:translate-x-0.5" />
                {category.name}
              </Link>
            </li>
          )) : <li className="text-sm text-[#8A8A9B]">No categories available.</li>}
        </ul>
      </section>

      <section className="rounded-[16px] bg-[#F6F6F8] p-6" aria-labelledby="latest-posts-heading">
        <h2 id="latest-posts-heading" className="font-[Georgia,serif] text-[21px] font-semibold text-[#171735]">Latest posts</h2>
        <div className="mt-4 divide-y divide-[#E4E4EA]">
          {latestPosts.length ? latestPosts.map((post) => {
            const date = formatBlogDate(post.publishedAt || post.createdAt);
            return (
              <Link key={post.id || post.slug} href={`/blog/${encodeURIComponent(post.slug)}`} className="group flex gap-3 py-3 first:pt-0 last:pb-0">
                <BlogCover post={post} className="h-[62px] w-[72px] shrink-0 rounded-lg" />
                <span className="min-w-0">
                  {date && <span className="flex items-center gap-1 text-[10px] text-[#7B7D9A]"><CalendarDays size={12} />{date}</span>}
                  <span className="mt-1 block line-clamp-2 text-[13px] font-semibold leading-5 text-[#25264B] transition group-hover:text-[#4E4AE0]">{post.title}</span>
                </span>
              </Link>
            );
          }) : <p className="text-sm text-[#8A8A9B]">No published posts yet.</p>}
        </div>
      </section>
    </aside>
  );
}
