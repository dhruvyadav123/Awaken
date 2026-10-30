"use client";

/* eslint-disable @next/next/no-img-element -- YouTube thumbnails are remote and intentionally not optimized through Next. */
import { Play } from "lucide-react";
import { useState } from "react";

export default function MediaGallery({ videos }) {
  const [playingId, setPlayingId] = useState("");

  return (
    <section aria-labelledby="media-gallery-title" className="mt-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">Media</p>
          <h2 id="media-gallery-title" className="mt-2 font-[Georgia,serif] text-3xl text-[#203d2b] sm:text-4xl">Watch and explore</h2>
        </div>
        <span className="hidden text-sm text-[#758178] sm:block">{videos.length} videos</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((video) => (
          <article
            key={video.id}
            className="overflow-hidden rounded-xl bg-[#17251e] shadow-[0_7px_22px_rgba(41,71,60,0.14)] ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(41,71,60,0.22)]"
          >
            {playingId === video.id ? <div className="relative aspect-video bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0&autoplay=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              <button type="button" onClick={() => setPlayingId("")} className="absolute right-2 top-2 rounded-md bg-black/75 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black" aria-label={`Close ${video.title}`}>Close</button>
            </div> : <button
              type="button"
              onClick={() => setPlayingId(video.id)}
              className="group relative block aspect-video w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
              aria-label={`Play ${video.title} on YouTube`}
            >
              <img
                src={video.thumbnail}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/20" aria-hidden="true" />
              <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
                <span className="grid h-14 w-20 place-items-center rounded-[18px] bg-[#ff0033] shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-200 group-hover:scale-110">
                  <Play size={27} fill="white" strokeWidth={0} className="ml-1 text-white" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold text-white">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[#ff0033]" aria-hidden="true">
                  <Play size={10} fill="currentColor" strokeWidth={0} className="ml-px" />
                </span>
                <span className="truncate">Watch on YouTube</span>
              </span>
            </button>}
          </article>
        ))}
      </div>
    </section>
  );
}
