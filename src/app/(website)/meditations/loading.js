export default function LoadingMeditations() {
  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-12 text-[#29473c] sm:px-8 sm:py-16"><div className="mx-auto max-w-6xl" role="status" aria-label="Loading meditation library">
    <div className="h-3 w-32 animate-pulse rounded bg-[#d8e1d5]" />
    <div className="mt-5 h-14 max-w-lg animate-pulse rounded bg-[#e3e9df]" />
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-[#dfe7dd] bg-white"><div className="h-44 animate-pulse bg-[#dfe7dd]" /><div className="space-y-4 p-6"><div className="h-3 w-24 animate-pulse rounded bg-[#dfe7dd]" /><div className="h-8 animate-pulse rounded bg-[#e8ece5]" /><div className="h-16 animate-pulse rounded bg-[#eef1ec]" /></div></div>)}</div>
  </div></main>;
}
