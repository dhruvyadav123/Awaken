
export default function Loading() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-white px-5">
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center text-center"
      >
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#EFF5EF]">
          <span className="font-[Georgia,serif] text-4xl text-[#14513F]">
            ✦
          </span>

          <span className="absolute inset-0 animate-ping rounded-full border border-[#B7CFBF] opacity-40" />
        </div>

        <h1 className="mt-7 font-[Georgia,serif] text-[30px] text-[#164736]">
          Loading journal...
        </h1>

        <div className="mt-5 h-[2px] w-20 overflow-hidden rounded-full bg-[#DCE9DF]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#155542]" />
        </div>

        <span className="sr-only">
          Loading journal articles
        </span>
      </div>
    </main>
  );
}
