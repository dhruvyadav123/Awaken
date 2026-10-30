"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

function youtubeEmbed(url) {
  try {
    const parsed = new URL(url);
    let videoId = "";
    if (parsed.hostname === "youtu.be") videoId = parsed.pathname.slice(1).split("/")[0];
    if (parsed.hostname === "youtube.com" || parsed.hostname.endsWith(".youtube.com") || parsed.hostname === "youtube-nocookie.com") videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1` : "";
  } catch {
    return "";
  }
}

function vimeoEmbed(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("vimeo.com")) return "";
    const videoId = parsed.pathname.split("/").filter(Boolean).pop();
    return videoId && /^\d+$/.test(videoId) ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : "";
  } catch {
    return "";
  }
}

function mediaSource(demo, slug) {
  if (demo?.filePath) return { kind: "video", source: `/api/public/files/courses/${encodeURIComponent(slug)}/demo/file` };
  if (!demo?.url) return { kind: "error", source: "" };
  if (demo.source === "YOUTUBE") return { kind: "iframe", source: youtubeEmbed(demo.url) };
  if (demo.source === "VIMEO") return { kind: "iframe", source: vimeoEmbed(demo.url) };
  return { kind: "video", source: demo.url };
}

export default function CourseVideoModal({ demo, slug, title }) {
  const [open, setOpen] = useState(false);
  const source = mediaSource(demo, slug);

  if (open) return <div className="absolute inset-0 z-10 bg-black">
    <button type="button" onClick={() => setOpen(false)} aria-label="Close video" className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/90"><X size={20} /></button>
    {source.kind === "iframe" && source.source ? <iframe title={title} src={source.source} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : source.kind === "video" && source.source ? <video src={source.source} className="h-full w-full object-contain" controls autoPlay playsInline /> : <p className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">This course video is unavailable right now.</p>}
  </div>;

  return <button type="button" onClick={() => setOpen(true)} aria-label={`Play ${title}`} className="absolute inset-0 z-[1] flex items-center justify-center bg-black/5 transition hover:bg-black/15">
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5bd32] text-[#20233e] shadow-[0_10px_24px_rgba(155,110,12,0.25)] transition hover:scale-105">
      <Play size={32} fill="currentColor" strokeWidth={1.5} />
    </span>
  </button>;
}
