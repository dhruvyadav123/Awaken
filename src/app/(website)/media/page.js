import MediaGallery from "@/components/website/MediaGallery";
import { mediaVideos } from "@/data/media-videos";

export const metadata = { title: "Media | AwakenWithMeheck" };

export default function MediaPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#29473c]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">AwakenWithMeheck</p>
        <h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-6xl">Media, stories, and fresh perspectives.</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[#647368]">Explore Meheck&apos;s videos and discover more from AwakenWithMeheck.</p>
        <MediaGallery videos={mediaVideos} />
      </div>
    </main>
  );
}
