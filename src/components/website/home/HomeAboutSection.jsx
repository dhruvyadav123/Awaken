
import Link from "next/link";
import Image from "next/image";

import {
  getCmsItems,
  getCmsPayload,
  getTextValue,
} from "@/lib/cms-content";

import { publicApi } from "@/lib/public-api";

function HeadingUnderline() {
  return (
    <svg
      viewBox="0 0 190 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-5 w-[150px] sm:w-[180px]"
    >
      <path
        d="M5 17C55 -1 120 1 185 17"
        stroke="#829A77"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackgroundWaves() {
  return (
    <svg
      viewBox="0 0 1440 210"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-full w-full"
    >
      <path
        d="M0 195C225 180 380 206 555 149C748 85 925 126 1080 154C1220 179 1342 134 1440 73V210H0V195Z"
        fill="#E5EBDF"
        opacity="0.74"
      />
      <path
        d="M0 210C264 198 440 212 642 177C832 143 940 142 1090 155C1233 167 1346 129 1440 107V210H0Z"
        fill="#D6E1D1"
        opacity="0.53"
      />
    </svg>
  );
}

function AboutHeading({ heading }) {
  const highlightText = "AwakenWithMeheck";

  const position = heading
    .toLowerCase()
    .indexOf(highlightText.toLowerCase());

  if (position === -1) {
    return <>{heading}</>;
  }

  return (
    <>
      {heading.slice(0, position)}

      <em className="font-normal">
        {heading.slice(
          position,
          position + highlightText.length
        )}
      </em>

      {heading.slice(
        position + highlightText.length
      )}
    </>
  );
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function getAboutRecord(records) {
  if (!Array.isArray(records)) {
    return null;
  }

  const acceptedKeys = new Set([
    "about-section",
    "home-about",
    "home-about-section",
    "homepage-about",
    "about-us-section",
  ]);

  const candidates = records.flatMap((raw) => {
    const record = getCmsPayload(raw);

    const nested = [
      record.sections,
      record.items,
      record.blocks,
    ]
      .filter(Array.isArray)
      .flat();

    return [
      record,
      ...nested.map(getCmsPayload),
    ];
  });

  return (
    candidates.find((item) => {
      const values = [
        item.key,
        item.slug,
        item.sectionKey,
        item.identifier,
      ];

      return values.some((value) =>
        acceptedKeys.has(normalizeKey(value))
      );
    }) || null
  );
}

function firstText(sources, ...keys) {
  for (const source of sources) {
    if (!source || typeof source !== "object") {
      continue;
    }

    const value = getTextValue(source, ...keys);

    if (value) return value;
  }

  return "";
}

function getMediaUrl(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return getMediaUrl(
      value.publicUrl ||
      value.url ||
      value.src ||
      value.path ||
      value.fileUrl ||
      value.mediaId ||
      value._id ||
      value.id
    );
  }

  if (typeof value !== "string") {
    return "";
  }

  const source = value.trim();

  if (!source) return "";

  if (/^https?:\/\//i.test(source)) {
    return source;
  }

  if (
    source.startsWith("/") &&
    !source.startsWith("//")
  ) {
    return source;
  }

  if (/^[a-f0-9]{24}$/i.test(source)) {
    return `/api/public/files/media/${encodeURIComponent(
      source
    )}/file`;
  }

  return "";
}

function getSourceImage(source) {
  if (!source || typeof source !== "object") {
    return "";
  }

  const imageFields = [
    "imageMediaId",
    "imageUrl",
    "image",
    "bannerMediaId",
    "banner",
    "thumbnailMediaId",
    "thumbnail",
    "coverImage",
    "coverImageUrl",
    "featuredImage",
  ];

  for (const field of imageFields) {
    const url = getMediaUrl(source[field]);

    if (url) return url;
  }

  return "";
}

function firstImage(sources) {
  for (const source of sources) {
    const image = getSourceImage(source);

    if (image) return image;
  }

  return "";
}

export default async function HomeAboutSection() {
  const [records, pageResult] = await Promise.all([
    getCmsItems("sections"),
    publicApi("pages/about"),
  ]);

  const record = getAboutRecord(records) || {};

  const pageRoot = getCmsPayload(
    pageResult?.data || {}
  );

  const page = getCmsPayload(
    pageRoot.page || pageRoot
  );

  const blocks = Array.isArray(page.blocks)
    ? page.blocks
    : Array.isArray(pageRoot.blocks)
      ? pageRoot.blocks
      : [];

  const normalizedBlocks = blocks.map(
    getCmsPayload
  );

  const findBlock = (...types) =>
    normalizedBlocks.find((block) =>
      types.includes(
        String(block.type || block.kind || "")
          .toUpperCase()
      )
    ) || null;

  const hero = findBlock("HERO");

  const aboutBlock = findBlock(
    "ABOUT",
    "ABOUT_SECTION",
    "ABOUT_US"
  );

  const contentBlock = findBlock(
    "TEXT",
    "RICH_TEXT",
    "CONTENT"
  );

  const recordBody =
    record.body &&
    typeof record.body === "object"
      ? getCmsPayload(record.body)
      : {};

  const pageBody =
    page.body &&
    typeof page.body === "object"
      ? getCmsPayload(page.body)
      : {};

  const heading = firstText(
    [
      record,
      recordBody,
      aboutBlock,
      hero,
      page,
      pageBody,
    ],
    "heading",
    "title",
    "name"
  );

  const text = firstText(
    [
      record,
      recordBody,
      aboutBlock,
      hero,
      page,
      pageBody,
      contentBlock,
    ],
    "text",
    "description",
    "content",
    "body",
    "summary",
    "shortDescription"
  );

  const poster = firstImage([
    record,
    recordBody,
    aboutBlock,
    hero,
    page,
    pageBody,
  ]);

  const imageAlt = firstText(
    [
      record,
      aboutBlock,
      hero,
      page,
    ],
    "altText",
    "imageAlt",
    "heading",
    "title"
  ) || "AwakenWithMeheck";

  if (!heading && !text && !poster) {
    console.warn(
      "[HomeAboutSection] No About content found.",
      {
        cmsRecordCount: records.length,
        matchedCmsRecord: Boolean(
          getAboutRecord(records)
        ),
        aboutPageStatus: pageResult?.status,
        aboutPageError: pageResult?.error,
      }
    );

    return null;
  }

  return (
    <section
      aria-labelledby={
        heading ? "home-about-heading" : undefined
      }
      aria-label={
        !heading ? "About AwakenWithMeheck" : undefined
      }
      className="relative isolate w-full overflow-hidden bg-[#FBFAF7]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[90px] sm:h-[130px] lg:h-[175px]"
      >
        <BackgroundWaves />
      </div>

      <div
        className={`relative z-10 mx-auto grid w-full max-w-[1220px] items-center gap-8 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:gap-10 lg:px-10 lg:pb-24 lg:pt-20 ${
          poster
            ? "lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]"
            : "grid-cols-1"
        }`}
      >
        {poster && (
          <div className="relative mx-auto w-full max-w-[390px] sm:max-w-[400px] lg:mx-0 lg:max-w-none">
            <div
              className="relative aspect-[0.94] w-full overflow-hidden bg-[#E9EDE5]"
              style={{
                borderRadius: "2% 34% 2% 24%",
              }}
            >
              <Image
                src={poster}
                alt={imageAlt}
                fill
                unoptimized
                sizes="(max-width: 639px) 90vw, (max-width: 1023px) 400px, 400px"
                className="object-cover object-center"
              />
            </div>
          </div>
        )}

        <div
          className={`relative z-10 min-w-0 ${
            poster
              ? "text-center lg:text-left"
              : "mx-auto max-w-[900px] text-center"
          }`}
        >
          <div
            className={`mb-6 flex items-center gap-4 sm:mb-8 ${
              poster
                ? "justify-center lg:justify-start"
                : "justify-center"
            }`}
          >
            <span className="h-px w-9 bg-[#315A48] sm:w-14" />

            <span className="text-[12px] font-semibold uppercase tracking-[0.38em] text-[#315A48] sm:text-[14px]">
              About
            </span>

            <span className="h-px w-9 bg-[#315A48] sm:w-14" />
          </div>

          {heading && (
            <h2
              id="home-about-heading"
              className="font-serif text-[clamp(35px,4.1vw,72px)] font-medium leading-[1.12] tracking-[-0.035em] text-[#244B36]"
            >
              <AboutHeading heading={heading} />
            </h2>
          )}

          {heading && (
            <div
              className={`mt-5 flex sm:mt-7 ${
                poster
                  ? "justify-center lg:justify-start"
                  : "justify-center"
              }`}
            >
              <HeadingUnderline />
            </div>
          )}

          {text && (
            <p
              className={`max-w-[730px] whitespace-pre-line break-words text-[15px] font-normal leading-[1.85] tracking-[-0.01em] text-[#252925] sm:text-[17px] sm:leading-[1.9] xl:text-[19px] ${
                heading ? "mt-7 sm:mt-8" : "mt-5"
              } ${
                poster
                  ? "mx-auto lg:mx-0"
                  : "mx-auto"
              }`}
            >
              {text}
            </p>
          )}

          <div
            className={`mt-8 flex sm:mt-10 ${
              poster
                ? "justify-center lg:justify-start"
                : "justify-center"
            }`}
          >
            <Link
              href="/about"
              style={{ color: "#FFFFFF" }}
              className="group inline-flex min-h-[56px] items-center justify-center gap-5 rounded-[22px] bg-[#315A48] px-8 py-3.5 text-[15px] font-semibold !text-white shadow-[0_4px_14px_rgba(49,90,72,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#254638] hover:!text-white hover:shadow-[0_8px_20px_rgba(49,90,72,0.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315A48] sm:min-h-[64px] sm:px-10 sm:text-[17px]"
            >
              <span className="!text-white">
                Read More
              </span>

              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M4 12h16" />
                <path d="m13 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
