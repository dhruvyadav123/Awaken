"use client";

import { useEffect, useRef, useState } from "react";

export default function AmbientVideo({ src, eyebrow, title, description, objectPosition = "center" }) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;

    function sync() {
      if (!visible || document.hidden || paused || reducedMotion.matches) {
        video.pause();
        return;
      }
      video.play().catch(() => setPaused(true));
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !video.src) {
        video.src = src;
        video.load();
        setReady(true);
      }
      sync();
    }, { rootMargin: "240px 0px", threshold: 0.05 });

    observer.observe(section);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
      video.pause();
    };
  }, [paused, src]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setPaused(false);
      video.play().catch(() => setPaused(true));
    } else {
      setPaused(true);
      video.pause();
    }
  }

  return (
    <section ref={sectionRef} className="relative isolate min-h-[420px] overflow-hidden bg-[#27372f] text-white sm:min-h-[500px]" aria-label={title}>
      <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready && !failed ? "opacity-100" : "opacity-0"}`} style={{ objectPosition }} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} disablePictureInPicture onCanPlay={() => setReady(true)} onError={() => setFailed(true)} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,35,28,.78)_0%,rgba(24,38,31,.48)_48%,rgba(18,30,25,.2)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(13,23,18,.34),transparent_60%)]" />
      <div className="relative z-10 mx-auto flex min-h-[420px] w-full max-w-[1440px] items-center px-5 py-16 sm:min-h-[500px] sm:px-8 lg:px-14 xl:px-20">
        <div className="max-w-[660px]">
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[.38em] text-[#d8e3d2]">{eyebrow}</p>
          <h2 className="max-w-[640px] font-serif text-[42px] leading-[1.04] tracking-[-.035em] text-white sm:text-[56px] lg:text-[68px]">{title}</h2>
          <p className="mt-6 max-w-[540px] text-sm leading-7 text-white/80 sm:text-base sm:leading-8">{description}</p>
        </div>
      </div>
      {!failed ? <button type="button" onClick={togglePlayback} className="absolute right-5 bottom-5 z-20 inline-flex min-h-11 items-center gap-3 rounded-full border border-white/35 bg-[#1f3128]/70 px-4 text-[11px] font-semibold text-white backdrop-blur-md transition hover:bg-[#1f3128] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:right-8 sm:bottom-8" aria-label={paused ? "Play background video" : "Pause background video"}><span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>{paused ? "Play" : "Pause"}</button> : null}
    </section>
  );
}