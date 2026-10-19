import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import MeditationPlayer from "@/components/meditations/MeditationPlayer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";
import { meditationCategory, meditationDuration, meditationFormat, meditationRequiresMembership } from "@/lib/meditation-display";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await publicApi("meditations/" + encodeURIComponent(slug));
  return { title: (result.data?.seoTitle || result.data?.title || result.data?.name || "Meditation") + " | Awaken With Me", description: result.data?.seoDescription || result.data?.description || undefined };
}

export default async function MeditationDetailPage({ params }) {
  const { slug } = await params;
  const result = await publicApi("meditations/" + encodeURIComponent(slug));
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const meditation = result.data || {};
  const content = meditation.content || meditation.script || meditation.description || meditation.text;
  const locked = meditationRequiresMembership(meditation);
  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-14 text-[#29473c] sm:px-8"><article className="mx-auto max-w-3xl">
    <Link href="/meditations" className="text-sm font-semibold text-[#315a48] hover:underline">← All meditations</Link>
    {result.error ? <p role="alert" className="mt-8 text-[#8a4c3c]">{result.error}</p> : <>
      <div className="overflow-hidden rounded-2xl bg-[#e8eee5]"><RecordMedia record={meditation} imagesOnly /></div>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">{meditationCategory(meditation)}</p>
      <h1 className="mt-3 font-[Georgia,serif] text-4xl sm:text-5xl">{meditation.title || meditation.name || "Meditation"}</h1>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#647368]"><span>{meditationFormat(meditation)}</span><span aria-hidden="true">·</span><span>{meditationDuration(meditation)}</span>{locked && <><span aria-hidden="true">·</span><span>Membership access</span></>}</div>
      {content && !locked && <div className="mt-8 whitespace-pre-line font-[Georgia,serif] text-lg leading-9 text-[#43534a]">{content}</div>}
      <MeditationPlayer meditation={meditation} />
      <RecordDetails record={meditation} publicView exclude={["title", "name", "description", "shortDescription", "content", "body", "text", "excerpt", "duration", "durationMinutes", "durationSeconds", "contentType", "category", "categoryName", "membershipRequired", "requiresMembership", "hasAccess"]} />
    </>}
  </article></main>;
}
