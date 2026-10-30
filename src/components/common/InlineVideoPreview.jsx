"use client";

import { useState } from "react";
import { useEffect } from "react";

function sourceUrl(value) {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  const markdownUrls = Array.from(raw.matchAll(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi), (match) => match[1]);
  const plainUrls = raw.match(/https?:\/\/[^\s)\]]+/gi) || [];
  const urls = [...new Set([...markdownUrls, ...plainUrls])];
  const youtube = urls.find((url) => /(?:youtube\.com|youtube-nocookie\.com|youtu\.be)\//i.test(url));
  return youtube || urls[0] || raw;
}

function youtubeEmbedUrl(value) {
  const candidate = sourceUrl(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] || "";
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] || "";
    }
    return /^[A-Za-z0-9_-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0&playsinline=1&controls=1` : null;
  } catch {
    return null;
  }
}

function youtubeThumbnail(value) {
  const embed = youtubeEmbedUrl(value);
  const id = embed?.match(/embed\/([^?]+)/)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

function directVideoUrl(value) {
  return /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(value || "") || /\/api\/public\/files\/media\/[^/]+\/file(?:[?#].*)?$/i.test(value || "");
}

export default function InlineVideoPreview({ src, poster, title, alt = "Meheck Mukherjee" }) {
  const [playing, setPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const videoSource = sourceUrl(src);
  const embedUrl = youtubeEmbedUrl(videoSource);
  const thumbnail = poster || youtubeThumbnail(videoSource);
  const thumbnailSource = thumbnailFailed ? youtubeThumbnail(videoSource) || "" : thumbnail;
  const isDirectVideo = directVideoUrl(videoSource);
  const playable = Boolean(embedUrl || isDirectVideo);

  useEffect(() => {
    if (!playing) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setPlaying(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [playing]);

  return <>
    <div className="relative h-full min-h-[420px] w-full overflow-hidden bg-[#dfe8dc]">
      {!playing ? <>
        {thumbnailSource ? <img src={thumbnailSource} alt={alt} className="h-full w-full object-cover object-center" loading="eager" referrerPolicy="no-referrer" onError={() => setThumbnailFailed(true)} /> : <div className="h-full w-full bg-[#dfe8dc]" />}
        {playable ? <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 grid place-items-center" aria-label={`Play ${title}`}>
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-[#29473c] shadow-[0_8px_25px_rgba(31,46,35,.25)] transition-transform group-hover:scale-110"><span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[15px] border-y-transparent border-l-[#29473c]" /></span>
        </button> : null}
      </> : <div className="relative h-full min-h-[420px] w-full bg-black">
        <button type="button" onClick={() => setPlaying(false)} className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/70 text-xl leading-none text-white transition hover:bg-black/90" aria-label="Close video" title="Close video">×</button>
        {embedUrl && <iframe className="h-full min-h-[420px] w-full" src={embedUrl} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
        {!embedUrl && isDirectVideo && <video className="h-full min-h-[420px] w-full object-contain" src={videoSource} controls autoPlay playsInline />}
        {!embedUrl && !isDirectVideo && <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 bg-[#eef4ed] px-6 text-center text-[#315a48]"><p className="text-sm">This link is not a playable video URL.</p><a href={videoSource} target="_blank" rel="noreferrer" className="rounded-lg bg-[#315a48] px-4 py-2 text-sm font-semibold text-white">Open video link</a></div>}
      </div>}
    </div>
  </>;
}
