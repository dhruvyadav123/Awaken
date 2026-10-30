export default function LoadingFacilitators() {
  return <main className="min-h-[65vh] bg-white px-5 py-10 text-[#263e30] sm:px-8"><div className="mx-auto max-w-6xl" role="status" aria-label="Loading facilitator options and profiles">
    <div className="h-3 w-28 animate-pulse rounded bg-[#dfe7dd]" />
    <div className="mt-5 h-12 max-w-xl animate-pulse rounded bg-[#e9eee8]" />
    <div className="mt-10 rounded-2xl border border-[#dce6dc] bg-[#f4f6ef] p-8"><div className="h-8 max-w-lg animate-pulse rounded bg-[#dce6dc]" /><div className="mt-5 h-28 animate-pulse rounded-xl bg-white" /></div>
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-[#e4eae4] bg-[#f7f9f6]" />)}</div>
  </div></main>;
}
