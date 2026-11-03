"use client";

import Script from "next/script";

export default function GoogleReviews() {
  return (
    <section
      className="w-full border-y border-[#edf0f5] bg-[linear-gradient(180deg,#f8fafd_0%,#f4f7fb_100%)] py-12 sm:py-16"
      aria-labelledby="google-reviews-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#6689c5]">Google Reviews</p>
          <h2 id="google-reviews-title" className="mt-1 font-[Georgia,serif] text-3xl leading-tight tracking-[-0.03em] text-[#1f2943] sm:text-4xl">What Our Customers Say</h2>
          <p className="mt-2 text-xs leading-5 text-[#778198] sm:text-sm">Real reviews from our valued customers on Google</p>
        </header>

        <div className="min-h-[230px] overflow-hidden rounded-2xl border border-[#edf0f5] bg-white p-3 shadow-[0_10px_35px_rgba(72,91,125,.07)] sm:min-h-[250px] sm:p-5 lg:p-6">
          <div
            className="elfsight-app-5845391b-e2ec-47e7-8a2d-7df2819a8ac8 min-h-[190px]"
            data-elfsight-app-lazy
          />
        </div>
      </div>

      <Script
        id="elfsight-google-reviews"
        src="https://elfsightcdn.com/platform.js"
        strategy="afterInteractive"
      />
    </section>
  );
}
