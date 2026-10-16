import Image from "next/image";
import Link from "next/link";

import { pages } from "../../../data/site-pages";
import MembershipPlanStatus from "@/components/membership/MembershipPlanStatus";

export const metadata = {
  title: "Infinity Membership | Awaken With Me",
  description:
    "Learn about Infinity membership, shared practice, reflection, and community at Awaken With Meheck.",
};

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="size-[17px]"
    >
      <path
        d="M5 12h13M14 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LotusIcon({ className = "size-9" }) {
  return (
    <svg
      viewBox="0 0 80 72"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M40 58c-6.8-11.2-7.2-22.7 0-35.2 7.2 12.5 6.8 24 0 35.2Z" />

        <path d="M40 58c-12-7-17.8-16.6-15.6-27.8C34.2 34 39 43.5 40 58Z" />

        <path d="M40 58c12-7 17.8-16.6 15.6-27.8C45.8 34 41 43.5 40 58Z" />

        <path d="M40 58C24 57 14.7 50.8 11 40.8 23.3 40.2 34 46 40 58Z" />

        <path d="M40 58c16-1 25.3-7.2 29-17.2C56.7 40.2 46 46 40 58Z" />

        <path d="M17.5 57.5c8 4.6 15.4 6.5 22.5 6.5s14.5-1.9 22.5-6.5" />
      </g>
    </svg>
  );
}

function MeditationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="size-5"
    >
      <path
        d="M12 4v5m0 0C9.5 7 7.1 6.6 5.2 7.2 5.6 10.1 8 12 12 12m0-3c2.5-2 4.9-2.4 6.8-1.8-.4 2.9-2.8 4.8-6.8 4.8m0 0v7m-5.5 0h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="size-5"
    >
      <path
        d="M4.5 5.5A2.5 2.5 0 0 1 7 3h4a2 2 0 0 1 2 2v15a2.8 2.8 0 0 0-2.5-1.5H4.5v-13Zm15 0A2.5 2.5 0 0 0 17 3h-4v17a2.8 2.8 0 0 1 2.5-1.5h4v-13Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrimaryAction({ href, children }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[50px] items-center justify-center gap-3 rounded-full bg-[linear-gradient(110deg,#9b581f,#c37a2d)] px-7 text-[14px] font-medium text-white shadow-[0_14px_30px_rgba(142,82,30,0.15)] transition-[transform,box-shadow,background] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(142,82,30,0.22)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a76830]"
    >
      <span>{children}</span>

      <span className="transition-transform duration-300 group-hover:translate-x-1">
        <ArrowIcon />
      </span>
    </Link>
  );
}

function SecondaryAction({ href, children }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[50px] items-center justify-center gap-3 rounded-full border border-[#b7753d] bg-white/55 px-7 text-[14px] font-medium text-[#2d2926] backdrop-blur-sm transition-[background-color,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#925526] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a76830]"
    >
      {children}
    </Link>
  );
}

function ThinExploreLink({
  href,
  icon,
  title,
  description,
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[94px] flex-1 items-center gap-4 px-2 py-5 transition-colors duration-300 hover:bg-[#fffaf5] sm:px-6 lg:px-8"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fbf2e8] text-[#a45d27] transition-transform duration-300 group-hover:scale-105">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block text-[20px] leading-tight text-[#27211e]"
          style={{
            fontFamily:
              'Georgia, "Times New Roman", serif',
          }}
        >
          {title}
        </span>

        <span className="mt-1 block text-[12px] leading-5 text-[#76706b] sm:text-[13px]">
          {description}
        </span>
      </span>

      <span className="shrink-0 text-[#aa632b] transition-transform duration-300 group-hover:translate-x-1.5">
        <ArrowIcon />
      </span>
    </Link>
  );
}

export default function MembershipPage() {
  const membership = pages.membership;
  const infinity = pages.infinity;

  const meditationLink =
    membership.sections?.[0]?.links?.[0];

  const journalLink =
    membership.sections?.[0]?.links?.[1];

  return (
    <main className="overflow-hidden bg-[#fffdf9] text-[#282320]">
      {/* ================================================================
          HERO
      ================================================================= */}

      <section className="relative min-h-[610px] overflow-hidden border-b border-[#eee6dc] sm:min-h-[650px] lg:min-h-[690px]">
        {/* HERO IMAGE */}
        <Image
          src="/images/pages/infinity-hero.png"
          alt="Infinity community"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center lg:object-[72%_center]"
        />

        {/* IMAGE SOFTENING */}
        <div className="absolute inset-0 bg-[#fff9f1]/10" />

        {/* LEFT CONTENT GRADIENT */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#fffaf4_0%,#fffaf4_28%,rgba(255,250,244,0.96)_42%,rgba(255,250,244,0.57)_57%,rgba(255,250,244,0.08)_76%,transparent_100%)] max-lg:bg-[linear-gradient(90deg,rgba(255,250,244,.98)_0%,rgba(255,250,244,.92)_48%,rgba(255,250,244,.55)_100%)]" />

        {/* TOP/BOTTOM DEPTH */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#fffaf4]/65 to-transparent" />

        {/* DECORATIVE LEFT BOTANICAL LINE */}
        <svg
          className="pointer-events-none absolute -left-[90px] top-[50px] h-[430px] w-[280px] text-[#c58a54]/20"
          viewBox="0 0 300 500"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M95 510c-4-156 39-275 140-411"
            stroke="currentColor"
            strokeWidth="1"
          />

          <path
            d="M127 376c-63-28-75-72-66-112 58 13 82 51 66 112Zm20-61c58-23 77-62 73-102-56 9-82 43-73 102ZM166 248c-47-29-57-68-46-101 46 16 65 48 46 101Zm19-51c48-18 67-50 66-84-47 6-70 34-66 84Z"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>

        {/* HERO CONTENT */}
        <div className="relative z-10 mx-auto flex min-h-[610px] w-[min(100%-40px,1280px)] items-center sm:min-h-[650px] max-[1080px]:w-[min(100%-32px,1280px)] lg:min-h-[690px]">
          <div className="max-w-[610px] pb-24 pt-20 sm:pb-28 lg:pt-16">
            {/* INFINITY */}
            <div
              className="mb-2 text-[62px] leading-none font-light text-[#bd884e]"
              aria-hidden="true"
            >
              ∞
            </div>

            <p className="mb-5 text-[11px] font-medium tracking-[0.38em] text-[#68625d] uppercase sm:text-[12px]">
              {membership.eyebrow}
            </p>

            <h1
              className="max-w-[590px] text-[clamp(48px,6.2vw,84px)] leading-[0.98] font-normal tracking-[-0.045em] text-[#211e1c]"
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
              }}
            >
              A space to
              <span className="block bg-[linear-gradient(90deg,#9a531f,#bf6d2b,#8d4b22)] bg-clip-text italic text-transparent">
                return to.
              </span>
            </h1>

            <p className="mt-7 max-w-[525px] text-[16px] leading-[1.75] text-[#645f5b] sm:text-[17px]">
              {membership.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <PrimaryAction
                href={membership.primaryAction.href}
              >
                {membership.primaryAction.label}
              </PrimaryAction>

              <SecondaryAction
                href={membership.secondaryAction.href}
              >
                {membership.secondaryAction.label}
              </SecondaryAction>
            </div>

            <Link
              href="#membership-details"
              className="group mt-11 inline-flex items-center gap-3 text-[9px] font-medium tracking-[0.31em] text-[#817973] uppercase"
            >
              Scroll to explore

              <svg
                viewBox="0 0 20 24"
                fill="none"
                className="h-5 w-4 transition-transform duration-300 group-hover:translate-y-1"
                aria-hidden="true"
              >
                <path
                  d="M10 2v17m0 0-5-5m5 5 5-5"
                  stroke="#a76531"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* PREMIUM GOLDEN FLOW */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-[-15px] z-[5] h-[150px] w-full opacity-80"
          viewBox="0 0 1600 160"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="membership-wave"
              x1="0"
              y1="0"
              x2="1600"
              y2="0"
            >
              <stop
                stopColor="#c68a4f"
                stopOpacity="0"
              />

              <stop
                offset=".26"
                stopColor="#c79256"
                stopOpacity=".42"
              />

              <stop
                offset=".58"
                stopColor="#e7c99f"
                stopOpacity=".75"
              />

              <stop
                offset=".85"
                stopColor="#c78c51"
                stopOpacity=".32"
              />

              <stop
                offset="1"
                stopColor="#c68a4f"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <path
            d="M-100 68C135 4 235 150 470 106C675 68 718 8 907 42C1091 75 1201 158 1700 62"
            stroke="url(#membership-wave)"
            strokeWidth="1"
          />

          <path
            d="M-100 83C140 18 247 160 477 121C679 87 726 28 910 59C1104 92 1202 170 1700 79"
            stroke="url(#membership-wave)"
            strokeWidth=".7"
            opacity=".55"
          />

          <path
            d="M-100 99C137 38 261 169 490 137C688 110 747 49 922 79C1112 111 1222 177 1700 98"
            stroke="url(#membership-wave)"
            strokeWidth=".6"
            opacity=".3"
          />
        </svg>
      </section>

      {/* ================================================================
          THIN NOTICE STRIP
      ================================================================= */}

      <section
        id="membership-details"
        className="bg-[#fffdf9] px-5 pt-7 sm:px-8 lg:pt-8"
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="relative flex min-h-[76px] items-center overflow-hidden rounded-[18px] border border-[#eee3d7] bg-[linear-gradient(90deg,#fffaf4,#fff7ee,#fffdf9)] px-5 sm:px-8">
            {/* decorative wave */}
            <svg
              className="pointer-events-none absolute right-0 top-0 h-full w-[45%] text-[#cf995f]/15"
              viewBox="0 0 600 100"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M0 80c130-90 229 40 365-20 91-40 152-22 260 19"
                stroke="currentColor"
                strokeWidth="1"
              />

              <path
                d="M0 94c130-90 229 40 365-20 91-40 152-22 260 19"
                stroke="currentColor"
                strokeWidth="1"
                opacity=".5"
              />
            </svg>

            <div className="relative z-10 flex w-full items-center gap-4 sm:gap-6">
              <span className="grid size-10 shrink-0 place-items-center text-[#a85e28]">
                <LotusIcon className="size-10" />
              </span>

              <span
                className="hidden h-10 w-px shrink-0 bg-[#d8b28e] sm:block"
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1"><MembershipPlanStatus /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          EXPLORE WHILE YOU WAIT
      ================================================================= */}

      <section className="bg-[#fffdf9] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1180px]">
          {/* TITLE */}
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center gap-3 text-[#b8763d]">
              <span className="h-px w-16 bg-[#dec6ae]" />

              <LotusIcon className="size-7" />

              <span className="h-px w-16 bg-[#dec6ae]" />
            </div>

            <h2
              className="mt-5 text-[clamp(35px,4vw,54px)] leading-[1.05] font-normal tracking-[-0.035em] text-[#27211e]"
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
              }}
            >
              Explore while{" "}
              <span className="text-[#a75c29]">
                you wait
              </span>
            </h2>

            <p className="mx-auto mt-3 max-w-[610px] text-[14px] leading-7 text-[#746e69] sm:text-[15px]">
              {membership.sections?.[0]?.body}
            </p>
          </div>

          {/* VERY THIN LINKS — NOT BIG CARDS */}
          <div className="mt-11 border-y border-[#eee7df]">
            <div className="grid lg:grid-cols-2">
              {meditationLink ? (
                <div className="border-b border-[#eee7df] lg:border-r lg:border-b-0">
                  <ThinExploreLink
                    href={meditationLink.href}
                    icon={<MeditationIcon />}
                    title={meditationLink.label}
                    description={meditationLink.description}
                  />
                </div>
              ) : null}

              {journalLink ? (
                <ThinExploreLink
                  href={journalLink.href}
                  icon={<JournalIcon />}
                  title={journalLink.label}
                  description={journalLink.description}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          ABOUT INFINITY
          Uses existing Infinity page content instead of invented copy.
      ================================================================= */}

      <section className="relative overflow-hidden border-t border-[#efe7de] bg-[#fffaf5]">
        <div className="grid min-h-[560px] lg:grid-cols-2">
          {/* IMAGE */}
          <div className="relative min-h-[390px] overflow-hidden lg:min-h-full">
            <Image
              src="/images/pages/start-here-sunrise.png"
              alt="A peaceful sunrise landscape"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(104,59,26,.08),transparent_55%,#fffaf5_100%)] max-lg:bg-[linear-gradient(0deg,#fffaf5_0%,transparent_40%)]" />

            {/* large lotus overlay */}
            <div className="absolute bottom-6 left-6 text-white/55 sm:bottom-10 sm:left-10">
              <LotusIcon className="size-24 sm:size-28" />
            </div>
          </div>

          {/* COPY */}
          <div className="relative flex items-center px-6 py-16 sm:px-12 lg:px-[clamp(54px,7vw,110px)] lg:py-20">
            <svg
              className="pointer-events-none absolute -right-24 bottom-[-80px] h-[360px] w-[360px] text-[#be8250]/10"
              viewBox="0 0 300 300"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M132 295c-4-92 19-177 91-268"
                stroke="currentColor"
              />

              <path
                d="M150 230c-54-15-75-47-73-76 50 4 78 29 73 76Zm15-49c48-18 64-47 59-74-45 8-66 31-59 74Z"
                stroke="currentColor"
              />
            </svg>

            <div className="relative z-10 max-w-[525px]">
              <div className="flex items-center gap-3 text-[#b8753e]">
                <span className="h-px w-10 bg-[#d9bda3]" />

                <LotusIcon className="size-7" />

                <span className="h-px w-10 bg-[#d9bda3]" />
              </div>

              <p className="mt-6 text-[10px] font-semibold tracking-[0.32em] text-[#82766c] uppercase">
                The Infinity community
              </p>

              <h2
                className="mt-4 text-[clamp(39px,4.5vw,60px)] leading-[1.04] font-normal tracking-[-0.04em] text-[#27211e]"
                style={{
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                }}
              >
                About{" "}
                <span className="text-[#a75c29]">
                  Infinity
                </span>
              </h2>

              <p className="mt-6 max-w-[470px] text-[15px] leading-[1.85] text-[#716a65] sm:text-[16px]">
                {infinity.description}
              </p>

              <div className="mt-8 h-px w-14 bg-[#c88a55]" />

              <Link
                href="/infinity"
                className="group mt-7 inline-flex items-center gap-4 text-[14px] font-medium text-[#995323]"
              >
                Explore the community

                <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                  <ArrowIcon />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
