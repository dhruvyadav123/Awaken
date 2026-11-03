
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BlogCards } from "@/components/website/blog/BlogCards";
import MeditationLibrary from "@/components/website/meditations/MeditationLibrary";
import { publicApi } from "@/lib/public-api";

function firstItems(result) {
  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.data?.items)) {
    return result.data.items;
  }

  return [];
}

function HeadingUnderline() {
  return (
    <svg
      viewBox="0 0 230 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="mt-3 h-5 w-[150px] sm:w-[200px]"
    >
      <path
        d="M4 17C75 -2 155 0 226 17"
        stroke="#91AD88"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionHeading({
  kicker,
  title,
  description,
  id,
}) {
  return (
    <header className="relative mb-8 w-full sm:mb-10 lg:mb-11">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="h-px w-8 shrink-0 bg-[#8FA68D] sm:w-12" />

        <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-[#315A48] sm:text-[13px]">
          {kicker}
        </p>

        <span className="h-px w-8 shrink-0 bg-[#8FA68D] sm:w-12" />
      </div>

      <h2
        id={id}
        className="max-w-[1100px] font-serif text-[clamp(32px,4vw,60px)] font-medium italic leading-[1.15] tracking-[-0.035em] text-[#244B36]"
      >
        {title}
      </h2>

      <HeadingUnderline />

      {description && (
        <p className="mt-3 max-w-[850px] text-[14px] leading-[1.8] text-[#35483C] sm:mt-4 sm:text-[17px]">
          {description}
        </p>
      )}
    </header>
  );
}

function SectionButton({ href, children }) {
  return (
    <Link
      href={href}
      style={{ color: "#FFFFFF" }}
      className="group inline-flex min-h-[52px] items-center justify-center gap-4 rounded-full bg-[#315A48] px-7 py-3 text-[14px] font-semibold !text-white shadow-[0_4px_15px_rgba(49,90,72,0.12)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#254638] hover:!text-white hover:shadow-[0_8px_20px_rgba(49,90,72,0.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315A48] sm:min-h-[56px] sm:px-9 sm:text-[16px]"
    >
      <span className="!text-white">
        {children}
      </span>

      <ArrowRight
        size={20}
        strokeWidth={1.8}
        color="#FFFFFF"
        aria-hidden="true"
        className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
      />
    </Link>
  );
}

function EmptyApiSection({ children, href }) {
  return (
    <div className="flex min-h-[160px] w-full flex-col items-center justify-center gap-4 py-8 text-center">
      <p className="text-[15px] leading-relaxed text-[#647568]">
        {children}
      </p>

      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#315A48] underline-offset-4 transition-colors hover:text-[#244B36] hover:underline"
        >
          Explore the library

          <ArrowRight
            size={16}
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}

export default async function HomeContentSections() {
  const [meditationResult, blogResult] =
    await Promise.all([
      publicApi("meditations", {
        page: 1,
        limit: 6,
      }),

      publicApi("blogs", {
        page: 1,
        limit: 3,
      }),
    ]);

  const meditations = firstItems(
    meditationResult
  ).slice(0, 6);

  const blogs = firstItems(blogResult)
    .filter((post) => post?.title)
    .slice(0, 3);

  return (
    <div className="w-full overflow-hidden bg-[#FBFAF7]">

      {/* ================================ */}
      {/* MEDITATION SECTION */}
      {/* ================================ */}

      <section
        aria-labelledby="home-meditation-heading"
        className="awaken-home-meditation relative w-full bg-[#FBFAF7]"
      >
        <div className="mx-auto w-full max-w-[1380px] px-5 pb-6 pt-12 sm:px-8 sm:pb-8 sm:pt-16 lg:px-12 lg:pb-10 lg:pt-[76px]">

          <SectionHeading
            id="home-meditation-heading"
            kicker="MAKE SPACE TO PAUSE"
            title="Meditation for the moment you are in."
            description="Choose a guided audio, or written practice and begin at your own pace."
          />

          <div className="relative w-full min-w-0">
            {meditations.length > 0 ? (
              <MeditationLibrary
                items={meditations}
                compact
                circleLayout
              />
            ) : (
              <EmptyApiSection href="/meditations">
                No meditations are published right now.
              </EmptyApiSection>
            )}
          </div>

          <div className="mt-8 flex w-full justify-center sm:mt-10 lg:mt-11">
            <SectionButton href="/meditations">
              View all meditations
            </SectionButton>
          </div>

        </div>
      </section>

      {/* ================================ */}
      {/* BLOG SECTION */}
      {/* ================================ */}

      <section
        aria-labelledby="home-blog-heading"
        className="awaken-home-blog relative w-full bg-[#FBFAF7]"
      >
        <div className="mx-auto w-full max-w-[1380px] px-5 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:px-12 lg:pb-[76px] lg:pt-10">

          <SectionHeading
            id="home-blog-heading"
            kicker="FROM THE BLOG"
            title="A little space to reflect."
          />

          <div className="relative w-full min-w-0">
            {blogs.length > 0 ? (
              <BlogCards
                posts={blogs}
                compact
              />
            ) : (
              <EmptyApiSection href="/blog">
                No posts are published right now.
              </EmptyApiSection>
            )}
          </div>

          <div className="mt-8 flex w-full justify-center sm:mt-10 lg:mt-11">
            <SectionButton href="/blog">
              Read more
            </SectionButton>
          </div>

        </div>
      </section>

      <style>{`
        /*
         * Meditation library responsive layout.
         * Keep cards inside their available width.
         */

        .awaken-home-meditation
        [aria-label="Meditation library"] {
          width: 100%;
          min-width: 0;
        }

        .awaken-home-meditation
        [aria-label="Meditation library"] > * {
          min-width: 0;
          max-width: 100%;
        }

        /*
         * Extra large desktop: 6 columns
         */

        @media (min-width: 1280px) {
          .awaken-home-meditation
          [aria-label="Meditation library"] {
            display: grid;
            grid-template-columns: repeat(
              6,
              minmax(0, 1fr)
            );
            column-gap: 20px;
            row-gap: 24px;
            align-items: start;
          }
        }

        /*
         * Tablet: 3 columns
         */

        @media (min-width: 768px) and (max-width: 1279px) {
          .awaken-home-meditation
          [aria-label="Meditation library"] {
            display: grid;
            grid-template-columns: repeat(
              3,
              minmax(0, 1fr)
            );
            column-gap: 24px;
            row-gap: 28px;
            align-items: start;
          }
        }

        /*
         * Mobile: 2 columns
         */

        @media (min-width: 420px) and (max-width: 767px) {
          .awaken-home-meditation
          [aria-label="Meditation library"] {
            display: grid;
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
            column-gap: 16px;
            row-gap: 24px;
            align-items: start;
          }
        }

        /*
         * Small mobile: 1 column
         */

        @media (max-width: 419px) {
          .awaken-home-meditation
          [aria-label="Meditation library"] {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            row-gap: 20px;
            justify-items: center;
          }
        }

        /*
         * Prevent content overflow.
         */

        .awaken-home-meditation img,
        .awaken-home-blog img {
          max-width: 100%;
        }

        .awaken-home-blog > div,
        .awaken-home-meditation > div {
          min-width: 0;
        }
      `}</style>
    </div>
  );
}
