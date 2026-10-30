import ContentPage from "../../../components/common/ContentPage";
import AboutFaqs from "../../../components/website/about/AboutFaqs";
import { pages } from "../../../data/site-pages";
import { getCmsPayload, getTextValue, safeLink } from "../../../lib/cms-content";
import { allPublicItems, publicApi } from "../../../lib/public-api";

export const metadata = { title: "About | AwakenWithMeheck" };
const fallbackAboutVideo = "https://www.youtube.com/watch?v=QyCiqWbYWCg";
const aboutHeroDescription = "Meheck Mukherjee, International Transformation Coach, author is a Master Healer and survivor of narcissistic abuse and complex PTSD. Today, she creates programs that help people to connect with themselves without even disclosing their innermost secrets, and bring them to their true authentic self.";

function publicMediaPath(mediaId) {
  return typeof mediaId === "string" && /^[a-f\d]{24}$/i.test(mediaId)
    ? `/api/public/files/media/${encodeURIComponent(mediaId)}/file`
    : "";
}

function externalLinks(value) {
  if (Array.isArray(value)) return value.flatMap(externalLinks);
  if (value && typeof value === "object") return Object.values(value).flatMap(externalLinks);
  if (typeof value !== "string") return [];
  const raw = value.trim();
  const markdownLinks = Array.from(raw.matchAll(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi), (match) => match[1]);
  const plainLinks = raw.match(/https?:\/\/[^\s)\]]+/gi) || [];
  return [...new Set([...markdownLinks, ...plainLinks])]
    .map((href) => safeLink(href, { allowExternal: true }))
    .filter(Boolean);
}

function markdownLink(value) {
  const href = externalLinks(value)[0];
  if (!href) return null;
  const match = typeof value === "string" ? value.trim().match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i) : null;
  return { label: match?.[1]?.trim() || href, href };
}

function isYoutubeUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    return host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be";
  } catch {
    return false;
  }
}

function apiSection(record, index) {
  const section = getCmsPayload(record);
  const heading = getTextValue(section, "heading", "title");
  const body = getTextValue(section, "text", "content", "body", "description");
  const link = [markdownLink(section.linkUrl), markdownLink(section.linkLabel)]
    .find((candidate) => candidate && !isYoutubeUrl(candidate.href) && !/calendly\.com/i.test(candidate.href));
  const labelLink = markdownLink(section.linkLabel);
  const image = publicMediaPath(section.imageMediaId);

  if (!heading && !body && !link) return null;

  return {
    heading: heading || `About Awaken ${index + 1}`,
    body,
    links: link ? [{ label: link.label, description: labelLink?.label && labelLink.label !== link.label ? labelLink.label : "Learn more.", href: link.href }] : [],
    ...(image ? { image } : {}),
  };
}

async function aboutContent() {
  const [pageResult, sectionResult] = await Promise.all([
    publicApi("pages/about"),
    allPublicItems("cms/sections"),
  ]);

  const page = pageResult.data;
  const pageData = page || {};
  const hero = Array.isArray(pageData.blocks)
    ? pageData.blocks.find((block) => String(block?.type || "").toUpperCase() === "HERO") || pageData.blocks[0]
    : null;
  const sectionRecords = (sectionResult.data || []).filter((item) => item?.key === "about-section" || item?.data?.key === "about-section");
  const aboutSection = sectionRecords.map(getCmsPayload).find((section) => getTextValue(section, "heading", "text", "description"));
  const sections = sectionRecords.map(apiSection).filter(Boolean);
  const apiPoster = publicMediaPath(hero?.imageMediaId) || sections.find((section) => section.image)?.image || "";
  // This is the published About introduction video. Keep it explicit so a
  // stale CMS video field cannot hide the working YouTube introduction.
  const videoLink = fallbackAboutVideo;
  const bookingLink = sectionRecords
    .map(getCmsPayload)
    .map((section) => externalLinks(section.linkLabel).find((href) => /calendly\.com/i.test(href)))
    .find(Boolean);

  return {
    ...pages.about,
    ...(hero || page || aboutSection ? {
      title: getTextValue(hero, "heading") || page?.title || "AwakenWithMeheck",
    } : {}),
    description: aboutHeroDescription,
    sections,
    ...(bookingLink ? { primaryAction: { ...pages.about.primaryAction, href: bookingLink } } : {}),
    ...(videoLink || apiPoster ? {
      portraitVideo: {
        src: videoLink || "",
        poster: apiPoster || "",
        title: getTextValue(hero, "heading") || "Meet Meheck Mukherjee",
      },
    } : {}),
  };
}

export default function AboutPage() {
  return <AboutContent />;
}

async function AboutContent() {
  const content = await aboutContent();
  return <><ContentPage {...content} plainWhite portraitSide="left" portraitCard heroTitleClassName="!max-w-[620px] !text-[40px] !leading-[1.02] sm:!text-[50px] lg:!text-[60px] xl:!text-[68px]" /><AboutFaqs /></>;
}
