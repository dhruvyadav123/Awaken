import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";

import { getPublicCategories } from "@/lib/category-data";
import { publicApi } from "@/lib/public-api";
import { BlogCover, hasBlogImage } from "@/components/website/blog/BlogCards";
import BlogSidebar from "@/components/website/blog/BlogSidebar";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(date);
}

function getReadingTime(post) {
  const explicit = post.readingTimeMinutes ?? post.readTime ?? post.readingTime;
  if (Number(explicit) > 0) return Math.ceil(Number(explicit));
  const content = String(post.content || post.body || "").trim();
  return content ? Math.max(1, Math.ceil(content.split(/\s+/).length / 200)) : null;
}

function getPostTags(post) {
  return Array.isArray(post.tags) ? post.tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim().toLowerCase()).filter(Boolean) : [];
}

function BlogHero({ entry }) {
  if (!hasBlogImage(entry)) return null;
  return <BlogCover post={entry} className="blog-detail-cover h-[245px] w-full sm:h-[330px] md:h-[400px] lg:h-[480px]" />;
}

function ArticleBody({ entry }) {
  const raw = typeof entry.content === "string" ? entry.content : typeof entry.body === "string" ? entry.body : "";
  const blocks = raw.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);

  if (!blocks.length) return <p className="text-base leading-8 text-[#5F6279]">{entry.excerpt || "Article content is not available."}</p>;

  return (
    <div className="space-y-7">
      {blocks.map((block, index) => {
        const heading = block.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          return <h2 key={index} className={`pt-3 font-[Georgia,serif] font-semibold leading-[1.3] tracking-[-0.025em] text-[#20233E] ${heading[1].length === 3 ? "text-[22px] sm:text-[25px]" : "text-[26px] sm:text-[31px]"}`}>{heading[2]}</h2>;
        }

        const lines = block.split("\n");
        if (lines.every((line) => /^[-*]\s+/.test(line.trim()))) {
          return <ul key={index} className="list-disc space-y-3 pl-6 font-[Georgia,serif] text-[17px] leading-[1.9] text-[#555870]">{lines.map((line, itemIndex) => <li key={itemIndex}>{line.replace(/^[-*]\s+/, "")}</li>)}</ul>;
        }

        return <p key={index} className="whitespace-pre-line font-[Georgia,serif] text-[17px] leading-[1.95] text-[#555870] sm:text-[18px]">{block}</p>;
      })}
    </div>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await publicApi(`blogs/${encodeURIComponent(slug)}`);
  const entry = result.data;
  return {
    title: `${entry?.seoTitle || entry?.title || "Journal"} | AwakenWithMeheck`,
    description: entry?.seoDescription || entry?.excerpt || "Explore mindful reflections from AwakenWithMeheck.",
  };
}

export default async function JournalEntryPage({ params }) {
  const { slug } = await params;
  const result = await publicApi(`blogs/${encodeURIComponent(slug)}`);
  if (result.status === 404) notFound();

  if (result.error || !result.data) {
    return <main className="min-h-screen bg-white px-5 py-16"><div className="mx-auto max-w-[1200px]"><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E4AE0]"><ArrowLeft size={16} />Back to journal</Link><p role="alert" className="mt-8 border-l-2 border-[#C78068] bg-[#FFF6F2] p-5 text-sm text-[#995847]">{result.error || "Unable to load article."}</p></div></main>;
  }

  const entry = result.data;
  const publishedAt = entry.publishedAt || entry.createdAt;
  const readTime = getReadingTime(entry);
  const tags = getPostTags(entry);
  const [relatedResult, categoryResult] = await Promise.all([
    publicApi("blogs", { page: 1, limit: 20 }),
    getPublicCategories(),
  ]);
  const allPosts = Array.isArray(relatedResult.data) ? relatedResult.data : Array.isArray(relatedResult.data?.items) ? relatedResult.data.items : [];
  const currentTitle = String(entry.title || "").trim().toLowerCase();
  const relatedPosts = allPosts.filter((post) => post.slug && post.slug !== slug && String(post.id || post._id) !== String(entry.id || entry._id) && String(post.title || "").trim().toLowerCase() !== currentTitle).slice(0, 4);
  const categories = Array.isArray(categoryResult.data) ? categoryResult.data : [];

  return (
    <main className="min-h-screen bg-white text-[#20233E]">
      <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-5 sm:px-8 sm:pt-8">
        <nav aria-label="Breadcrumb" className="mb-5">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#4E4AE0] transition hover:gap-3"><ArrowLeft size={16} />Back to journal</Link>
        </nav>

        <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
          <article className="min-w-0">
            <BlogHero entry={entry} />

            <header className="mt-7 border-b border-[#E7E7ED] pb-7">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5854E8]">
                {publishedAt && <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>}
              </div>
              <h1 className="mt-4 max-w-[900px] font-[Georgia,serif] text-[clamp(34px,5vw,58px)] leading-[1.08] tracking-[-0.05em] text-[#171735]">{entry.title || "Journal article"}</h1>
              {entry.excerpt && <p className="mt-5 max-w-[820px] text-[15px] leading-7 text-[#72758A] sm:text-[17px]">{entry.excerpt}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] text-[#85869B]">
                {readTime && <span className="inline-flex items-center gap-2"><Clock3 size={15} />{readTime} min read</span>}
                {tags.length > 0 && <span className="capitalize">{tags.slice(0, 3).join(" · ")}</span>}
              </div>
            </header>

            <div className="mt-9 max-w-[780px]">
              <ArticleBody entry={entry} />
              <div className="mt-14 border-t border-[#E7E7ED] pt-7"><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E4AE0] transition hover:gap-3"><ArrowLeft size={17} />Browse more articles</Link></div>
            </div>
          </article>

          <BlogSidebar categories={categories} posts={[entry, ...relatedPosts]} />
        </div>
      </div>
    </main>
  );
}
