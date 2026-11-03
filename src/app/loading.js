export default function Loading() {
  return (
    <main className="min-h-[65vh] bg-[#faf8f2] px-5 py-16 text-[#315a48] sm:px-8" aria-busy="true">
      <div className="mx-auto max-w-6xl">
        <div className="h-3 w-24 animate-pulse rounded bg-[#dce9df]" />
        <div className="mt-5 h-10 max-w-xl animate-pulse rounded bg-[#e7efe7]" />
        <div className="mt-4 h-4 max-w-2xl animate-pulse rounded bg-[#edf3ed]" />
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-[#eef4ee]" />)}
        </div>
        <span className="sr-only">Loading page</span>
      </div>
    </main>
  );
}
