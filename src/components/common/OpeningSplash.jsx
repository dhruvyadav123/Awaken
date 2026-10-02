'use client';

import { useEffect, useRef, useState } from 'react';
import './OpeningSplash.css';

const SPLASH_EXIT_AT = 4100;
const SPLASH_REMOVE_AT = 4900;

export default function OpeningSplash() {
  const videoRef = useRef(null);

  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      const playPromise = video.play();

      if (playPromise?.catch) {
        playPromise.catch(() => {
          // Poster/image fallback remains visible.
        });
      }
    }

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, SPLASH_EXIT_AT);

    const removeTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, SPLASH_REMOVE_AT);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <section
      className={[
        'awaken-opening',
        videoReady ? 'awaken-opening--video-ready' : '',
        videoFailed ? 'awaken-opening--video-failed' : '',
        isExiting ? 'awaken-opening--exit' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-label="Awaken is opening"
    >
      {/* =====================================================
          CINEMATIC MORNING SCENE
      ====================================================== */}
      <div className="awaken-scene" aria-hidden="true">
        {/* Permanent image fallback */}
        <div className="awaken-scene__poster" />

        {/* Real flowing river video */}
        {!videoFailed && (
          <video
            ref={videoRef}
            className="awaken-scene__video"
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            poster="/images/awaken-morning-river.webp"
            onCanPlay={() => setVideoReady(true)}
            onPlaying={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
          >
            <source
              src="/videos/awaken-morning-river.mp4"
              type="video/mp4"
            />
          </video>
        )}

        {/* Morning atmosphere */}
        <div className="awaken-scene__sky" />

        <MorningSun />

        <div className="awaken-scene__light-rays" />

        {/* Mountain/river atmosphere */}
        <div className="awaken-mist awaken-mist--far" />
        <div className="awaken-mist awaken-mist--left" />
        <div className="awaken-mist awaken-mist--right" />

        {/* River light enhancement */}
        <RiverReflection />

        {/* Subtle foreground depth */}
        <div className="awaken-scene__foreground awaken-scene__foreground--left" />
        <div className="awaken-scene__foreground awaken-scene__foreground--right" />

        {/* Cinematic grading */}
        <div className="awaken-scene__warm-grade" />
        <div className="awaken-scene__vignette" />
      </div>

      {/* =====================================================
          BIRDS
      ====================================================== */}
      <div className="awaken-bird-field" aria-hidden="true">
        <Bird className="awaken-bird--1" />
        <Bird className="awaken-bird--2" />
        <Bird className="awaken-bird--3" />
        <Bird className="awaken-bird--4" />
        <Bird className="awaken-bird--5" />
        <Bird className="awaken-bird--6" />
      </div>

      {/* =====================================================
          FLOATING FLOWER PETALS
      ====================================================== */}
      <div className="awaken-petals" aria-hidden="true">
        <Petal className="awaken-petal--1" />
        <Petal className="awaken-petal--2" />
        <Petal className="awaken-petal--3" />
        <Petal className="awaken-petal--4" />
        <Petal className="awaken-petal--5" />
        <Petal className="awaken-petal--6" />
      </div>

      {/* =====================================================
          BRAND CONTENT
      ====================================================== */}
      <div className="awaken-opening__content">
        <AwakenFlower />

        <div className="awaken-opening__copy">
          <p className="awaken-opening__eyebrow">
            BEGIN FROM WITHIN
          </p>

          <h1 className="awaken-opening__title">
            Awaken
          </h1>

          <div className="awaken-opening__tagline">
            <span>Breathe</span>
            <i />
            <span>Heal</span>
            <i />
            <span>Evolve</span>
          </div>
        </div>

        <div
          className="awaken-opening__loader"
          aria-hidden="true"
        >
          <span />
        </div>

        <p className="awaken-opening__loading-copy">
          Awakening your space
          <span className="awaken-opening__dots">
            ...
          </span>
        </p>
      </div>

      {/* =====================================================
          BOTTOM SIGNATURE
      ====================================================== */}
      <footer
        className="awaken-opening__footer"
        aria-hidden="true"
      >
        <span className="awaken-opening__footer-line" />

        <div className="awaken-opening__footer-mark">
          <span />
        </div>

        <p>A brighter you begins within</p>

        <div className="awaken-opening__footer-mark">
          <span />
        </div>

        <span className="awaken-opening__footer-line" />
      </footer>
    </section>
  );
}

/* =========================================================
   MORNING SUN
========================================================= */

function MorningSun() {
  return (
    <div className="awaken-sun">
      <div className="awaken-sun__halo awaken-sun__halo--outer" />
      <div className="awaken-sun__halo awaken-sun__halo--middle" />
      <div className="awaken-sun__halo awaken-sun__halo--inner" />
      <div className="awaken-sun__core" />
    </div>
  );
}

/* =========================================================
   RIVER REFLECTION
========================================================= */

function RiverReflection() {
  return (
    <div className="awaken-river">
      <div className="awaken-river__sun-path" />

      <span className="awaken-river__wave awaken-river__wave--1" />
      <span className="awaken-river__wave awaken-river__wave--2" />
      <span className="awaken-river__wave awaken-river__wave--3" />
      <span className="awaken-river__wave awaken-river__wave--4" />
      <span className="awaken-river__wave awaken-river__wave--5" />

      <div className="awaken-river__sparkles">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

/* =========================================================
   FLOWER / LOTUS BRAND
========================================================= */

function AwakenFlower() {
  return (
    <div className="awaken-flower" aria-hidden="true">
      <div className="awaken-flower__halo" />
      <div className="awaken-flower__halo awaken-flower__halo--inner" />

      <svg
        className="awaken-flower__svg"
        viewBox="0 0 200 165"
      >
        <defs>
          <linearGradient
            id="awakenPetalCenter"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#f8d19d" />
            <stop offset="48%" stopColor="#e4a467" />
            <stop offset="100%" stopColor="#bf7744" />
          </linearGradient>

          <linearGradient
            id="awakenPetalSoft"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#f0c397" />
            <stop offset="100%" stopColor="#cb8859" />
          </linearGradient>

          <linearGradient
            id="awakenLeaf"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#bdc2a3" />
            <stop offset="100%" stopColor="#7c856a" />
          </linearGradient>
        </defs>

        {/* center */}
        <path
          d="M100 100C72 76 73 40 100 10C127 40 128 76 100 100Z"
          fill="url(#awakenPetalCenter)"
        />

        {/* inner petals */}
        <path
          d="M87 105C56 98 40 74 45 44C74 52 91 74 87 105Z"
          fill="url(#awakenPetalSoft)"
        />

        <path
          d="M113 105C144 98 160 74 155 44C126 52 109 74 113 105Z"
          fill="#e8b181"
        />

        {/* lower petals */}
        <path
          d="M80 111C50 118 27 106 14 82C46 74 70 85 80 111Z"
          fill="url(#awakenLeaf)"
        />

        <path
          d="M120 111C150 118 173 106 186 82C154 74 130 85 120 111Z"
          fill="#aeb595"
        />

        {/* stem */}
        <path
          d="M100 99V149"
          fill="none"
          stroke="#9e6942"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <circle
          cx="100"
          cy="113"
          r="4"
          fill="#a66e43"
        />
      </svg>

      <span className="awaken-flower__star" />
      <span className="awaken-flower__spark awaken-flower__spark--1" />
      <span className="awaken-flower__spark awaken-flower__spark--2" />
    </div>
  );
}

/* =========================================================
   BIRD
========================================================= */

function Bird({ className = '' }) {
  return (
    <span className={`awaken-bird ${className}`}>
      <i className="awaken-bird__wing awaken-bird__wing--left" />
      <i className="awaken-bird__wing awaken-bird__wing--right" />
    </span>
  );
}

/* =========================================================
   PETAL
========================================================= */

function Petal({ className = '' }) {
  return (
    <span className={`awaken-petal ${className}`}>
      <i />
    </span>
  );
}
