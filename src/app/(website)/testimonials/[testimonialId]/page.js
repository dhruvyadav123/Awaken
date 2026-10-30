import { RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi, readableDate } from "@/lib/public-api";

export const dynamic = "force-dynamic";

function videoUrlFor(story) {
  const value = story.videoUrl || story.video || story.videoLink;
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
}

function youtubeEmbedUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] || "";
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] || "";
    }
    return /^[A-Za-z0-9_-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  } catch {
    return null;
  }
}

function TestimonialMedia({ story }) {
  const videoUrl = videoUrlFor(story);
  if (!videoUrl) return null;
  const embedUrl = youtubeEmbedUrl(videoUrl);
  if (embedUrl) {
    return <div className="mt-8 overflow-hidden rounded-2xl border border-[#dfe7dd] bg-[#e8eee7] shadow-sm"><iframe className="aspect-video w-full" src={embedUrl} title={story.title || "Video testimonial"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>;
  }
  return <div className="mt-8 rounded-2xl border border-[#dfe7dd] bg-white p-5"><p className="text-sm font-semibold text-[#315a48]">Video testimonial</p><p className="mt-1 text-sm text-[#647368]">This video is available at the link provided by the publisher.</p><a href={videoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-lg bg-[#315a48] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244a3a]">Open video link</a></div>;
}

export async function generateMetadata({ params }) {
  const { testimonialId } = await params;
  const result = await publicApi(`testimonials/${encodeURIComponent(testimonialId)}`, {}, { cache: "no-store" });
  return { title: (result.data?.title || result.data?.name || "Community story") + " | AwakenWithMeheck" };
}

export default async function TestimonialDetailPage({ params }) {
  const { testimonialId } = await params;
  const result = await publicApi(`testimonials/${encodeURIComponent(testimonialId)}`, {}, { cache: "no-store" });
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const story = result.data || {};
  const writtenStory = story.content || story.story || story.description || story.quote || story.excerpt;

  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-14 text-[#29473c] sm:px-8"><article className="mx-auto max-w-3xl">
    <Link href="/testimonials" className="text-sm font-semibold text-[#315a48] hover:underline">Back to all stories</Link>
    {result.error ? <p role="alert" className="mt-8 text-[#8a4c3c]">{result.error}</p> : <>
      <TestimonialMedia story={story} />
      <RecordDetails record={story} publicView exclude={["title", "name", "description", "shortDescription", "content", "body", "text", "excerpt", "videoUrl", "video", "videoLink"]} />
      <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">{story.categoryName || story.programName || "Community story"}</p>
      <h1 className="mt-3 font-[Georgia,serif] text-4xl sm:text-5xl">{story.title || story.name || story.authorName || "A personal experience"}</h1>
      {story.personName && <p className="mt-4 text-sm font-semibold text-[#315a48]">Shared by {story.personName}</p>}
      {readableDate(story.publishedAt) && <time className="mt-4 block text-sm text-[#738075]" dateTime={story.publishedAt}>{readableDate(story.publishedAt)}</time>}
      {writtenStory ? <div className="mt-8 whitespace-pre-line text-lg leading-9 text-[#43534a]">{writtenStory}</div> : <p className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-5 text-sm leading-7 text-[#647368]">This testimonial does not include written text.</p>}
      <p className="mt-12 border-t border-[#dfe7dd] pt-6 text-sm leading-7 text-[#647368]">This is an individual experience. It does not promise the same outcome for others and is not clinical evidence.</p>
    </>}
  </article></main>;
}
