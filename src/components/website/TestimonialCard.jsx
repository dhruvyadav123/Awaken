"use client";

import { useState } from "react";

function validUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return "";
  return value;
}

function videoUrlFor(story) {
  return validUrl(story.videoUrl || story.video || story.videoLink);
}

function youtubeInfo(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] || "";
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] || "";
    }
    if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
    return {
      embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
}

function directVideoUrl(value) {
  return /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(value || "");
}

function imageUrlFor(story) {
  const mediaId = story.imageMediaId || story.thumbnailMediaId;
  if (typeof mediaId === "string" && /^[a-f\d]{24}$/i.test(mediaId)) {
    return `/api/public/files/media/${encodeURIComponent(mediaId)}/file`;
  }
  return validUrl(story.imageUrl || story.thumbnailUrl || story.image || story.thumbnail);
}

function initialsFor(story) {
  const name = story.personName || story.authorName || story.title || "Community story";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function PreviewArt({ story, videoUrl, youtube }) {
  const imageUrl = youtube?.thumbnail || imageUrlFor(story);
  if (imageUrl) return <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />;
  if (videoUrl && directVideoUrl(videoUrl)) return <video src={videoUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" aria-hidden="true" />;
  return <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#dbe9df,#f1f5ef)] px-4 text-center text-[#55725d]"><span className="text-xs font-semibold uppercase tracking-[.18em]">Video testimonial</span><span className="text-xs">Preview will open when you play</span></div>;
}

export default function TestimonialCard({ story, publishedLabel }) {
  const [playing, setPlaying] = useState(false);
  const videoUrl = videoUrlFor(story);
  const youtube = youtubeInfo(videoUrl);
  const text = story.excerpt || story.quote || story.content || story.description || story.story || null;
  const isVideo = story.testimonialType === "VIDEO";
  const title = story.title || story.name || "Community story";
  const personName = story.personName || story.authorName || title;
  const canPlay = Boolean(videoUrl);

  return <>
    <article className="overflow-hidden rounded-2xl border border-[#e2e9e3] bg-white shadow-[0_7px_22px_rgba(41,71,60,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(41,71,60,0.1)]">
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#dce9dd] text-sm font-semibold text-[#315a48]">{initialsFor(story)}</div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-[#162c25]">{personName}</h2>
          <p className="mt-0.5 truncate text-xs text-[#758178]">{title}</p>
        </div>
      </div>
      {isVideo ? <button type="button" onClick={() => canPlay && setPlaying(true)} disabled={!canPlay} className={`group relative mx-4 mt-2 block aspect-video w-[calc(100%-2rem)] overflow-hidden rounded-xl bg-[#0e1713] text-left ${canPlay ? "cursor-pointer" : "cursor-default"}`} aria-label={canPlay ? `Play ${title}` : "Video preview unavailable"}>
        <PreviewArt story={story} videoUrl={videoUrl} youtube={youtube} />
        <span className={`absolute inset-0 flex items-center justify-center ${canPlay ? "bg-black/10 transition group-hover:bg-black/20" : ""}`}>
          <span className={`drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] ${canPlay ? "transition group-hover:scale-110" : "opacity-60"}`}><span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[15px] border-y-transparent border-l-white" /></span>
        </span>
      </button> : <div className="mx-4 rounded-xl bg-[#f3f7f1] px-4 py-5 text-sm leading-7 text-[#647368]">{text || "Testimonial shared by this community member."}</div>}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="rounded-full bg-[#eef4ed] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-[#55725d]">{isVideo ? "Video" : "Text"}</span>
        {publishedLabel && <time className="text-xs text-[#738075]">{publishedLabel}</time>}
      </div>
    </article>
    {playing && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#102018]/80 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => { if (event.target === event.currentTarget) setPlaying(false); }}>
      <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl">
        <button type="button" onClick={() => setPlaying(false)} className="absolute right-3 top-3 z-10 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/85">Close</button>
        {youtube && <iframe className="aspect-video w-full" src={youtube.embed} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
        {!youtube && directVideoUrl(videoUrl) && <video className="aspect-video w-full" src={videoUrl} controls autoPlay playsInline />}
        {!youtube && !directVideoUrl(videoUrl) && <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-[#eef4ed] px-6 text-center text-[#315a48]"><p className="text-sm">This link is not a playable video URL.</p><a href={videoUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-[#315a48] px-4 py-2 text-sm font-semibold text-white">Open video link</a></div>}
      </div>
    </div>}
  </>;
}
