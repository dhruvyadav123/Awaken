import Image from "next/image";
import Link from "next/link";

import { ContactTrigger } from "./ContactPopup";
import AmbientVideo from "./AmbientVideo";

function PageLink({ href, className = "", children }) {
  if (href === "/contact") {
    return (
      <ContactTrigger className={className}>
        {children}
      </ContactTrigger>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function ContentPage({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  sections = [],
  notice,
  cards = [],
  portrait = false,
  heroImage,
  immersiveHero = false,
  ambientVideo,
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdfb] text-[#11162d]">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative isolate min-h-[680px] overflow-hidden border-b border-[#ebe5e2] bg-[#f4eee8] lg:min-h-[760px]">
        {/* Hero background image */}
        {heroImage ? (
          <>
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#fff8f0]/95 via-[#fff8f0]/75 to-[#fff8f0]/10" />

            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(215,191,220,0.42),transparent_35%),radial-gradient(circle_at_20%_70%,rgba(246,214,190,0.55),transparent_40%)]" />

            <div className="absolute -right-40 top-16 h-[520px] w-[520px] rounded-full bg-[#eadde7]/80 blur-3xl" />

            <div className="absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-[#f6dfc9]/80 blur-3xl" />
          </>
        )}

        {/* Portrait */}
        {portrait && !heroImage ? (
          <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block">
            <Image
              src="/images/hero/meheck.png"
              alt="Meheck from Awaken With Me"
              fill
              priority
              sizes="48vw"
              className="object-contain object-bottom"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#f4eee8] via-transparent to-transparent" />
          </div>
        ) : null}

        {/* Decorative birds */}
        {immersiveHero ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[38%] top-24 hidden lg:block"
          >
            <span className="absolute left-0 top-10 rotate-12 text-2xl text-[#33323b]/70">
              ︿
            </span>

            <span className="absolute left-16 top-0 -rotate-6 text-xl text-[#33323b]/60">
              ︿
            </span>

            <span className="absolute left-28 top-20 rotate-12 text-2xl text-[#33323b]/70">
              ︿
            </span>

            <span className="absolute left-44 top-6 -rotate-6 text-3xl text-[#33323b]/70">
              ︿
            </span>

            <span className="absolute left-60 top-24 rotate-12 text-xl text-[#33323b]/60">
              ︿
            </span>
          </div>
        ) : null}

        <div className="relative z-10 mx-auto flex min-h-[680px] w-full max-w-[1440px] items-center px-5 py-24 sm:px-8 lg:min-h-[760px] lg:px-14 xl:px-20">
          <div className="max-w-[760px]">
            {/* Top Mark */}
            <div className="mb-9 flex flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#5e4a63] sm:text-[11px]">
              <span>Awaken</span>

              <span className="text-lg leading-none text-[#a880ad]">
                ✦
              </span>

              <span>{eyebrow || "Space To Begin"}</span>
            </div>

            {eyebrow ? (
              <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.42em] text-[#8a6a83] sm:text-xs">
                {eyebrow}
              </p>
            ) : null}

            <h1 className="max-w-[760px] font-serif text-[52px] font-medium leading-[0.96] tracking-[-0.045em] text-[#11152c] sm:text-[68px] lg:text-[82px] xl:text-[92px]">
              {title}
            </h1>

            <p className="mt-7 max-w-[670px] text-base leading-8 text-[#454552] sm:text-lg sm:leading-9 lg:text-[20px]">
              {description}
            </p>

            {(primaryAction || secondaryAction) && (
              <div className="mt-9 flex flex-wrap gap-4">
                {primaryAction ? (
                  <PageLink
                    href={primaryAction.href}
                    className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-lg bg-[#5f466d] px-7 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(95,70,109,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#503b5b] hover:shadow-[0_16px_34px_rgba(95,70,109,0.3)]"
                  >
                    {primaryAction.label}

                    <span
                      aria-hidden="true"
                      className="text-lg transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </PageLink>
                ) : null}

                {secondaryAction ? (
                  <PageLink
                    href={secondaryAction.href}
                    className="inline-flex min-h-[52px] items-center justify-center rounded-lg border border-[#736175] bg-white/75 px-7 text-sm font-semibold text-[#242238] backdrop-blur transition-all duration-300 hover:bg-white hover:shadow-lg"
                  >
                    {secondaryAction.label}
                  </PageLink>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {ambientVideo ? <AmbientVideo {...ambientVideo} /> : null}

      {/* =========================================================
          CARDS
      ========================================================= */}
      {cards.length ? (
        <section className="bg-[#fffdfb]">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-14 sm:px-8 lg:px-14 lg:py-20 xl:px-20">
            <div className="mb-9">
              <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-[#282745]">
                Ways To Explore
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((card, index) => (
                <article
                  key={`${card.title}-${index}`}
                  className="group relative min-h-[320px] overflow-hidden rounded-2xl border border-[#e8e2df] bg-white p-7 shadow-[0_12px_35px_rgba(31,25,35,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d9ccd9] hover:shadow-[0_20px_50px_rgba(31,25,35,0.08)] sm:p-8"
                >
                  <div className="absolute right-7 top-7 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5edf4] text-2xl text-[#754f7d]">
                    {index === 0 ? "♧" : index === 1 ? "♡" : "♢"}
                  </div>

                  <span className="font-serif text-[28px] text-[#72525c]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {card.tag ? (
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#9b515d]">
                      {card.tag}
                    </p>
                  ) : null}

                  <h2 className="mt-3 max-w-[82%] font-serif text-[29px] leading-tight tracking-[-0.02em] text-[#12162e]">
                    {card.title}
                  </h2>

                  <p className="mt-4 max-w-[390px] text-[15px] leading-7 text-[#616172]">
                    {card.body}
                  </p>

                  {card.href ? (
                    <PageLink
                      href={card.href}
                      className="mt-7 inline-flex items-center gap-3 text-sm font-semibold text-[#684176] transition-colors hover:text-[#3e2349]"
                    >
                      {card.label || "Explore"}

                      <span
                        aria-hidden="true"
                        className="text-lg transition-transform duration-300 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </PageLink>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* =========================================================
          NOTICE
      ========================================================= */}
      {notice ? (
        <section className="bg-[#fffdfb] px-5 pb-12 sm:px-8 lg:px-14 xl:px-20">
          <div className="mx-auto flex min-h-[86px] w-full max-w-[1280px] items-center justify-center rounded-xl bg-gradient-to-r from-[#f5eaf5] via-[#f8f0f8] to-[#f4e9f2] px-6 text-center shadow-[inset_0_0_0_1px_rgba(122,84,130,0.04)]">
            <p className="flex items-center justify-center gap-4 text-sm font-medium text-[#523e60] sm:text-base">
              <span className="text-2xl text-[#a176aa]">✦</span>

              <span>{notice}</span>
            </p>
          </div>
        </section>
      ) : null}

      {/* =========================================================
          CONTENT SECTIONS
      ========================================================= */}
      {sections.length ? (
        <section className="bg-[#fffdfb]">
          <div className="mx-auto w-full max-w-[1440px] px-5 pb-24 sm:px-8 lg:px-14 xl:px-20">
            {sections.map((section, index) => (
              <section
                key={`${section.heading}-${index}`}
                className="grid gap-8 border-b border-[#e4dedb] py-14 first:pt-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-20 lg:py-16"
              >
                {/* Left */}
                <div>
                  <div className="mb-5 flex items-center gap-5">
                    <span className="font-serif text-[23px] text-[#9c699b]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="h-px w-12 bg-[#9c718f]" />
                  </div>

                  <h2 className="max-w-[720px] font-serif text-[42px] leading-[1.05] tracking-[-0.035em] text-[#10152e] sm:text-[50px] lg:text-[58px]">
                    {section.heading}
                  </h2>

                  <div className="mt-7 max-w-[800px] space-y-5 text-[15px] leading-8 text-[#626170] sm:text-base">
                    {section.body ? <p>{section.body}</p> : null}

                    {section.paragraphs?.map((paragraph, paragraphIndex) => (
                      <p key={`${paragraphIndex}-${paragraph}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Right links */}
                {section.links?.length ? (
                  <div className="self-center">
                    <ul>
                      {section.links.map((item, linkIndex) => (
                        <li
                          key={`${item.href}-${linkIndex}`}
                          className="border-b border-[#ebe6e4] last:border-b-0"
                        >
                          <PageLink
                            href={item.href}
                            className="group flex items-center gap-4 py-4"
                          >
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f6edf6] text-lg text-[#76517d] transition-transform duration-300 group-hover:scale-105">
                              {linkIndex === 0
                                ? "◔"
                                : linkIndex === 1
                                  ? "♙"
                                  : "◫"}
                            </span>

                            <span className="min-w-0 flex-1">
                              <strong className="block text-[15px] font-semibold text-[#272342]">
                                {item.label}
                              </strong>

                              {item.description ? (
                                <small className="mt-1 block text-[12px] leading-5 text-[#737181] sm:text-[13px]">
                                  {item.description}
                                </small>
                              ) : null}
                            </span>

                            <span
                              aria-hidden="true"
                              className="text-xl text-[#9a5ba2] transition-transform duration-300 group-hover:translate-x-1"
                            >
                              →
                            </span>
                          </PageLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}