export default function FacilitatorDetailLoading() {
  return (
    <main className="min-h-screen bg-white text-[#263e30]">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-9 sm:px-8">
        <div className="h-4 w-56 animate-pulse rounded bg-[#edf3eb]" />
        <section className="mt-10 grid gap-9 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)] lg:gap-14">
          <div className="space-y-5 py-6">
            <div className="h-3 w-36 animate-pulse rounded bg-[#edf3eb]" />
            <div className="h-16 max-w-xl animate-pulse rounded bg-[#e7efe5]" />
            <div className="h-20 max-w-xl animate-pulse rounded bg-[#f1f5ef]" />
            <div className="h-12 w-48 animate-pulse rounded-xl bg-[#e7efe5]" />
          </div>
          <div className="aspect-[4/4.7] animate-pulse rounded-2xl bg-[#edf3eb]" />
        </section>
      </div>
    </main>
  );
}
