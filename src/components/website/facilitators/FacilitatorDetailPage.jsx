import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  ExternalLink,
  GraduationCap,
  Languages,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";

import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { allPublicItems, publicApi } from "@/lib/public-api";
import { recordMedia } from "@/lib/record-display";
import FacilitatorSectionTabs from "./FacilitatorSectionTabs";

const RELATION_KEYS = [
  "facilitatorId", "facilitatorIds", "facilitatorSlug", "facilitatorSlugs", "facilitatorUserId", "facilitatorProfileId", "facilitator", "facilitators",
  "instructorId", "instructorIds", "instructorSlug", "instructorSlugs", "instructorUserId", "instructorProfileId", "instructor", "instructors",
  "teacherId", "teacherIds", "teacherSlug", "teacherSlugs", "teacherUserId", "teacherProfileId", "teacher", "teachers",
];

const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  twitter: "Twitter",
};

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (!isRecord(value)) return "";
  return text(value.title || value.name || value.label || value.value || value.description || value.text);
}

function listValues(value) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,]+/) : value == null ? [] : [value];
  return [...new Set(source.flatMap((item) => {
    if (Array.isArray(item)) return listValues(item);
    const valueText = text(item);
    return valueText ? [valueText] : [];
  }).map((item) => item.trim()).filter(Boolean))];
}

function getName(person) {
  return text(person?.displayName || person?.name || person?.title) || "Facilitator profile";
}

function getShortBio(person) {
  return text(person?.shortBio || person?.shortDescription || person?.excerpt);
}

function getBiography(person) {
  return text(person?.fullBio || person?.bio || person?.content || person?.description || getShortBio(person));
}

function getTargetTokens(person) {
  return new Set([
    person?.id, person?._id, person?.userId, person?.profileId, person?.facilitatorId, person?.slug,
  ].filter((value) => value !== undefined && value !== null && String(value).trim()).map((value) => String(value).trim()));
}

function referenceTokens(value) {
  if (Array.isArray(value)) return value.flatMap(referenceTokens);
  if (typeof value === "string" || typeof value === "number") return [String(value).trim()].filter(Boolean);
  if (!isRecord(value)) return [];
  return [
    value.id, value._id, value.slug, value.userId, value.profileId,
    value.facilitatorId, value.facilitatorSlug, value.facilitatorUserId, value.facilitatorProfileId,
    value.instructorId, value.instructorSlug, value.instructorUserId, value.instructorProfileId,
    value.teacherId, value.teacherSlug, value.teacherUserId, value.teacherProfileId,
  ].filter((item) => item !== undefined && item !== null && String(item).trim()).map((item) => String(item).trim());
}

function relationTokens(record) {
  const values = RELATION_KEYS.flatMap((key) => Object.prototype.hasOwnProperty.call(record || {}, key) ? [record[key]] : []);
  const nested = [record?.relationships, record?.relations].filter(isRecord);
  nested.forEach((container) => RELATION_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(container, key)) values.push(container[key]);
  }));
  return [...new Set(values.flatMap(referenceTokens))];
}

function recordIdentity(record) {
  return String(record?.id || record?._id || record?.slug || [record?.title || record?.name, record?.startsAt || record?.startDate || ""].join("|") || "record");
}

function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!isRecord(record)) return false;
    const identity = recordIdentity(record);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function filterRelated(result, person, kind) {
  if (result?.error) return { items: [], error: result.error, relationshipMissing: false };
  if (!Array.isArray(result?.data)) return { items: [], error: `The public ${kind} response was incomplete. Please try again later.`, relationshipMissing: false };
  const records = uniqueRecords(result.data);
  if (!records.length) return { items: [], error: "", relationshipMissing: false };
  const target = getTargetTokens(person);
  const withReferences = records.filter((record) => relationTokens(record).length > 0);
  if (!withReferences.length) return { items: [], error: "", relationshipMissing: true };
  return { items: withReferences.filter((record) => relationTokens(record).some((token) => target.has(token))), error: "", relationshipMissing: false };
}

function profileMediaRecord(person, name) {
  const profileImage = person?.profileImage ?? person?.profileImageUrl;
  const mediaId = person?.profileImageMediaId;
  return {
    ...person,
    ...(profileImage != null && !person?.avatar ? { avatar: profileImage } : {}),
    ...(mediaId && !person?.avatarMediaId ? { avatarMediaId: mediaId } : {}),
    imageAlt: person?.imageAlt || person?.altText || `${name} profile image`,
  };
}

function validExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.toString() : "";
  } catch {
    return "";
  }
}

function formatAmount(value, currency) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) return "";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

function priceParts(item) {
  const currency = typeof item?.currency === "string" ? item.currency.toUpperCase() : "";
  const regular = formatAmount(item?.regularPrice, currency);
  const discounted = Number.isFinite(Number(item?.discountPrice)) && Number(item.discountPrice) < Number(item?.regularPrice)
    ? formatAmount(item.discountPrice, currency)
    : "";
  const current = discounted || formatAmount(item?.price ?? item?.amount ?? item?.regularPrice, currency);
  return { current, regular: discounted ? regular : "" };
}

function formatDateTime(value, timezone = "Asia/Kolkata") {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", { timeZone: timezone || "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
}

function eventStart(item) { return item?.startsAt || item?.startDate || item?.date || ""; }
function eventEnd(item) { return item?.endsAt || item?.endDate || ""; }
function isCurrentOrUpcoming(item) {
  const boundary = eventEnd(item) || eventStart(item);
  return !boundary || Number.isNaN(Date.parse(boundary)) || Date.parse(boundary) >= Date.now();
}
function sortByStart(a, b) {
  const left = Date.parse(eventStart(a));
  const right = Date.parse(eventStart(b));
  if (Number.isNaN(left)) return 1;
  if (Number.isNaN(right)) return -1;
  return left - right;
}

function MediaFrame({ record, label, className = "" }) {
  const initials = listValues(label).join(" ").split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "A";
  return <div className={`relative overflow-hidden bg-[#e8f0e6] ${className}`}>
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#f4f7ed,#dce9dc)] text-4xl font-semibold tracking-[0.16em] text-[#709178]" aria-hidden="true">{initials}</div>
    <div className="relative z-10 h-full w-full [&_.api-media-gallery]:!mb-0 [&_.api-media-gallery]:!h-full [&_.api-media-asset]:!h-full [&_.api-media-asset]:!rounded-none [&_.api-media-asset]:!border-0 [&_.api-media-asset]:!p-0 [&_.api-media-asset_img]:!h-full [&_.api-media-asset_img]:!max-h-none [&_.api-media-asset_img]:!aspect-auto [&_.api-media-asset_img]:!rounded-none"><RecordMedia record={record} compact imagesOnly /></div>
  </div>;
}

function SectionHeading({ id, eyebrow, title, description }) {
  return <header className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#668b70]">{eyebrow}</p><h2 id={id} className="mt-2 font-[Georgia,serif] text-3xl leading-tight tracking-tight text-[#203d2b] sm:text-4xl">{title}</h2>{description && <p className="mt-3 text-sm leading-7 text-[#68776d]">{description}</p>}</header>;
}

function Tags({ values }) {
  const items = listValues(values);
  if (!items.length) return null;
  return <ul className="flex flex-wrap gap-2">{items.map((item) => <li key={item} className="rounded-full border border-[#d7e5d7] bg-[#f5f9f3] px-3 py-1.5 text-xs font-medium text-[#3e684a]">{item}</li>)}</ul>;
}

function DetailBlock({ icon: Icon, label, value, children }) {
  if (!value && !children) return null;
  return <div className="flex gap-3 border-t border-[#e5ece4] py-4 first:border-t-0 first:pt-0 last:pb-0"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5eb] text-[#4d7858]"><Icon size={16} strokeWidth={1.8} /></span><div className="min-w-0 flex-1"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b866f]">{label}</div>{value && <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-[#445b4c]">{value}</p>}{children && <div className="mt-2">{children}</div>}</div></div>;
}

function SocialLinks({ person }) {
  const links = Object.entries(SOCIAL_LABELS).map(([key, label]) => ({ label, href: validExternalUrl(person?.socialLinks?.[key]) })).filter((item) => item.href);
  if (!links.length) return null;
  return <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">{links.map(({ label, href }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3d6e4f] underline-offset-4 transition hover:underline"><ExternalLink size={13} />{label}</a>)}</div>;
}

function CatalogMessage({ kind, error, relationshipMissing, emptyText }) {
  if (error) return <p role="alert" className="mt-7 rounded-xl border border-[#eadbd4] bg-[#fff9f6] px-5 py-4 text-sm leading-7 text-[#8e5042]">{error}</p>;
  if (relationshipMissing) return <p role="status" className="mt-7 rounded-xl border border-[#e5ebe5] bg-[#fafcf9] px-5 py-4 text-sm leading-7 text-[#69786e]">The public {kind} response does not include a facilitator ID or slug, so these listings cannot be safely connected to this profile.</p>;
  return <p className="mt-7 text-sm leading-7 text-[#69786e]">{emptyText}</p>;
}

function CardMedia({ record, label }) { return <MediaFrame record={record} label={label} className="aspect-[1.55]" />; }
function Price({ item }) { const { current, regular } = priceParts(item); if (!current) return null; return <div className="text-right text-sm font-semibold text-[#315a48]"><span>{current}</span>{regular && <span className="ml-2 text-xs font-normal text-[#8a968d] line-through">{regular}</span>}</div>; }
function getSessionFacilitatorMedia(item, facilitator) {
  const facilitatorTokens = getTargetTokens(facilitator);
  const sessionBelongsToFacilitator = relationTokens(item).some((token) => facilitatorTokens.has(token));
  if (!sessionBelongsToFacilitator) return null;

  const candidates = [item.facilitator, item.instructor, item.teacher, facilitator]
    .filter(isRecord)
    .map((candidate) => profileMediaRecord(candidate, getName(candidate)));

  return candidates.find((candidate) => recordMedia(candidate, { scope: "public", imagesOnly: true }).length > 0) || null;
}
function FacilitatorAvatar({ item, facilitator }) {
  const mediaRecord = getSessionFacilitatorMedia(item, facilitator);
  const name = getName(mediaRecord || facilitator);
  return <div className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#e8f0e6] text-[#477051] shadow-[0_5px_16px_rgba(37,75,48,0.2)]" aria-label={`${name} profile image`}>
    {mediaRecord ? <div className="h-full w-full [&_.api-media-gallery]:!mb-0 [&_.api-media-gallery]:!h-full [&_.api-media-asset]:!h-full [&_.api-media-asset]:!rounded-none [&_.api-media-asset]:!border-0 [&_.api-media-asset]:!p-0 [&_.api-media-asset_img]:!h-full [&_.api-media-asset_img]:!w-full [&_.api-media-asset_img]:!max-h-none [&_.api-media-asset_img]:!aspect-auto [&_.api-media-asset_img]:!rounded-full [&_.api-media-asset_img]:!object-cover"><RecordMedia record={mediaRecord} compact imagesOnly /></div> : <UserRound size={21} strokeWidth={1.7} aria-hidden="true" />}
  </div>;
}
function SessionMedia({ item, label }) {
  const hasImage = recordMedia(item, { scope: "public", imagesOnly: true }).length > 0;
  return hasImage ? <CardMedia record={item} label={label} /> : <div className="relative flex aspect-[1.55] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#f5f8ef,#dcebe0)] text-[#3f7053]"><CalendarDays size={36} strokeWidth={1.2} /><span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">Session</span></div>;
}

function SessionCard({ item, facilitator }) {
  const title = text(item.title || item.name || item.label);
  if (!title) return null;
  const description = text(item.shortDescription || item.excerpt || item.description);
  const duration = item.durationMinutes ?? (typeof item.duration === "number" ? `${item.duration} min` : text(item.duration));
  return <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e1e9e1] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#bfd5c2] hover:shadow-[0_12px_28px_rgba(40,75,49,0.08)]"><div className="relative"><SessionMedia item={item} label={title} /><FacilitatorAvatar item={item} facilitator={facilitator} /></div><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#72917a]">Session</p><Price item={item} /></div><h3 className="mt-3 font-[Georgia,serif] text-2xl leading-tight text-[#203d2b]">{title}</h3>{description && <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6b796f]">{description}</p>}<div className="mt-auto flex flex-wrap gap-4 pt-5 text-xs text-[#68786d]">{text(item.mode) && <span>{text(item.mode)}</span>}{duration && <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{duration}{typeof item.durationMinutes === "number" ? " min" : ""}</span>}{text(item.timezone) && <span>{text(item.timezone)}</span>}</div>{item.slug && <Link href={`/sessions/${encodeURIComponent(item.slug)}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#315a48] px-4 text-sm font-semibold text-white transition hover:bg-[#254638]">View Session Details <ArrowRight size={16} /></Link>}</div></article>;
}

function CourseCard({ item }) {
  const title = text(item.title || item.name);
  if (!title) return null;
  const description = text(item.shortDescription || item.excerpt || item.description);
  const category = text(item.catalogs?.category || item.categoryName || item.category);
  const level = text(item.catalogs?.level || item.levelName || item.level);
  const lessonCount = item.lessonCount ?? (Array.isArray(item.lessons) ? item.lessons.length : null);
  const duration = text(item.duration || item.durationDays);
  return <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e1e9e1] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#bfd5c2] hover:shadow-[0_12px_28px_rgba(40,75,49,0.08)]"><CardMedia record={item} label={title} /><div className="flex flex-1 flex-col p-5"><div className="flex flex-wrap gap-2">{category && <span className="rounded-full bg-[#edf5eb] px-2.5 py-1 text-[10px] font-semibold text-[#477051]">{category}</span>}{level && <span className="rounded-full bg-[#f3f6f0] px-2.5 py-1 text-[10px] font-semibold text-[#6d7f70]">{level}</span>}</div><h3 className="mt-3 font-[Georgia,serif] text-2xl leading-tight text-[#203d2b]">{title}</h3>{description && <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6b796f]">{description}</p>}<div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5 text-xs text-[#68786d]">{lessonCount != null && <span className="inline-flex items-center gap-1.5"><BookOpen size={14} />{lessonCount} {Number(lessonCount) === 1 ? "lesson" : "lessons"}</span>}{duration && <span>{duration}</span>}<Price item={item} /></div>{item.slug && <Link href={`/courses/${encodeURIComponent(item.slug)}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#315a48] px-4 text-sm font-semibold text-[#315a48] transition hover:bg-[#f2f8f1]">View Course <ArrowRight size={16} /></Link>}</div></article>;
}

function ClassCard({ item }) {
  const title = text(item.title || item.name);
  if (!title) return null;
  const description = text(item.excerpt || item.shortDescription || item.description);
  const start = formatDateTime(eventStart(item), item.timezone);
  const end = formatDateTime(eventEnd(item), item.timezone);
  const type = text(item.classType || item.format || item.mode);
  const duration = text(item.duration);
  const level = text(item.level || item.levelName);
  const location = text(item.location || item.venue);
  const registrationStatus = text(item.registrationStatus || item.registration?.status);
  const availableSeats = typeof item.availableSeats === "number" ? item.availableSeats : null;
  return <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e1e9e1] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#bfd5c2] hover:shadow-[0_12px_28px_rgba(40,75,49,0.08)]"><CardMedia record={item} label={title} /><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#72917a]">{type || "Class & workshop"}</p><Price item={item} /></div><h3 className="mt-3 font-[Georgia,serif] text-2xl leading-tight text-[#203d2b]">{title}</h3>{description && <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6b796f]">{description}</p>}<dl className="mt-auto grid gap-2 pt-5 text-xs text-[#68786d]">{start && <div className="flex items-start gap-2"><CalendarDays size={14} className="mt-0.5 shrink-0 text-[#648a6d]" /><div><dt className="sr-only">Starts</dt><dd>{start}</dd></div></div>}{end && <div className="flex items-start gap-2"><Clock3 size={14} className="mt-0.5 shrink-0 text-[#648a6d]" /><div><dt className="sr-only">Ends</dt><dd>{end}</dd></div></div>}{duration && !end && <div>{duration}</div>}{location && <div>Location: {location}</div>}{level && <div>Level: {level}</div>}{registrationStatus && <div>Registration: {registrationStatus}</div>}{availableSeats != null && <div>{availableSeats} seats available</div>}</dl>{item.slug && <Link href={`/classes/${encodeURIComponent(item.slug)}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#315a48] px-4 text-sm font-semibold text-white transition hover:bg-[#254638]">View Details <ArrowRight size={16} /></Link>}</div></article>;
}

async function loadRelatedCatalogues() {
  const [sessions, courses, classes] = await Promise.all([allPublicItems("session-types"), allPublicItems("courses"), allPublicItems("classes")]);
  return { sessions, courses, classes };
}

export default function FacilitatorDetailPage({ person, catalogues }) {
  const name = getName(person);
  const shortBio = getShortBio(person);
  const biography = getBiography(person);
  const specializations = listValues(person.specializations);
  const languages = listValues(person.languages);
  const certifications = listValues(person.certifications);
  const location = [text(person.city), text(person.state), text(person.country)].filter(Boolean).join(", ");
  const hasDetails = Boolean(text(person.experience) || text(person.education) || languages.length || certifications.length);
  const mediaRecord = profileMediaRecord(person, name);
  const sessions = filterRelated(catalogues?.sessions, person, "session");
  const courses = filterRelated(catalogues?.courses, person, "course");
  const classes = filterRelated(catalogues?.classes, person, "class");
  const upcomingClasses = classes.items.filter(isCurrentOrUpcoming).sort(sortByStart);

  return <main className="min-h-screen bg-white text-[#263e30]"><div className="mx-auto max-w-6xl px-5 pb-16 pt-0 sm:px-8 sm:pt-0">
    <nav aria-label="Breadcrumb" className="hidden"><Link href="/" className="transition hover:text-[#28563e]">Home</Link><span aria-hidden="true">/</span><Link href="/facilitators" className="transition hover:text-[#28563e]">Facilitators</Link><span aria-hidden="true">/</span><span className="max-w-full truncate font-medium text-[#315a48]">{name}</span></nav>
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[linear-gradient(110deg,#f8fbf6_0%,#f1f6ee_54%,#e5eee4_100%)]" aria-labelledby="facilitator-name"><div className="grid items-center lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)]"><div className="relative z-10 min-w-0 px-7 py-12 sm:px-10 lg:px-14 lg:py-16"><h1 id="facilitator-name" className="max-w-2xl font-[Georgia,serif] text-4xl leading-[1.08] tracking-tight text-[#193b29] sm:text-6xl">{name}</h1>{shortBio && <p className="mt-5 max-w-xl whitespace-pre-line text-[15px] leading-8 text-[#68776d]">{shortBio}</p>}{specializations.length > 0 && <div className="mt-6"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#78927d]">Specializations</p><Tags values={specializations} /></div>}{location && <p className="mt-6 inline-flex items-center gap-2 text-xs text-[#6c7e71]"><MapPin size={15} className="text-[#63866b]" />{location}</p>}<div className="mt-8 flex flex-wrap gap-3"><a href="#sessions" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#72a37a] px-6 text-sm font-semibold !text-white shadow-[0_8px_20px_rgba(83,132,91,0.2)] transition hover:bg-[#5f9068] hover:!text-white">Explore Sessions <ArrowRight size={16} /></a><a href="#about" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#bfd6c1] bg-white/65 px-6 text-sm font-semibold text-[#315a48] transition hover:bg-white">About Facilitator</a></div><SocialLinks person={person} /></div><MediaFrame record={mediaRecord} label={name} className="min-h-[420px] rounded-none !bg-[#e5eee4] [&_.api-media-gallery]:!h-full [&_.api-media-asset]:!h-full [&_.api-media-asset]:!p-0 [&_.api-media-asset]:!border-0 [&_.api-media-asset]:!bg-transparent [&_.api-media-asset_img]:!h-full [&_.api-media-asset_img]:!max-h-none [&_.api-media-asset_img]:!aspect-auto [&_.api-media-asset_img]:!rounded-none [&_.api-media-asset_img]:!bg-transparent [&_.api-media-asset_img]:!object-contain [&_.api-media-asset_img]:!origin-bottom [&_.api-media-asset_img]:!scale-[0.86]" /></div></section>
    <FacilitatorSectionTabs>
      <section id="about" className="border-b border-[#e5ece4] py-10 sm:py-14" aria-labelledby="about-title"><header className="flex max-w-3xl flex-col gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#668b70]">About the facilitator</p><h2 id="about-title" className="font-[Georgia,serif] text-3xl leading-tight tracking-[-0.02em] text-[#203d2b] sm:text-4xl">A little more about {name}</h2><p className="max-w-2xl text-sm leading-7 text-[#68776d]">Explore the experience and practices this facilitator has chosen to share.</p></header><div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:gap-6"><div className="rounded-2xl border border-[#dfe9df] bg-[#f7faf5] p-6 shadow-[0_8px_24px_rgba(40,75,49,0.04)] sm:p-8"><div className="mb-5 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#28563e] text-xs font-bold text-white">01</span><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#668b70]">Practice &amp; perspective</span></div>{biography ? <p className="whitespace-pre-line text-[15px] leading-8 text-[#445b4c] sm:text-base">{biography}</p> : <p className="text-sm leading-7 text-[#69786e]">No additional biography has been published for this facilitator.</p>}{specializations.length > 0 && <div className="mt-7 border-t border-[#dfe9df] pt-6"><h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#315a48]"><Sparkles size={17} />Areas of specialization</h3><Tags values={specializations} /></div>}</div><aside className="rounded-2xl border border-[#dfe9df] bg-white p-6 shadow-[0_8px_24px_rgba(40,75,49,0.04)] sm:p-7" aria-label="Facilitator details"><div className="mb-5 flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#668b70]">At a glance</p><span className="h-2 w-2 rounded-full bg-[#7fa783]" aria-hidden="true" /></div><div><DetailBlock icon={BriefcaseBusiness} label="Experience" value={text(person.experience)} /><DetailBlock icon={GraduationCap} label="Education" value={text(person.education)} /><DetailBlock icon={Languages} label="Languages"><Tags values={languages} /></DetailBlock><DetailBlock icon={GraduationCap} label="Certifications"><Tags values={certifications} /></DetailBlock></div></aside></div></section>
      <section id="sessions" className="border-b border-[#e5ece4] py-14 sm:py-20" aria-labelledby="sessions-title"><header className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#668b70]">Private practice</p><h2 id="sessions-title" className="mt-2 font-[Georgia,serif] text-3xl leading-tight tracking-tight text-[#203d2b] sm:text-4xl">Sessions with this facilitator</h2><p className="mt-3 text-sm leading-7 text-[#68776d]">Choose a session to see its full details and available booking times.</p></header>{sessions.error || sessions.relationshipMissing || !sessions.items.length ? <CatalogMessage kind="session" error={sessions.error} relationshipMissing={sessions.relationshipMissing} emptyText="No published sessions are currently available for this facilitator." /> : <div className="mt-9 grid gap-5 md:grid-cols-2">{sessions.items.map((item) => <SessionCard key={recordIdentity(item)} item={item} facilitator={person} />)}</div>}</section>
      <section id="courses" className="border-b border-[#e5ece4] py-14 sm:py-20" aria-labelledby="courses-title"><header className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#668b70]">Learn at your pace</p><h2 id="courses-title" className="mt-2 font-[Georgia,serif] text-3xl leading-tight tracking-tight text-[#203d2b] sm:text-4xl">Courses with this facilitator</h2><p className="mt-3 text-sm leading-7 text-[#68776d]">Continue to a course detail page for its full curriculum and existing enrollment flow.</p></header>{courses.error || courses.relationshipMissing || !courses.items.length ? <CatalogMessage kind="course" error={courses.error} relationshipMissing={courses.relationshipMissing} emptyText="No published courses are currently available for this facilitator." /> : <div className="mt-9 grid gap-5 md:grid-cols-2">{courses.items.map((item) => <CourseCard key={recordIdentity(item)} item={item} />)}</div>}</section>
      <section id="classes" className="border-b border-[#e5ece4] py-14 sm:py-20" aria-labelledby="classes-title"><header className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#668b70]">Meet in practice</p><h2 id="classes-title" className="mt-2 font-[Georgia,serif] text-3xl leading-tight tracking-tight text-[#203d2b] sm:text-4xl">Classes &amp; workshops</h2><p className="mt-3 text-sm leading-7 text-[#68776d]">See current classes and workshops led by this facilitator.</p></header>{classes.error || classes.relationshipMissing || !upcomingClasses.length ? <CatalogMessage kind="class" error={classes.error} relationshipMissing={classes.relationshipMissing} emptyText="No upcoming classes or workshops are currently available for this facilitator." /> : <div className="mt-9 grid gap-5 md:grid-cols-2">{upcomingClasses.map((item) => <ClassCard key={recordIdentity(item)} item={item} />)}</div>}</section>
    </FacilitatorSectionTabs>
    <div className="pt-8"><Link href="/facilitators" className="inline-flex items-center gap-2 text-sm font-semibold text-[#315a48] transition hover:text-[#1c412e] hover:underline"><ArrowRight size={16} className="rotate-180" />Back to all facilitators</Link></div>
  </div></main>;
}

export async function loadFacilitatorPage(slug, { includeCatalogues = true } = {}) {
  const facilitatorResult = await publicApi(`facilitators/${encodeURIComponent(slug)}`);
  if (facilitatorResult?.status === 404 || (!facilitatorResult?.error && !facilitatorResult?.data)) return { facilitatorResult, person: null };
  const person = isRecord(facilitatorResult.data?.facilitator) ? facilitatorResult.data.facilitator : isRecord(facilitatorResult.data?.profile) ? facilitatorResult.data.profile : facilitatorResult.data;
  if (!isRecord(person)) return { facilitatorResult, person: null };
  const catalogues = includeCatalogues ? await loadRelatedCatalogues() : null;
  return { facilitatorResult, person, catalogues };
}
