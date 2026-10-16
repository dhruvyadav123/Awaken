import ContentPage from "../../components/common/ContentPage";
import { pages } from "../../data/site-pages";
import Link from "next/link";
import { allPublicItems, readableDate } from "@/lib/public-api";
export const metadata = { title: "Community Stories | Awaken With Me" };
export default async function TestimonialsPage() {
  const result = await allPublicItems("testimonials");
  const stories = Array.isArray(result.data) ? result.data : [];
  if (!stories.length) return <ContentPage {...pages.testimonials} cards={[]} sections={[]} notice={result.error || "No community stories have been published yet."} />;
  return <main className="min-h-screen bg-[#f7f8f3] text-[#29473c]"><div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
    <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">Community stories</p><h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-6xl">Personal experiences from the community.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-[#647368]">These are individual perspectives and do not promise the same outcome for others.</p>
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stories.map((story) => <article key={story.id} className="rounded-xl border border-[#dfe7dd] bg-white p-7"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#66836d]">{story.categoryName || story.programName || "Community story"}</p><h2 className="mt-3 font-[Georgia,serif] text-2xl">{story.title || story.name || story.authorName || "A personal experience"}</h2>{(story.excerpt || story.quote || story.content || story.description) && <p className="mt-4 line-clamp-5 text-sm leading-7 text-[#647368]">{story.excerpt || story.quote || story.content || story.description}</p>}{readableDate(story.publishedAt) && <p className="mt-4 text-xs text-[#738075]">{readableDate(story.publishedAt)}</p>}{story.id && <Link href={"/testimonials/" + encodeURIComponent(story.id)} className="mt-5 inline-block text-sm font-semibold text-[#315a48] hover:underline">Read story →</Link>}</article>)}</div>
    <p className="mt-10 text-sm text-[#647368]">Stories are personal experiences, not clinical evidence or a substitute for professional health support.</p>
  </div></main>;
}
