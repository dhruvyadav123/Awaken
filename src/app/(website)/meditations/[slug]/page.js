import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import MeditationPlayer from "@/components/website/meditations/MeditationPlayer";
import MembershipPlanStatus from "@/components/user/membership/MembershipPlanStatus";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";
import { meditationCategory, meditationDuration, meditationFormat, meditationRequiresMembership } from "@/lib/meditation-display";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await publicApi("meditations/" + encodeURIComponent(slug));
  return { title: (result.data?.seoTitle || result.data?.title || result.data?.name || "Meditation") + " | AwakenWithMeheck", description: result.data?.seoDescription || result.data?.description || undefined };
}

export default async function MeditationDetailPage({ params }) {
  const { slug } = await params;
  const result = await publicApi("meditations/" + encodeURIComponent(slug));
  if (result.status === 404 || (!result.error && !result.data)) notFound();
  const meditation = result.data || {};
  const content = meditation.content || meditation.script || meditation.description || meditation.text;
  const locked = meditationRequiresMembership(meditation);
  return <main className="min-h-screen bg-[#f7f8f3] px-4 pb-12 pt-0 text-[#29473c] sm:px-6 sm:pb-14 sm:pt-0"><article className="meditation-detail-page mx-auto max-w-6xl">
    <Link href="/meditations" className="text-sm font-semibold text-[#315a48] hover:underline">← All meditations</Link>
    {result.error ? <p role="alert" className="mt-8 text-[#8a4c3c]">{result.error}</p> : <>
      <div className="meditation-detail-banner">
        <RecordMedia record={meditation} compact imagesOnly priority />
        <div className="meditation-detail-banner-copy">
          <p>{meditationCategory(meditation)}</p>
          <h1>{meditation.title || meditation.name || "Meditation"}</h1>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#647368]"><span>{meditationFormat(meditation)}</span><span aria-hidden="true">·</span><span>{meditationDuration(meditation)}</span>{locked && <><span aria-hidden="true">·</span><span>Membership access</span></>}</div>
      {content && !locked && <div className="mt-8 whitespace-pre-line font-[Georgia,serif] text-lg leading-9 text-[#43534a]">{content}</div>}
      <MeditationPlayer meditation={meditation} />
      <div className="mt-12">
        <MembershipPlanStatus
          compact
          heading={locked ? "Unlock this meditation" : "Go deeper with membership"}
          description={locked
            ? "Become a member to access this meditation and continue with the full premium library."
            : "Explore membership plans for deeper practice, premium meditations, and member benefits."}
        />
      </div>
      <RecordDetails record={meditation} publicView exclude={["title", "name", "description", "shortDescription", "content", "body", "text", "excerpt", "duration", "durationMinutes", "durationSeconds", "contentType", "category", "categoryName", "membershipRequired", "requiresMembership", "hasAccess"]} />
    </>}
  </article></main>;
}
