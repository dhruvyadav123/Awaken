

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
} from "lucide-react";

import { publicApi } from "@/lib/public-api";
import { BlogCover, hasBlogImage } from "@/components/blog/BlogCards";

/* =========================================
   HELPERS
========================================= */

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatShortDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getReadingTime(post) {
  const explicit =
    post.readingTimeMinutes ??
    post.readTime ??
    post.readingTime;

  if (Number(explicit) > 0) {
    return Math.ceil(Number(explicit));
  }

  const content = String(
    post.content || post.body || ""
  ).trim();

  if (!content) return null;

  const words = content.split(/\s+/).length;

  return Math.max(1, Math.ceil(words / 200));
}

function getPostTags(post) {
  return Array.isArray(post.tags)
    ? post.tags
        .filter((tag) => typeof tag === "string")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    : [];
}

/* =========================================
   WIDE BLOG COVER
========================================= */

function BlogHero({ entry }) {
  if (!hasBlogImage(entry)) return null;
  return <BlogCover post={entry} className="h-[185px] w-full sm:h-[230px] md:h-[270px] lg:h-[300px] xl:h-[320px]" />;
}

/* =========================================
   ARTICLE BODY
========================================= */

function ArticleBody({ entry }) {
  const raw =
    typeof entry.content === "string"
      ? entry.content
      : typeof entry.body === "string"
        ? entry.body
        : "";

  const blocks = raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return (
      <p className="text-base leading-8 text-[#53655A]">
        {entry.excerpt || "Article content is not available."}
      </p>
    );
  }

  return (
    <div className="space-y-7">
      {blocks.map((block, index) => {
        const heading = block.match(/^(#{1,3})\s+(.+)$/);

        if (heading) {
          const isSmall = heading[1].length === 3;

          return (
            <h2
              key={index}
              className={`pt-3 font-[Georgia,serif] font-semibold leading-[1.3] tracking-[-0.025em] text-[#193229] ${
                isSmall
                  ? "text-[22px] sm:text-[25px]"
                  : "text-[26px] sm:text-[31px]"
              }`}
            >
              {heading[2]}
            </h2>
          );
        }

        const lines = block.split("\n");

        if (
          lines.every((line) =>
            /^[-*]\s+/.test(line.trim())
          )
        ) {
          return (
            <ul
              key={index}
              className="list-disc space-y-3 pl-6 font-[Georgia,serif] text-[17px] leading-[1.9] text-[#47594D]"
            >
              {lines.map((line, itemIndex) => (
                <li key={itemIndex}>
                  {line.replace(/^[-*]\s+/, "")}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={index}
            className="
              whitespace-pre-line
              font-[Georgia,serif]
              text-[17px]
              leading-[1.95]
              text-[#46574C]
              sm:text-[18px]
            "
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}

/* =========================================
   RELATED ARTICLES
========================================= */

function RelatedArticles({ posts }) {
  if (!posts.length) return null;

  return (
    <aside
      aria-labelledby="related-articles-heading"
      className="min-w-0"
    >
      <div className="mb-5 border-b border-[#E4EAE5] pb-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#668D75]">
          Continue exploring
        </span>

        <h2
          id="related-articles-heading"
          className="mt-2 font-[Georgia,serif] text-[26px] leading-tight text-[#193127]"
        >
          Related Articles
        </h2>
      </div>

      <div className="divide-y divide-[#E8EDE8]">
        {posts.map((post) => {
          const date = formatShortDate(
            post.publishedAt || post.createdAt
          );

          return (
            <Link
              key={post.id || post.slug}
              href={`/blog/${encodeURIComponent(post.slug)}`}
              className="group flex items-start gap-3.5 py-4 first:pt-0"
            >
              <BlogCover post={post} className="h-[86px] w-[106px] shrink-0" />

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-3 font-[Georgia,serif] text-[17px] leading-[1.35] text-[#253B2E] transition-colors group-hover:text-[#17694D]">
                  {post.title}
                </h3>

                {date && (
                  <p className="mt-2 text-[11px] text-[#839086]">
                    {date}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/blog"
        className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[#145341] transition hover:gap-3"
      >
        View all articles
        <ArrowRight size={15} />
      </Link>
    </aside>
  );
}

/* =========================================
   METADATA
========================================= */

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const result = await publicApi(
    `blogs/${encodeURIComponent(slug)}`
  );

  const entry = result.data;

  return {
    title: `${
      entry?.seoTitle || entry?.title || "Journal"
    } | Awaken With Me`,

    description:
      entry?.seoDescription ||
      entry?.excerpt ||
      "Explore mindful reflections from Awaken With Me.",
  };
}

/* =========================================
   MAIN BLOG DETAIL PAGE
========================================= */

export default async function JournalEntryPage({
  params,
}) {
  const { slug } = await params;

  const result = await publicApi(
    `blogs/${encodeURIComponent(slug)}`
  );

  if (result.status === 404) {
    notFound();
  }

  if (result.error || !result.data) {
    return (
      <main className="min-h-screen bg-white px-5 py-16">
        <div className="mx-auto max-w-[1200px]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#145341]"
          >
            <ArrowLeft size={16} />
            Back to journal
          </Link>

          <p
            role="alert"
            className="mt-8 border-l-2 border-[#C78068] bg-[#FFF6F2] p-5 text-sm text-[#995847]"
          >
            {result.error || "Unable to load article."}
          </p>
        </div>
      </main>
    );
  }

  const entry = result.data;

  const publishedAt =
    entry.publishedAt || entry.createdAt;

  const readTime = getReadingTime(entry);

  const tags = getPostTags(entry);

  /* Get real related articles */
  const relatedResult = await publicApi("blogs", {
    page: 1,
    limit: 20,
  });

  const allPosts = Array.isArray(relatedResult.data)
    ? relatedResult.data
    : Array.isArray(relatedResult.data?.items)
      ? relatedResult.data.items
      : [];

  const currentTitle = String(
    entry.title || ""
  ).trim().toLowerCase();

  const seenTitles = new Set();

  const filteredPosts = allPosts.filter((post) => {
    if (!post.slug || post.slug === slug) {
      return false;
    }

    if (
      String(post.id || post._id) ===
      String(entry.id || entry._id)
    ) {
      return false;
    }

    const title = String(
      post.title || ""
    ).trim().toLowerCase();

    if (!title || title === currentTitle) {
      return false;
    }

    if (seenTitles.has(title)) {
      return false;
    }

    seenTitles.add(title);

    return true;
  });

  function relevanceScore(post) {
    let score = 0;

    if (
      entry.categoryId &&
      String(post.categoryId) ===
        String(entry.categoryId)
    ) {
      score += 10;
    }

    const postTags = getPostTags(post);

    for (const tag of postTags) {
      if (tags.includes(tag)) {
        score += 3;
      }
    }

    return score;
  }

  const relatedPosts = filteredPosts
    .sort((a, b) => {
      const scoreDifference =
        relevanceScore(b) - relevanceScore(a);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const dateA = new Date(
        a.publishedAt || 0
      ).getTime();

      const dateB = new Date(
        b.publishedAt || 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-white text-[#1B3026]">
      <article className="mx-auto max-w-[1240px] px-5 pb-20 pt-6 sm:px-8 lg:pt-8">
        {/* Back navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#15513F] transition hover:gap-3"
          >
            <ArrowLeft size={16} />
            Back to journal
          </Link>
        </nav>

        {/* Compact wide banner */}
        <BlogHero entry={entry} />

        {/* Article header */}
        <header className="mx-auto mt-7 max-w-[1120px] border-b border-[#E7ECE7] pb-8 sm:mt-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#2F7956]">
              Awaken Journal
            </span>

            {publishedAt && (
              <>
                <span className="h-1 w-1 rounded-full bg-[#9FB5A3]" />

                <time
                  dateTime={publishedAt}
                  className="text-[12px] text-[#7B8B7F]"
                >
                  {formatDate(publishedAt)}
                </time>
              </>
            )}
          </div>

          <h1
            className="
              mt-3
              max-w-[1000px]
              font-[Georgia,serif]
              text-[33px]
              leading-[1.17]
              tracking-[-0.035em]
              text-[#142A20]
              sm:text-[45px]
              lg:text-[52px]
            "
          >
            {entry.title || "Journal article"}
          </h1>

          {entry.excerpt && (
            <p className="mt-4 max-w-[850px] text-[15px] leading-[1.8] text-[#69796E] sm:text-[17px]">
              {entry.excerpt}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] text-[#829086]">
            {readTime && (
              <span className="inline-flex items-center gap-2">
                <Clock3 size={15} />
                {readTime} min read
              </span>
            )}

            {tags.length > 0 && (
              <span className="capitalize">
                {tags.slice(0, 3).join(" · ")}
              </span>
            )}
          </div>
        </header>

        {/* Content layout */}
        <div
          className="
            mx-auto
            mt-10
            grid
            max-w-[1120px]
            items-start
            gap-12
            lg:grid-cols-[minmax(0,1fr)_300px]
            lg:gap-16
            xl:gap-20
          "
        >
          {/* Main article content */}
          <div className="min-w-0">
            <ArticleBody entry={entry} />

            <div className="mt-14 border-t border-[#E7ECE7] pt-7">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#165642] transition hover:gap-3"
              >
                <ArrowLeft size={17} />
                Browse more articles
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          {relatedPosts.length > 0 && (
            <div className="min-w-0 lg:sticky lg:top-24">
              <RelatedArticles posts={relatedPosts} />
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
