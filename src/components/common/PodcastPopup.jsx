"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const videoUrl = "https://www.youtube.com/watch?v=daLq4PSx_GQ";
const seenKey = "awm-featured-podcast-seen";

export default function PodcastPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(seenKey)) return;
    } catch {
      // Keep the featured link available when browser storage is disabled.
    }
    const timer = window.setTimeout(() => {
      try { window.sessionStorage.setItem(seenKey, "1"); } catch {}
      setIsOpen(true);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return createPortal(
    <aside className="podcast-popup" aria-label="Featured video podcast">
      <button className="podcast-popup-close" type="button" onClick={dismiss} aria-label="Close podcast popup">×</button>
      <div className="podcast-popup-preview" role="img" aria-label="Video podcast preview">
        <span className="podcast-popup-play" aria-hidden="true">▶</span>
        <span className="podcast-popup-duration">VIDEO PODCAST</span>
      </div>
      <div className="podcast-popup-copy">
        <p className="podcast-popup-eyebrow">A moment for you</p>
        <h2>Pause. Listen. Come back to yourself.</h2>
        <p>Take a little time with this video podcast from Awaken With Me.</p>
        <div className="podcast-popup-actions">
          <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="podcast-watch-link" onClick={dismiss}>Watch now <span aria-hidden="true">↗</span></a>
          <button type="button" className="podcast-later-button" onClick={dismiss}>Later</button>
        </div>
      </div>
    </aside>,
    document.body,
  );
}