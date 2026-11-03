
/* eslint-disable @next/next/no-img-element */

import Script from "next/script";

import AboutFaqs from "../../../components/website/about/AboutFaqs";
import { pages } from "../../../data/site-pages";
import {
  getCmsPayload,
  getTextValue,
  safeLink,
} from "../../../lib/cms-content";
import {
  allPublicItems,
  publicApi,
} from "../../../lib/public-api";

export const metadata = {
  title: "Meheck Mukherjee | AwakenWithMeheck",
  description:
    "Meheck Mukherjee, International Transformation Coach, author and Master Healer.",
};

const VIDEO_ID = "QyCiqWbYWCg";

const VIDEO_URL =
  `https://www.youtube.com/watch?v=${VIDEO_ID}`;

const BOOKING_URL =
  "https://calendly.com/meheck/healing-sessions";

const INTRO_TEXT =
  "Meheck Mukherjee, International Transformation Coach, author is a Master Healer and survivor of narcissistic abuse and complex PTSD. Today, she creates programs that help people to connect with themselves without even disclosing their innermost secrets, and bring them to their true authentic self.";

const INTRO_BODY = INTRO_TEXT.replace(
  /^Meheck Mukherjee,\s*/,
  ""
);

function getText(record, ...fields) {
  const value = getTextValue(record, ...fields);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function publicMediaPath(mediaId) {
  if (
    typeof mediaId !== "string" ||
    !/^[a-f\d]{24}$/i.test(mediaId)
  ) {
    return "";
  }

  return `/api/public/files/media/${encodeURIComponent(
    mediaId
  )}/file`;
}

function mediaUrl(value) {
  if (typeof value !== "string") return "";

  const raw = value.trim();

  const markdown = raw.match(
    /^\[[^\]]*\]\((https?:\/\/[^)]+)\)$/
  );

  const url = markdown?.[1] || raw;

  if (
    url.startsWith("/") &&
    !url.startsWith("//")
  ) {
    return url;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return "";
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isRepeatedIntroduction(value) {
  const text = normalize(value);

  return (
    text.includes("international transformation coach") &&
    text.includes("innermost secrets") &&
    text.includes("authentic self")
  );
}

function isGenericHeading(value) {
  return [
    "about",
    "about us",
    "about me",
    "about awaken",
    "about awakenwithmeheck",
    "about meheck",
    "about meheck mukherjee",
    "meet meheck",
    "meet meheck mukherjee",
    "meheck mukherjee",
  ].includes(normalize(value));
}

function cleanBody(value) {
  if (typeof value !== "string") return "";

  return value
    .replace(
      /\[\*{0,2}\s*Learn more\s*\*{0,2}\]\(\s*https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^)]*\)/gi,
      ""
    )
    .trim();
}

function extractLink(value) {
  if (typeof value !== "string") return "";

  const raw = value.trim();

  const markdown = raw.match(
    /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/i
  );

  const plain = raw.match(
    /https?:\/\/[^\s)\]]+/i
  );

  const candidate =
    markdown?.[1] ||
    plain?.[0] ||
    (raw.startsWith("/") && !raw.startsWith("//")
      ? raw
      : "");

  if (!candidate) return "";

  const href = safeLink(candidate, {
    allowExternal: true,
  });

  if (!href) return "";

  // The introduction video and booking action
  // are already available in the hero.
  if (
    /(?:youtube\.com|youtu\.be)/i.test(href) ||
    /calendly\.com/i.test(href)
  ) {
    return "";
  }

  return href;
}

function extractLinkLabel(value) {
  if (typeof value !== "string") return "";

  const raw = value.trim();

  const markdown = raw.match(
    /^\[([^\]]+)\]\([^)]+\)$/
  );

  const label = markdown?.[1] || raw;

  if (
    /^(learn more|https?:\/\/)/i.test(
      label.trim()
    )
  ) {
    return "";
  }

  return label.trim();
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) {
    return value.items;
  }
  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
}

function sectionData(record) {
  const section = getCmsPayload(record);

  if (!section || typeof section !== "object") {
    return null;
  }

  const rawHeading = getText(
    section,
    "heading",
    "title"
  );

  const rawBody = getText(
    section,
    "text",
    "content",
    "body",
    "description"
  );

  const heading = isGenericHeading(rawHeading)
    ? ""
    : rawHeading;

  const body = cleanBody(rawBody);

  // Do not render the same introduction below again.
  if (isRepeatedIntroduction(body)) {
    return null;
  }

  const image =
    publicMediaPath(section.imageMediaId) ||
    mediaUrl(section.imageUrl) ||
    mediaUrl(section.image) ||
    "";

  const href =
    extractLink(section.linkUrl) ||
    extractLink(section.linkLabel);

  const label =
    extractLinkLabel(section.linkLabel);

  if (!heading && !body) return null;

  return {
    heading,
    body,
    image,
    href: label ? href : "",
    label,
  };
}

function uniqueSections(records) {
  const seen = new Set();

  return records
    .map(sectionData)
    .filter(Boolean)
    .filter((section) => {
      const key = normalize(
        `${section.heading} ${section.body}`
      );

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

async function getAboutData() {
  const [pageResult, sectionResult] =
    await Promise.allSettled([
      publicApi("pages/about"),
      allPublicItems("cms/sections"),
    ]);

  const page =
    pageResult.status === "fulfilled"
      ? pageResult.value?.data || {}
      : {};

  const records =
    sectionResult.status === "fulfilled"
      ? asArray(sectionResult.value?.data)
      : [];

  const aboutRecords = records.filter(
    (record) =>
      record?.key === "about-section" ||
      record?.data?.key === "about-section"
  );

  const blocks = asArray(page.blocks);

  const hero =
    blocks.find(
      (block) =>
        String(block?.type || "").toUpperCase() ===
        "HERO"
    ) || {};

  const aboutPayloads =
    aboutRecords.map(getCmsPayload).filter(Boolean);

  // Keep the original CMS image from the About page.
  const cmsImage =
    publicMediaPath(hero.imageMediaId) ||
    mediaUrl(hero.imageUrl) ||
    aboutPayloads
      .map(
        (section) =>
          publicMediaPath(section.imageMediaId) ||
          mediaUrl(section.imageUrl) ||
          mediaUrl(section.image)
      )
      .find(Boolean) ||
    "";

  const fallbackImage =
    mediaUrl(pages.about?.portraitVideo?.poster) ||
    mediaUrl(pages.about?.portrait) ||
    mediaUrl(pages.about?.image) ||
    "/images/hero/meheck.png";

  const image = cmsImage || fallbackImage;

  const sections = uniqueSections([
    ...blocks.filter(
      (block) =>
        block !== hero &&
        String(block?.type || "").toUpperCase() !==
          "HERO"
    ),
    ...aboutRecords,
  ]).map((section) => ({
    ...section,
    image:
      section.image === image ? "" : section.image,
  }));

  return {
    image,
    sections,
  };
}

function PlayIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5.14v13.72c0 .8.87 1.28 1.54.86l10.5-6.86a1.02 1.02 0 0 0 0-1.72L9.54 4.28A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function AboutHero({ image }) {
  return (
    <section
      className="w-full bg-white"
      aria-labelledby="about-page-title"
    >
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-10 px-5 pb-14 pt-9 sm:px-8 sm:pb-20 sm:pt-14 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-20 xl:gap-20 xl:px-16">
        {/* LEFT - ORIGINAL IMAGE */}
        <div className="min-w-0">
          <button
            type="button"
            data-about-video-open
            aria-label="Play Meheck Mukherjee introduction video"
            className="group relative mx-auto block aspect-[4/5] w-full max-w-[490px] cursor-pointer overflow-hidden rounded-[14px] border-0 bg-[#eef1eb] p-0 text-left outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#315a48] lg:mx-0"
          >
            <img
              src={image}
              alt="Meheck Mukherjee"
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.025]"
            />

            <span className="absolute inset-0 bg-black/[0.07] transition-colors group-hover:bg-black/[0.12]" />

            {/* CENTER PLAY BUTTON */}
            <span className="absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#df2335] shadow-[0_12px_35px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-105 sm:h-[86px] sm:w-[86px]">
              <span className="ml-1">
                <PlayIcon />
              </span>
            </span>
          </button>
        </div>

        {/* RIGHT - REAL INTRODUCTION */}
        <div className="min-w-0 lg:py-6">
          <h1
            id="about-page-title"
            className="max-w-[640px] font-serif text-[clamp(40px,4.5vw,68px)] font-normal leading-[1.1] tracking-[-0.05em] text-[#194b37]"
          >
            Meheck Mukherjee
          </h1>

          <div className="mt-6 h-px w-16 bg-[#9eb8a4]" />

          <p className="mt-7 max-w-[620px] text-[16px] leading-[1.95] text-[#4d6354] sm:text-[17px] lg:text-[18px]">
            {INTRO_BODY}
          </p>

          {/* BOOK PERSONAL SESSION */}
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex min-h-[54px] items-center justify-center gap-4 rounded-full border border-[#315a48] bg-[#315a48] px-7 text-[14px] font-semibold text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#244536] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315a48] sm:text-[15px]"
            style={{ color: "#ffffff" }}
          >
            Book Personal Session

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

function AboutVideoModal() {
  return (
    <dialog
      id="awaken-about-video"
      aria-label="Meheck Mukherjee introduction video"
      className="fixed inset-0 z-[1000] m-auto max-h-[95dvh] w-[calc(100%-28px)] max-w-[1050px] overflow-visible rounded-[16px] border-0 bg-transparent p-0 text-white shadow-[0_28px_100px_rgba(0,0,0,0.3)] backdrop:bg-[#06150e]/85"
    >
      <div className="relative">
        <button
          type="button"
          data-about-video-close
          aria-label="Close video"
          className="absolute -top-12 right-0 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-[#194b37] transition-colors hover:bg-[#e8efe9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <CloseIcon />
        </button>

        <div
          data-about-video-container
          className="relative aspect-video w-full overflow-hidden rounded-[15px] bg-black"
        />

        <div className="flex items-center justify-between gap-3 px-1 pt-4">
          <span className="text-[13px] text-white/90">
            Meheck Mukherjee
          </span>

          <a
            href={VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold text-white underline underline-offset-4 hover:text-[#d7e5da]"
          >
            Open on YouTube
          </a>
        </div>
      </div>
    </dialog>
  );
}

function CmsAboutSections({ sections }) {
  if (!sections.length) return null;

  return (
    <section
      aria-label="More information"
      className="w-full bg-white"
    >
      <div className="mx-auto w-full max-w-[1350px] px-5 sm:px-8 lg:px-12 xl:px-16">
        {sections.map((section, index) => {
          const hasImage = Boolean(section.image);

          return (
            <article
              key={`${normalize(section.heading)}-${index}`}
              className={`grid items-center gap-9 border-t border-[#e5ece6] py-12 sm:py-16 lg:gap-14 lg:py-20 ${
                hasImage ? "lg:grid-cols-2" : ""
              }`}
            >
              {hasImage && (
                <div
                  className={`relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[#edf1eb] ${
                    index % 2 === 1
                      ? "lg:order-2"
                      : ""
                  }`}
                >
                  <img
                    src={section.image}
                    alt={section.heading || ""}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              )}

              <div
                className={`min-w-0 ${
                  hasImage && index % 2 === 1
                    ? "lg:order-1"
                    : ""
                } ${
                  !hasImage
                    ? "mx-auto w-full max-w-[850px]"
                    : ""
                }`}
              >
                {section.heading && (
                  <h2 className="font-serif text-[clamp(30px,3vw,45px)] font-normal leading-[1.18] tracking-[-0.04em] text-[#194b37]">
                    {section.heading}
                  </h2>
                )}

                {section.body && (
                  <p
                    className={`whitespace-pre-line text-[15px] leading-[1.95] text-[#536757] sm:text-[16px] ${
                      section.heading ? "mt-5" : ""
                    }`}
                  >
                    {section.body}
                  </p>
                )}

                {section.href && (
                  <a
                    href={section.href}
                    target={
                      /^https?:\/\//i.test(section.href)
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      /^https?:\/\//i.test(section.href)
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="mt-6 inline-flex items-center gap-2 border-b border-[#315a48] pb-1 text-sm font-semibold text-[#315a48] hover:text-[#173d2d]"
                  >
                    {section.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default async function AboutPage() {
  const { image, sections } = await getAboutData();

  return (
    <main className="w-full overflow-hidden bg-white text-[#194b37]">
      <AboutHero image={image} />

      <CmsAboutSections sections={sections} />

      <div className="w-full bg-white">
        <AboutFaqs />
      </div>

      <AboutVideoModal />

      <Script
        id="awaken-about-video-controller"
        strategy="afterInteractive"
      >
        {`
          (function () {
            if (document.documentElement.dataset.aboutVideoHandler) {
              return;
            }

            document.documentElement.dataset.aboutVideoHandler = "true";

            let previousFocus = null;
            let previousOverflow = "";

            function getDialog() {
              return document.getElementById("awaken-about-video");
            }

            function openVideo() {
              const dialog = getDialog();
              if (!dialog || dialog.open) return;

              const container = dialog.querySelector(
                "[data-about-video-container]"
              );

              if (!container) return;

              previousFocus = document.activeElement;
              previousOverflow = document.body.style.overflow;

              dialog.showModal();
              document.body.style.overflow = "hidden";

              const iframe = document.createElement("iframe");

              iframe.src =
                "https://www.youtube.com/embed/QyCiqWbYWCg?autoplay=1&rel=0&playsinline=1";

              iframe.title = "Meheck Mukherjee introduction video";

              iframe.allow =
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

              iframe.referrerPolicy =
                "strict-origin-when-cross-origin";

              iframe.allowFullscreen = true;
              iframe.style.position = "absolute";
              iframe.style.inset = "0";
              iframe.style.width = "100%";
              iframe.style.height = "100%";
              iframe.style.border = "0";

              container.replaceChildren(iframe);

              dialog.querySelector(
                "[data-about-video-close]"
              )?.focus();
            }

            function closeVideo() {
              const dialog = getDialog();

              if (dialog?.open) {
                dialog.close();
              }
            }

            document.addEventListener("click", function (event) {
              if (!(event.target instanceof Element)) return;

              const openButton = event.target.closest(
                "[data-about-video-open]"
              );

              if (openButton) {
                openVideo();
                return;
              }

              const closeButton = event.target.closest(
                "[data-about-video-close]"
              );

              if (closeButton) {
                closeVideo();
                return;
              }

              const dialog = getDialog();

              if (dialog && event.target === dialog) {
                closeVideo();
              }
            });

            document.addEventListener(
              "close",
              function (event) {
                if (event.target?.id !== "awaken-about-video") {
                  return;
                }

                const container = event.target.querySelector(
                  "[data-about-video-container]"
                );

                // Removing iframe stops video playback.
                container?.replaceChildren();

                document.body.style.overflow =
                  previousOverflow;

                if (
                  previousFocus &&
                  previousFocus.isConnected &&
                  typeof previousFocus.focus === "function"
                ) {
                  previousFocus.focus();
                }
              },
              true
            );
          })();
        `}
      </Script>
    </main>
  );
}
