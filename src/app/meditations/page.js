import CategoryNavigation from "@/components/common/CategoryNavigation";
import { getPublicCategories } from "@/lib/category-data";
import MeditationLibrary from "@/components/meditations/MeditationLibrary";
import { allPublicItems } from "@/lib/public-api";

export const metadata = { title: "Meditations | Awaken With Meheck", description: "Explore guided meditations and short practices." };

export default async function MeditationsPage() {
  const [result, categories] = await Promise.all([allPublicItems("meditations"), getPublicCategories()]);
  const filters = <><CategoryNavigation categories={categories.data} type="MEDITATION" />{categories.error && <p role="alert" className="mt-3 text-sm text-[#8a4c3c]">Categories could not be loaded. You can still browse all meditations.</p>}</>;
  const meditations = Array.isArray(result.data) ? result.data : [];
  return <main className="min-h-screen bg-[#f7f8f3] text-[#29473c]"><div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
    <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">Pause here</p>
    <h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-6xl">Meditation library</h1>
    <p className="mt-5 max-w-2xl text-base leading-8 text-[#647368]">Choose an audio, video, or written practice. Public previews play here; membership content is unlocked securely through your account.</p>
    <div className="mt-6">{filters}</div>
    <section className="mt-10" aria-labelledby="library-title"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#66836d]">Browse the collection</p><h2 id="library-title" className="mt-2 font-[Georgia,serif] text-3xl">Find your next practice</h2></div>{!result.error && <p className="text-xs text-[#738075]">{meditations.length} {meditations.length === 1 ? "meditation" : "meditations"}</p>}</div>
      {result.error ? <div role="alert" className="rounded-xl border border-[#eadbd4] bg-white p-6 text-[#8a4c3c]"><p>We could not load the meditation library right now.</p><p className="mt-2 text-sm">{result.error}</p></div> : meditations.length ? <MeditationLibrary items={meditations} /> : <div className="rounded-xl border border-[#dfe7dd] bg-white p-8"><h2 className="font-[Georgia,serif] text-2xl">The library is quiet for now</h2><p className="mt-3 text-sm leading-7 text-[#647368]">No meditations are published right now. Please check again later.</p></div>}
    </section>
  </div></main>;
}
