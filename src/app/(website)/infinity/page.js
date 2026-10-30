import Image from "next/image";
import Link from "next/link";

import { pages } from "../../../data/site-pages";

export const metadata = {
  title: "Infinity Community | AwakenWithMeheck",
  description:
    "Explore the Infinity community for ongoing learning, reflection, shared practice, and connection.",
};

function Arrow() {
  return <span aria-hidden="true" className="text-lg leading-none">→</span>;
}

export default function InfinityPage() {
  const infinity = pages.infinity;
  const membership = infinity.sections?.[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f3] text-[#29473c]">
      <section className="border-b border-[#dfe7dd] bg-[#e9eee5]">
        <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,.86fr)_minmax(0,1.14fr)]">
          <div className="flex items-center px-6 py-14 sm:px-10 sm:py-20 lg:px-[clamp(48px,7vw,112px)]">
            <div className="max-w-[560px]">
              <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#6c846c]">
                {infinity.eyebrow}
              </p>
              <h1 className="mt-5 max-w-[540px] font-[Georgia,serif] text-[clamp(44px,6vw,78px)] leading-[.98] tracking-[-.05em] text-[#29473c]">
                Your journey.
                <span className="block italic text-[#789275]">A little good company.</span>
              </h1>
              <p className="mt-6 max-w-[470px] text-[15px] leading-7 text-[#617267] sm:text-base">
                {infinity.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={infinity.primaryAction.href}
                  className="inline-flex min-h-11 items-center justify-center gap-3 rounded-md bg-[#315a48] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#244737]"
                >
                  {infinity.primaryAction.label}
                  <Arrow />
                </Link>
                <Link
                  href={infinity.secondaryAction.href}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#a9bca8] bg-white/60 px-5 text-sm font-semibold text-[#315a48] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  {infinity.secondaryAction.label}
                </Link>
              </div>
            </div>
          </div>

          <div className="relative min-h-[300px] overflow-hidden lg:min-h-[520px]">
            <Image
              src={infinity.heroImage.src}
              alt={infinity.heroImage.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 57vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#e9eee5]/45 via-transparent to-[#29473c]/10" />
            <div className="absolute bottom-6 left-6 rounded-full border border-white/60 bg-[#f7f8f3]/75 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#315a48] backdrop-blur sm:bottom-8 sm:left-8">
              Practice · Reflect · Connect
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="max-w-[620px]">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#6c846c]">What Infinity makes room for</p>
          <h2 className="mt-4 font-[Georgia,serif] text-[clamp(34px,4.3vw,54px)] leading-[1.05] tracking-[-.04em] text-[#29473c]">
            Keep coming back to what matters.
          </h2>
        </div>

        <div className="mt-12 grid border-y border-[#dfe7dd] md:grid-cols-3">
          {infinity.cards?.map((card, index) => (
            <article
              key={card.title}
              className="border-b border-[#dfe7dd] py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <div className="flex items-center justify-between text-[#88a087]">
                <span className="text-[11px] font-semibold tracking-[.16em]">0{index + 1}</span>
                <span aria-hidden="true" className="text-xl">↗</span>
              </div>
              <p className="mt-8 text-[10px] font-semibold uppercase tracking-[.2em] text-[#789275]">{card.tag}</p>
              <h3 className="mt-3 font-[Georgia,serif] text-[27px] leading-tight tracking-[-.025em] text-[#29473c]">{card.title}</h3>
              <p className="mt-3 max-w-[280px] text-sm leading-6 text-[#68786d]">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#dfe7dd] bg-[#eef2e9]">
        <div className="grid min-h-[430px] lg:grid-cols-[1.02fr,.98fr]">
          <div className="relative min-h-[300px] overflow-hidden lg:min-h-full">
            <Image
              src="/images/pages/start-here-sunrise.png"
              alt="Sunrise over a quiet landscape"
              fill
              sizes="(max-width: 1024px) 100vw, 51vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#29473c]/25 to-transparent" />
          </div>

          <div className="flex items-center px-6 py-14 sm:px-10 sm:py-18 lg:px-[clamp(48px,7vw,108px)]">
            <div className="max-w-[500px]">
              <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#6c846c]">The next step</p>
              <h2 className="mt-4 font-[Georgia,serif] text-[clamp(36px,4.4vw,56px)] leading-[1.04] tracking-[-.04em] text-[#29473c]">
                Membership when you are ready.
              </h2>
              <p className="mt-5 text-[15px] leading-7 text-[#617267]">
                {membership?.body || "Read about Infinity and check the current enrollment status."}
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Link href={membership?.links?.[0]?.href || "/infinity/membership"} className="inline-flex items-center gap-3 text-sm font-semibold text-[#315a48] underline decoration-[#9cb59d] underline-offset-8 transition hover:text-[#1f4432]">
                  {membership?.links?.[0]?.label || "Membership details"}
                  <Arrow />
                </Link>
                <Link href="/meditations" className="inline-flex items-center gap-3 text-sm font-semibold text-[#315a48] underline decoration-[#9cb59d] underline-offset-8 transition hover:text-[#1f4432]">
                  Try a short practice
                  <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
