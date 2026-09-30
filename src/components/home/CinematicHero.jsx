"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", callback);
  navigator.connection?.addEventListener("change", callback);
  return () => {
    media.removeEventListener("change", callback);
    navigator.connection?.removeEventListener("change", callback);
  };
}
function getMotionPreference() {
  return !window.matchMedia(reducedMotionQuery).matches && !navigator.connection?.saveData;
}

export default function CinematicHero() {
  const heroRef = useRef(null);
  const introRef = useRef(null);
  const portraitRef = useRef(null);
  const videoRef = useRef(null);
  const motionAllowed = useSyncExternalStore(subscribeMotion, getMotionPreference, () => false);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const animate = motionAllowed && !paused && !failed && !autoplayBlocked;

  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!animate) { video.pause(); return; }
    let disposed = false;
    let inView = true;

    if (!video.getAttribute("src")) {
      video.src = "/videos/forest-desktop.mp4";
    }
    function syncPlayback() {
      if (disposed || !inView || document.hidden) { video.pause(); return; }
      video.play().catch(error => {
        if (!disposed && error.name === "NotAllowedError") setAutoplayBlocked(true);
      });
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      hero.dataset.inView = String(inView);
      syncPlayback();

    }, { threshold: 0 });
    observer.observe(hero);
    document.addEventListener("visibilitychange", syncPlayback);

    syncPlayback();
    return () => {
      disposed = true;
      video.pause();
      observer.disconnect();

      document.removeEventListener("visibilitychange", syncPlayback);

    };
  }, [animate]);

  useEffect(() => {
    const intro = introRef.current;
    const portrait = portraitRef.current;
    if (!intro || !portrait || !motionAllowed) return;

    let frame = 0;
    function updatePointer(event) {
      const bounds = intro.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        portrait.style.setProperty("--portrait-rotate-x", `${y * -5}deg`);
        portrait.style.setProperty("--portrait-rotate-y", `${x * 7}deg`);
        portrait.style.setProperty("--portrait-shift-x", `${x * 12}px`);
        portrait.style.setProperty("--portrait-shift-y", `${y * 8}px`);
        intro.style.setProperty("--light-x", `${58 + x * 14}%`);
        intro.style.setProperty("--light-y", `${44 + y * 10}%`);
      });
    }
    function resetPointer() {
      portrait.style.setProperty("--portrait-rotate-x", "0deg");
      portrait.style.setProperty("--portrait-rotate-y", "0deg");
      portrait.style.setProperty("--portrait-shift-x", "0px");
      portrait.style.setProperty("--portrait-shift-y", "0px");
    }
    function updateScroll() {
      const bounds = intro.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -bounds.top / Math.max(1, bounds.height)));
      intro.style.setProperty("--intro-scroll", `${progress * 28}px`);
    }
    intro.addEventListener("pointermove", updatePointer);
    intro.addEventListener("pointerleave", resetPointer);
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();
    return () => {
      cancelAnimationFrame(frame);
      intro.removeEventListener("pointermove", updatePointer);
      intro.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("scroll", updateScroll);
    };
  }, [motionAllowed]);
  function toggleMotion() {
    if (animate) { setPaused(true); return; }
    setPaused(false);
    setAutoplayBlocked(false);
    // A user gesture can unlock playback on browsers that restrict autoplay.
    videoRef.current?.play().catch(() => setAutoplayBlocked(true));
  }

  return <>
    <section ref={introRef} className="cinema-hero" aria-labelledby="cinema-title"><div className="cinema-depth-field" aria-hidden="true"><i/><i/><i/></div>
      <div className="cinema-layout">
        <div className="cinema-content">
          <p className="cinema-eyebrow">AWAKEN WITH MEHECK</p>
          <h1 id="cinema-title"><span>Come back</span><span>to <em>yourself.</em></span></h1>
          <p className="cinema-description">A little space to pause, reconnect, and grow. Explore mindful practices and meaningful conversations, with Meheck by your side.</p>
          <div className="cinema-actions">
            <Link href="#explore" className="cinema-primary">Find your practice <span aria-hidden="true">↗</span></Link>
            <Link href="/about" className="cinema-story">Meet Meheck <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="cinema-note">At your pace. In your own way.</p>
        </div>
        <div ref={portraitRef} className="cinema-portrait">
          <span className="cinema-portrait-plane plane-one" aria-hidden="true" />
          <span className="cinema-portrait-plane plane-two" aria-hidden="true" />
          <div className="cinema-portrait-image"><Image src="/images/hero/meheck.png" alt="Meheck leaning on a railing, wearing a yellow and blue sari" fill sizes="(max-width: 760px) 100vw, 50vw" preload /></div>
          <span className="cinema-portrait-shadow" aria-hidden="true" />
          <p className="cinema-portrait-caption"><small>YOUR GUIDE</small><span>Meheck</span></p>
        </div>
      </div>
    </section>
    <section ref={heroRef} className="cinema-nature" aria-label="A quiet moment in nature" data-playing={playing}>
      <video ref={videoRef} className="cinema-video" muted loop playsInline preload="none" poster="/videos/forest-source-frame.jpg" aria-hidden="true" tabIndex={-1} disablePictureInPicture onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} />
      <div className="cinema-nature-shade" aria-hidden="true" />
      <div className="cinema-nature-copy"><p className="cinema-eyebrow">A MOMENT OF STILLNESS</p><h2>Slow down.<br /><em>Just be here.</em></h2></div>
      {motionAllowed && !failed && <button className="cinema-control" type="button" onClick={toggleMotion} aria-label={animate ? "Pause nature video" : "Play nature video"} aria-pressed={!animate}><span aria-hidden="true">{animate ? "Ⅱ" : "▷"}</span>{animate ? "Pause video" : "Play video"}</button>}
    </section>
  </>;
}


