"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Search, UserRound } from "lucide-react";
import { useState } from "react";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";

function valueOf(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") return value.displayName || value.name || value.title || value.label || "";
  return "";
}

function classTitle(item) {
  return item.title || item.name || "Class";
}

function classId(item) {
  return String(item.id || item._id || item.slug || "");
}

function facilitatorName(item) {
  return valueOf(item.facilitator?.displayName || item.facilitator?.name || item.facilitatorName) || "Unknown";
}

function dateValue(item) {
  return item.startsAt || item.startDate || item.date || "";
}

function dateTime(item) {
  const value = dateValue(item);
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function dateLabel(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "To be announced";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(timestamp));
}

function dateRange(item) {
  const start = dateLabel(dateValue(item));
  const end = item.endsAt || item.endDate;
  return end ? `${start} – ${dateLabel(end)}` : start;
}

function classMode(item) {
  const mode = String(item.mode || item.format || item.meetingType || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (["OFFLINE", "IN_PERSON", "INPERSON"].includes(mode)) return "Offline";
  if (mode === "HYBRID") return "Hybrid";
  if (["ONLINE", "VIRTUAL", "REMOTE"].includes(mode)) return "Online";
  return valueOf(item.mode || item.format || item.meetingType) || "Online";
}

function locationOf(item) {
  const location = valueOf(item.location || item.venue || item.city || item.address);
  if (location) return location;
  return classMode(item) === "Online" ? "Online" : "To be announced";
}

function imageRecord(item) {
  return {
    ...item,
    title: classTitle(item),
    imageAlt: item.imageAlt || item.altText || classTitle(item),
    thumbnail: item.thumbnail || item.thumbnailUrl || item.image || item.imageUrl || "",
    thumbnailMediaId: item.thumbnailMediaId || item.imageMediaId || "",
  };
}

function ClassCard({ item, index }) {
  const slug = item.slug;
  const href = slug ? `/classes/${encodeURIComponent(slug)}` : "#class-calendar";
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-[0_10px_28px_rgba(39,75,48,.07)] transition duration-200 hover:-translate-y-1 hover:border-[#b9d1bb] hover:shadow-[0_16px_34px_rgba(39,75,48,.12)]">
      <Link href={href} className="block" aria-label={`View ${classTitle(item)}`}>
        <div className="relative aspect-[1.7] overflow-hidden bg-[#e9f0e8] [&_.api-media-gallery]:absolute [&_.api-media-gallery]:inset-0 [&_.api-media-gallery]:m-0 [&_.api-media-gallery]:h-full [&_.api-media-asset]:h-full [&_.api-media-asset]:border-0 [&_.api-media-asset]:bg-transparent [&_.api-media-asset]:p-0 [&_img]:h-full [&_img]:!max-h-none [&_img]:rounded-none [&_img]:object-cover">
          <RecordMedia record={imageRecord(item)} compact imagesOnly priority={index < 3} />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#315a48] shadow-sm backdrop-blur">
            {item.kind === "WORKSHOP" ? "Workshop" : "Class"}
          </span>
        </div>
      </Link>
      <div className="p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#66836d]"><CalendarDays size={13} />{dateRange(item)}</p>
        <h3 className="mt-2 line-clamp-2 font-[Georgia,serif] text-xl leading-tight text-[#29473c]">{classTitle(item)}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#718078]"><UserRound size={13} />{facilitatorName(item)}</p>
        <Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#315a48] transition hover:text-[#1e4936]">
          View details <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function CalendarRow({ item }) {
  const href = item.slug ? `/classes/${encodeURIComponent(item.slug)}` : "#class-calendar";
  return (
    <tr className="border-t border-[#e8eee8] align-middle transition hover:bg-[#fbfdfb]">
      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#63776a]">{dateRange(item)}</td>
      <td className="min-w-[210px] px-4 py-4"><Link href={href} className="font-semibold text-[#29473c] hover:text-[#315a48] hover:underline">{classTitle(item)}</Link></td>
      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#63776a]">{facilitatorName(item)}</td>
      <td className="px-4 py-4 text-xs text-[#63776a]">{locationOf(item)}</td>
      <td className="whitespace-nowrap px-4 py-4"><span className="rounded-full bg-[#e7f4ec] px-2.5 py-1 text-[10px] font-bold text-[#3b7652]">{classMode(item)}</span></td>
      <td className="px-4 py-4 text-right"><Link href={href} className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#315a48] px-4 text-[11px] font-bold text-white shadow-[0_3px_0_#1d3c2d] transition hover:bg-[#254638]">View details</Link></td>
    </tr>
  );
}

export default function ClassesDirectory({ items = [], featuredItems = [] }) {
  const [facilitator, setFacilitator] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");
  const sorted = [...items].sort((a, b) => dateTime(a) - dateTime(b));
  const featured = featuredItems.length ? featuredItems : sorted.slice(0, 3);
  const facilitators = [...new Set(items.map(facilitatorName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const query = search.trim().toLowerCase();
  const filtered = sorted.filter((item) => {
    const matchesFacilitator = !facilitator || facilitatorName(item) === facilitator;
    const matchesClass = !selectedClass || classId(item) === selectedClass;
    const searchable = `${classTitle(item)} ${facilitatorName(item)} ${locationOf(item)} ${classMode(item)}`.toLowerCase();
    return matchesFacilitator && matchesClass && (!query || searchable.includes(query));
  });

  return (
    <>
      <section className="mt-8" aria-labelledby="upcoming-classes-title">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#6b8c75]">Learn, practice, grow</p>
          <h2 id="upcoming-classes-title" className="mt-2 font-[Georgia,serif] text-3xl text-[#29473c] sm:text-4xl">Upcoming Classes</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#718078]">Classes and events designed to meet you where you are.</p>
        </div>
        {featured.length ? <div className="mt-7 grid gap-5 md:grid-cols-3">{featured.map((item, index) => <ClassCard key={classId(item) || index} item={item} index={index} />)}</div> : <p className="mt-7 rounded-2xl border border-dashed border-[#cfded0] bg-white p-8 text-center text-sm text-[#718078]">No upcoming classes are available right now.</p>}
      </section>

      <section id="class-calendar" className="mt-16 scroll-mt-24" aria-labelledby="class-calendar-title">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#6b8c75]">Find your next practice</p>
          <h2 id="class-calendar-title" className="mt-2 font-[Georgia,serif] text-3xl text-[#29473c] sm:text-4xl">Class Calendar</h2>
          <p className="mt-2 text-xs text-[#718078]">Results: ({filtered.length} Found)</p>
        </div>

        <div className="mx-auto mt-7 max-w-5xl rounded-2xl border border-[#dfe8df] bg-white p-4 shadow-[0_8px_24px_rgba(39,75,48,.05)] sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(150px,.7fr)_minmax(210px,1.5fr)_minmax(190px,1fr)_auto] md:items-end">
            <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#66836d]">Facilitator<select value={facilitator} onChange={(event) => setFacilitator(event.target.value)} className="h-10 rounded-lg border border-[#d7e4d8] bg-white px-3 text-xs font-normal normal-case tracking-normal text-[#29473c] outline-none focus:border-[#315a48] focus:ring-2 focus:ring-[#315a48]/10"><option value="">All facilitators</option>{facilitators.map((name) => <option key={name}>{name}</option>)}</select></label>
            <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#66836d]">Select class<select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className="h-10 rounded-lg border border-[#d7e4d8] bg-white px-3 text-xs font-normal normal-case tracking-normal text-[#29473c] outline-none focus:border-[#315a48] focus:ring-2 focus:ring-[#315a48]/10"><option value="">— Select class —</option>{sorted.map((item, index) => <option key={classId(item) || index} value={classId(item)}>{classTitle(item)}</option>)}</select></label>
            <label className="relative grid gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#66836d]">Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search classes" className="h-10 rounded-lg border border-[#d7e4d8] bg-white pl-9 pr-3 text-xs font-normal normal-case tracking-normal text-[#29473c] outline-none placeholder:text-[#9aa99d] focus:border-[#315a48] focus:ring-2 focus:ring-[#315a48]/10" /><Search size={14} className="pointer-events-none absolute bottom-3 left-3 text-[#7e9582]" /></label>
            <button type="button" onClick={() => { setFacilitator(""); setSelectedClass(""); setSearch(""); }} className="h-10 rounded-lg border border-[#cbdccc] px-4 text-xs font-semibold text-[#315a48] transition hover:bg-[#f1f7f1]">Clear filters</button>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-[#e4ece4]">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead className="bg-[#315a48] text-[10px] font-bold uppercase tracking-[.08em] text-white"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Facilitator</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Format</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
              <tbody>{filtered.length ? filtered.map((item, index) => <CalendarRow key={classId(item) || index} item={item} />) : <tr><td colSpan="6" className="px-4 py-10 text-center text-sm text-[#718078]">No classes match these filters.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
