import Link from "next/link";
import { getPublicCategories } from "@/lib/category-data";
import MeditationLibrary from "@/components/website/meditations/MeditationLibrary";
import MeditationCategoryCircles from "@/components/website/meditations/MeditationCategoryCircles";
import { allPublicItems } from "@/lib/public-api";
import { meditationRequiresMembership } from "@/lib/meditation-display";

export const metadata = { title: "Meditations | AwakenWithMeheck", description: "Explore guided meditations and short practices." };

export default async function MeditationsPage() {
  const [result, categories] = await Promise.all([allPublicItems("meditations"), getPublicCategories()]);
  const meditations = Array.isArray(result.data) ? result.data : [];
  const premiumCount = meditations.filter(meditationRequiresMembership).length;
  return <main className="min-h-screen bg-[#fbfbff] text-[#292957]"><div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
    <header className="mx-auto max-w-2xl text-center">
      <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#706cc6]">AwakenWithMeheck</p>
      <h1 className="mt-3 font-[Georgia,serif] text-4xl font-semibold tracking-[-.035em] text-[#171735] sm:text-5xl">Meditation</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#68688e]">Your choice, your path — find a quiet practice for the moment you are in.</p>
    </header>
    {categories.error && <p role="alert" className="mt-5 text-center text-sm text-[#8a4c3c]">Categories could not be loaded. You can still browse all published meditations.</p>}
    <MeditationCategoryCircles categories={categories.data} items={meditations} />
    {premiumCount > 0 && <section className="mx-auto mt-7 flex w-full max-w-md flex-col items-center rounded-2xl border border-[#dedcff] bg-white px-5 py-4 text-center shadow-[0_8px_24px_rgba(91,87,192,0.08)]" aria-labelledby="premium-meditations-title">
      <h2 id="premium-meditations-title" className="font-[Georgia,serif] text-lg font-semibold text-[#292957]">Unlock premium meditations</h2>
      <p className="mt-1 text-xs leading-5 text-[#77769a]">Become a member to access {premiumCount} premium {premiumCount === 1 ? "practice" : "practices"}.</p>
      <Link href="/infinity/membership" className="mt-3 inline-flex min-h-9 items-center justify-center rounded-full bg-[#514bd1] px-5 text-xs font-semibold text-white shadow-[0_5px_12px_rgba(81,75,209,0.22)] transition hover:bg-[#3f3ab6]">Join membership</Link>
    </section>}
    <section className="mt-9" aria-labelledby="library-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d5f96]">Your practice library</p><h2 id="library-title" className="mt-1 font-[Georgia,serif] text-2xl font-semibold text-[#292957]">Choose a meditation</h2></div>{!result.error && <p className="text-xs text-[#817f9e]">{meditations.length} {meditations.length === 1 ? "practice" : "practices"}</p>}</div>
      {result.error ? <div role="alert" className="rounded-2xl border border-[#eadbd4] bg-white p-6 text-[#8a4c3c]"><p>We could not load the meditation library right now.</p><p className="mt-2 text-sm">{result.error}</p></div> : meditations.length ? <MeditationLibrary items={meditations} circleLayout /> : <div className="rounded-2xl border border-[#e1e0f0] bg-white p-8 text-center"><h2 className="font-[Georgia,serif] text-2xl">No published meditations yet</h2><p className="mt-3 text-sm leading-7 text-[#68688e]">The library will appear here as soon as real practices are published.</p></div>}
    </section>
  </div></main>;
}
