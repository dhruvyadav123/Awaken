import ContentPage from "../../../components/common/ContentPage";
import { pages } from "../../../data/site-pages";
import TestimonialCard from "@/components/website/TestimonialCard";
import { allPublicItems, readableDate } from "@/lib/public-api";

export const metadata = { title: "Community Stories | AwakenWithMeheck" };
export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const result = await allPublicItems("testimonials", { cache: "no-store" });
  const stories = Array.isArray(result.data) ? result.data : [];

  if (!stories.length) {
    return <ContentPage {...pages.testimonials} cards={[]} sections={[]} notice={result.error || "No community stories have been published yet."} />;
  }

  return <main className="min-h-screen bg-[#f7f8f3] text-[#29473c]"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
    <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">Community stories</p>
    <h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-6xl">Personal experiences from the community.</h1>
    <p className="mt-5 max-w-2xl text-base leading-8 text-[#647368]">Watch or read each story directly on this page.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stories.map((story) => <TestimonialCard key={story.id} story={story} publishedLabel={readableDate(story.publishedAt)} />)}
    </div>
    <p className="mt-10 text-sm text-[#647368]">Stories are personal experiences, not clinical evidence or a substitute for professional health support.</p>
  </div></main>;
}
