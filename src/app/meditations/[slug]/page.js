import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";

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
  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-14 text-[#29473c] sm:px-8"><article className="mx-auto max-w-3xl">
    <Link href="/meditations" className="text-sm font-semibold text-[#315a48] hover:underline">← All meditations</Link>
    {result.error ? <p role="alert" className="mt-8 text-[#8a4c3c]">{result.error}</p> : <>
      <RecordMedia record={meditation} imagesOnly /><RecordDetails record={meditation} publicView exclude={["title", "name", "description", "shortDescription", "content", "body", "text", "excerpt"]} /><p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">Guided practice</p><h1 className="mt-3 font-[Georgia,serif] text-4xl sm:text-5xl">{meditation.title || meditation.name || "Meditation"}</h1>
      {content && <div className="mt-8 whitespace-pre-line font-[Georgia,serif] text-lg leading-9 text-[#43534a]">{content}</div>}
      {meditation.id && <Link href={`/profile/meditations/${encodeURIComponent(meditation.id)}`} className="mt-8 inline-flex rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white">Open in my meditations</Link>}
    </>}
  </article></main>;
}
