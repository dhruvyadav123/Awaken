import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi, readableDate } from "@/lib/public-api";

export async function generateMetadata({ params }) {
  const { testimonialId } = await params;
  const result = await publicApi("testimonials/" + encodeURIComponent(testimonialId));
  return { title: (result.data?.title || result.data?.name || "Community story") + " | Awaken With Me" };
}

export default async function TestimonialDetailPage({ params }) {
  const { testimonialId } = await params;
  const result = await publicApi("testimonials/" + encodeURIComponent(testimonialId));
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const story = result.data || {};
  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-14 text-[#29473c] sm:px-8"><article className="mx-auto max-w-3xl">
    <Link href="/testimonials" className="text-sm font-semibold text-[#315a48] hover:underline">← All stories</Link>
    {result.error ? <p role="alert" className="mt-8 text-[#8a4c3c]">{result.error}</p> : <>
      <RecordMedia record={story} /><RecordDetails record={story} publicView exclude={["title", "name", "description", "shortDescription", "content", "body", "text", "excerpt"]} /><p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">{story.categoryName || story.programName || "Community story"}</p>
      <h1 className="mt-3 font-[Georgia,serif] text-4xl sm:text-5xl">{story.title || story.name || story.authorName || "A personal experience"}</h1>
      {readableDate(story.publishedAt) && <time className="mt-4 block text-sm text-[#738075]" dateTime={story.publishedAt}>{readableDate(story.publishedAt)}</time>}
      <div className="mt-8 whitespace-pre-line text-lg leading-9 text-[#43534a]">{story.content || story.story || story.description || story.quote || story.excerpt}</div>
      <p className="mt-12 border-t border-[#dfe7dd] pt-6 text-sm leading-7 text-[#647368]">This is an individual experience. It does not promise the same outcome for others and is not clinical evidence.</p>
    </>}
  </article></main>;
}
