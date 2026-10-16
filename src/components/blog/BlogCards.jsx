
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ImageIcon,
} from "lucide-react";

import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { recordMedia } from "@/lib/record-display";

export function hasBlogImage(post) {
  return recordMedia(post, { imagesOnly: true }).some(asset => asset.source);
}

export function BlogCover({
  post,
  className = "",
  categoryName = "",
  showCategory = false,
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#EBF1E9] ${className}`}
    >
      {hasBlogImage(post) ? (
        <div className="blog-cover-media h-full w-full">
          <RecordMedia
            record={post}
            imagesOnly
            compact
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F0F5EF] to-[#DCE9DD]">
          <ImageIcon
            size={35}
            strokeWidth={1.1}
            className="text-[#89A994]"
          />
        </div>
      )}

      {showCategory && categoryName && (
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#18513F]">
          {categoryName}
        </span>
      )}
    </div>
  );
}

export function blogCategory(post, categories = []) {
  return (
    categories.find(
      (item) =>
        String(item.id || item._id) ===
        String(post.categoryId)
    ) || null
  );
}

export function formatBlogDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function readingMinutes(post) {
  const explicit =
    post.readingTimeMinutes ??
    post.readingTime ??
    post.readTime;

  if (Number(explicit) > 0) {
    return Math.ceil(Number(explicit));
  }

  if (!post.content) return null;

  const words = String(post.content)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
}

export function CategoryLinks({
  categories = [],
  activeSlug = "",
}) {
  return (
    <nav
      aria-label="Journal categories"
      className="flex flex-wrap gap-2"
    >
      <Link
        href="/blog"
        className={`rounded-full px-5 py-2.5 text-sm ${
          !activeSlug
            ? "bg-[#104F43] text-white"
            : "border border-[#E5EBE5] text-[#344B3F]"
        }`}
      >
        All
      </Link>

      {categories
        .filter((category) => category.slug && category.name)
        .map((category) => (
          <Link
            key={category.id || category.slug}
            href={`/blog/category/${encodeURIComponent(
              category.slug
            )}`}
            className={`rounded-full px-5 py-2.5 text-sm transition hover:border-[#A6C5B0] ${
              activeSlug === category.slug
                ? "bg-[#104F43] text-white"
                : "border border-[#E5EBE5] text-[#344B3F]"
            }`}
          >
            {category.name}
          </Link>
        ))}
    </nav>
  );
}

export function BlogCards({
  posts = [],
  categories = [],
}) {
  if (!posts.length) {
    return (
      <p className="py-12 text-center text-[#7B8A7D]">
        No articles published yet.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const category = blogCategory(post, categories);
        const date = formatBlogDate(
          post.publishedAt || post.createdAt
        );
        const readTime = readingMinutes(post);

        const href = post.slug
          ? `/blog/${encodeURIComponent(post.slug)}`
          : null;

        const cover = (
          <BlogCover
            post={post}
            categoryName={category?.name || ""}
            showCategory
            className="h-[225px] w-full"
          />
        );

        return (
          <article
            key={post.id || post._id || post.slug}
            className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-[#E8EEE8] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(10,54,40,0.07)]"
          >
            {href ? (
              <Link
                href={href}
                aria-label={`Read ${post.title}`}
                className="block"
              >
                {cover}
              </Link>
            ) : (
              cover
            )}

            <div className="flex flex-1 flex-col p-5">
              <h2 className="font-[Georgia,serif] text-[24px] leading-[1.25] text-[#182D25]">
                {href ? (
                  <Link
                    href={href}
                    className="hover:text-[#176249]"
                  >
                    {post.title}
                  </Link>
                ) : (
                  post.title
                )}
              </h2>

              {(post.excerpt || post.description) && (
                <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-[#748077]">
                  {post.excerpt || post.description}
                </p>
              )}

              <div className="mt-auto pt-6">
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#79877B]">
                  {date && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      {date}
                    </span>
                  )}

                  {readTime && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={13} />
                      {readTime} min read
                    </span>
                  )}
                </div>

                {href && (
                  <Link
                    href={href}
                    className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#14523F] hover:gap-3"
                  >
                    Read more
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
