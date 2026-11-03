
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const reflections = [
  {
    quote:
      "You always have a CHOICE! And after making a choice, you still have a choice!",
    author: "Meheck Mukherjee",
  },
  {
    quote:
      "The mind is not your enemy - it is just trying to keep you safe.\nThe heart is not your friend - it is just fond of healing.",
    author: "Meheck Mukherjee",
  },
  {
    quote:
      "As I live every moment\nBe willing to Receive Everything\nAs I die every moment\nBe willing to let go everything!",
    title: "You are a Gift",
    author: "Meheck Mukherjee",
  },
  {
    quote:
      "You are unwilling to see the truth, because the truth will set you free!",
    title: "Choices and Voices of Children",
    author: "Meheck Mukherjee",
  },
  {
    quote:
      "Every molecule of the Universe conspires in my Favour",
    author: "Meheck Mukherjee",
  },
];

const ROTATION_INTERVAL = 7500;

function LotusIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <g
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M32 47C19 35 20 23 32 8C44 23 45 35 32 47Z" />
        <path d="M32 47C17 44 10 34 11 20C25 24 32 33 32 47Z" />
        <path d="M32 47C47 44 54 34 53 20C39 24 32 33 32 47Z" />
        <path d="M32 47C19 54 9 50 4 40C18 37 27 39 32 47Z" />
        <path d="M32 47C45 54 55 50 60 40C46 37 37 39 32 47Z" />
        <path d="M13 55C24 59 40 59 51 55" />
      </g>
    </svg>
  );
}

function HeadingUnderline() {
  return (
    <svg
      viewBox="0 0 260 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="awh-heading-underline"
    >
      <path
        d="M5 19C77 -3 175 -2 255 19"
        stroke="#93AB84"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReflectionContent({ reflection }) {
  return (
    <div className="awh-reflection-copy">
      <blockquote>
        <p className="awh-reflection-quote">
          <span aria-hidden="true" className="awh-quote-mark">
            &ldquo;
          </span>

          {reflection.quote}

          <span aria-hidden="true" className="awh-quote-mark">
            &rdquo;
          </span>
        </p>
      </blockquote>

      {reflection.title && (
        <p className="awh-reflection-title">
          {reflection.title}
        </p>
      )}

      <p className="awh-reflection-author">
        — {reflection.author}
      </p>
    </div>
  );
}

export default function CinematicHero() {
  const [reflectionIndex, setReflectionIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const updateMotion = () => {
      setReduceMotion(media.matches);
    };

    updateMotion();

    media.addEventListener("change", updateMotion);

    return () => {
      media.removeEventListener("change", updateMotion);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setReflectionIndex(
        (current) => (current + 1) % reflections.length
      );
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const changeReflection = (direction) => {
    setReflectionIndex(
      (current) =>
        (current + direction + reflections.length) %
        reflections.length
    );
  };

  return (
    <section
      className="awh-cinematic-hero"
      aria-labelledby="awh-cinema-title"
    >
      <div className="awh-hero-inner">

        {/* LEFT CONTENT */}
        <div className="awh-hero-content">

          {/* Branding */}
          <Link
            href="/"
            className="awh-hero-brand"
            aria-label="Awaken With Meheck Home"
          >
            <LotusIcon className="awh-brand-icon" />

            <span>AwakenWithMeheck</span>
          </Link>

          {/* Reflection section — no card */}
          <div
            className="awh-hero-reflections"
            role="group"
            aria-label="Reflections by Meheck Mukherjee"
          >
            <div className="awh-reflection-label">
              <span className="awh-small-line" />

              <span>WORDS TO CARRY WITH YOU</span>

              <span className="awh-small-line" />
            </div>

            <div
              className="awh-reflection-stage"
              aria-live="off"
            >
              <div key={reflectionIndex} className="awh-reflection-slide">
                <ReflectionContent
                  reflection={reflections[reflectionIndex]}
                />
              </div>
            </div>

            <div className="awh-reflection-controls">
              <span className="awh-reflection-count">
                {String(reflectionIndex + 1).padStart(2, "0")}
                <span> / </span>
                {String(reflections.length).padStart(2, "0")}
              </span>

              <div className="awh-reflection-buttons">
                <button
                  type="button"
                  aria-label="Previous reflection"
                  onClick={() => changeReflection(-1)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19 12H5m7 7-7-7 7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  aria-label="Next reflection"
                  onClick={() => changeReflection(1)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="awh-hero-heading-wrap">
            <h1
              id="awh-cinema-title"
              className="awh-hero-heading"
            >
              <span>Come back</span>

              <span>
                to <em>yourself.</em>
              </span>
            </h1>

            <HeadingUnderline />
          </div>

          {/* Description */}
          <p className="awh-hero-description">
            A little space to pause, reconnect, and grow.
            Explore mindful practices and meaningful
            conversations, with Meheck by your side.
          </p>

          {/* Buttons */}
          <div className="awh-hero-actions">
            <Link
              href="/meditations"
              className="awh-hero-primary"
              style={{ color: "#FFFFFF" }}
            >
              <span>Find your practice</span>
              <span aria-hidden="true">↗</span>
            </Link>

            <Link
              href="/about"
              className="awh-hero-secondary"
            >
              <span>Meet Meheck</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        {/* PORTRAIT — no separate background */}
        <div className="awh-hero-portrait">
          <Image
            src="/images/hero/meheck.png"
            alt="Meheck Mukherjee"
            fill
            priority
            quality={90}
            sizes="(max-width: 850px) 100vw, 54vw"
            className="awh-portrait-image"
          />
        </div>

      </div>

      <style>{`
        .awh-cinematic-hero,
        .awh-cinematic-hero * {
          box-sizing: border-box;
        }

        /* Same background as TransformationQuote */
        .awh-cinematic-hero {
          position: relative;
          isolation: isolate;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #fafbf8;
          color: #244b36;
        }

        .awh-hero-inner {
          position: relative;
          width: 100%;
          max-width: 1500px;
          min-height: 710px;
          margin: 0 auto;
          padding: 32px clamp(24px, 5vw, 76px) 68px;
          background: transparent;
        }

        .awh-hero-content {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 56%;
          max-width: 685px;
          min-width: 0;
        }

        /* BRAND */
        .awh-hero-brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          color: #244b36;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(22px, 2.25vw, 32px);
          font-weight: 600;
          letter-spacing: -0.045em;
          line-height: 1.2;
          white-space: nowrap;
          text-decoration: none;
        }

        .awh-hero-brand:hover {
          color: #315a48;
        }

        .awh-brand-icon {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          color: #587a64;
        }

        /* REFLECTIONS */
        .awh-hero-reflections {
          width: 100%;
          max-width: 625px;
          margin-top: 43px;
          background: transparent;
        }

        .awh-reflection-label {
          display: flex;
          align-items: center;
          gap: 13px;
          color: #315a48;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          white-space: nowrap;
        }

        .awh-small-line {
          display: block;
          width: 34px;
          height: 1px;
          flex-shrink: 0;
          background: #a9bca9;
        }

        .awh-reflection-stage {
          width: 100%;
          min-height: 200px;
          margin-top: 17px;
          background: transparent;
        }

        .awh-reflection-slide {
          width: 100%;
          animation: awhReflectionEnter 560ms ease-out both;
        }

        .awh-reflection-quote {
          margin: 0;
          color: #28503c;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(18px, 1.8vw, 25px);
          font-style: italic;
          font-weight: 500;
          line-height: 1.48;
          letter-spacing: -0.012em;
          white-space: pre-line;
          overflow-wrap: anywhere;
        }

        .awh-quote-mark {
          display: inline;
          color: #50795d;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.08em;
        }

        .awh-reflection-title {
          margin: 11px 0 0;
          color: #738575;
          font-size: 12px;
          font-style: italic;
          line-height: 1.5;
        }

        .awh-reflection-author {
          margin: 13px 0 0;
          color: #426750;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 14px;
          font-style: italic;
          line-height: 1.5;
        }

        .awh-reflection-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 560px;
          margin-top: 3px;
        }

        .awh-reflection-count {
          color: #315a48;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.07em;
          font-variant-numeric: tabular-nums;
        }

        .awh-reflection-count span {
          color: #a0b0a2;
          font-weight: 400;
        }

        .awh-reflection-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .awh-reflection-buttons button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 35px;
          height: 35px;
          padding: 6px;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: #315a48;
          cursor: pointer;
          transition: background 200ms, color 200ms;
        }

        .awh-reflection-buttons button:hover {
          background: #315a48;
          color: #fff;
        }

        .awh-reflection-buttons svg {
          width: 19px;
          height: 19px;
        }

        /* MAIN HEADING */
        .awh-hero-heading-wrap {
          margin-top: 27px;
        }

        .awh-hero-heading {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin: 0;
          color: #173e2c;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(50px, 5.6vw, 86px);
          font-weight: 500;
          letter-spacing: -0.065em;
          line-height: 1.045;
        }

        .awh-hero-heading span {
          display: block;
        }

        .awh-hero-heading em {
          color: #688958;
          font-weight: 400;
          font-style: italic;
        }

        .awh-heading-underline {
          display: block;
          width: 200px;
          height: 22px;
          margin: 8px 0 0 80px;
        }

        /* DESCRIPTION */
        .awh-hero-description {
          width: 100%;
          max-width: 545px;
          margin: 24px 0 0;
          color: #30483a;
          font-size: clamp(15px, 1.3vw, 18px);
          line-height: 1.72;
        }

        /* CTA */
        .awh-hero-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          margin-top: 28px;
        }

        .awh-hero-primary,
        .awh-hero-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          min-height: 54px;
          padding: 12px 25px;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.3;
          text-decoration: none;
          white-space: nowrap;
          transition:
            background 220ms ease,
            color 220ms ease,
            transform 220ms ease;
        }

        .awh-hero-primary {
          border: 1px solid #315a48;
          background: #315a48;
          color: #fff !important;
        }

        .awh-hero-primary span {
          color: #fff !important;
        }

        .awh-hero-primary:hover {
          background: #254638;
          transform: translateY(-2px);
        }

        .awh-hero-secondary {
          border: 1px solid #315a48;
          background: transparent;
          color: #244b36;
        }

        .awh-hero-secondary:hover {
          background: rgba(49, 90, 72, 0.055);
          transform: translateY(-2px);
        }

        .awh-hero-primary span:last-child,
        .awh-hero-secondary span:last-child {
          font-size: 19px;
          font-weight: 400;
        }

        /* PORTRAIT — same background, no card */
        .awh-hero-portrait {
          position: absolute;
          z-index: 2;
          top: 0;
          right: 0;
          bottom: 0;
          width: 54%;
          overflow: hidden;
          background: transparent;
          pointer-events: none;

          -webkit-mask-image: linear-gradient(
            to bottom,
            #000 0%,
            #000 83%,
            transparent 100%
          );

          mask-image: linear-gradient(
            to bottom,
            #000 0%,
            #000 83%,
            transparent 100%
          );
        }

        .awh-portrait-image {
          object-fit: contain;
          object-position: center bottom;
        }

        /* Soft blend at portrait's left edge */
        .awh-hero-portrait::after {
          content: "";
          position: absolute;
          z-index: 2;
          inset: 0;
          background: linear-gradient(
            to right,
            #fafbf8 0%,
            rgba(250, 251, 248, 0.76) 8%,
            rgba(250, 251, 248, 0) 35%
          );
          pointer-events: none;
        }

        @keyframes awhReflectionEnter {
          from {
            opacity: 0;
            transform: translateX(20px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* TABLET */
        @media (max-width: 1100px) {
          .awh-hero-inner {
            min-height: 670px;
            padding-right: 30px;
            padding-left: 30px;
          }

          .awh-hero-content {
            width: 58%;
          }

          .awh-hero-portrait {
            width: 51%;
          }

          .awh-hero-reflections {
            margin-top: 35px;
          }

          .awh-hero-heading {
            font-size: clamp(47px, 5.4vw, 70px);
          }

          .awh-reflection-stage {
            min-height: 200px;
          }
        }

        /* MOBILE */
        @media (max-width: 850px) {
          .awh-hero-inner {
            display: flex;
            flex-direction: column;
            min-height: 0;
            padding: 24px 20px 0;
          }

          .awh-hero-content {
            width: 100%;
            max-width: 620px;
            margin: 0 auto;
          }

          .awh-hero-brand {
            gap: 8px;
            font-size: clamp(20px, 5vw, 28px);
          }

          .awh-brand-icon {
            width: 32px;
            height: 32px;
          }

          .awh-hero-reflections {
            margin-top: 34px;
          }

          .awh-reflection-label {
            gap: 9px;
            font-size: 9px;
            letter-spacing: 0.15em;
          }

          .awh-small-line {
            width: 23px;
          }

          .awh-reflection-stage {
            min-height: 0;
            margin-top: 16px;
          }

          .awh-reflection-quote {
            font-size: clamp(17px, 4.4vw, 22px);
            line-height: 1.5;
          }

          .awh-reflection-author {
            font-size: 13px;
          }

          .awh-reflection-controls {
            margin-top: 14px;
          }

          .awh-hero-heading-wrap {
            margin-top: 26px;
          }

          .awh-hero-heading {
            font-size: clamp(45px, 9vw, 68px);
            line-height: 1.07;
          }

          .awh-heading-underline {
            width: 165px;
            margin-left: 55px;
          }

          .awh-hero-description {
            max-width: 520px;
            margin-top: 20px;
            font-size: 15px;
            line-height: 1.7;
          }

          .awh-hero-actions {
            gap: 11px;
            margin-top: 24px;
          }

          .awh-hero-primary,
          .awh-hero-secondary {
            min-height: 49px;
            padding: 10px 19px;
            gap: 12px;
            font-size: 13px;
          }

          .awh-hero-portrait {
            position: relative;
            top: auto;
            right: auto;
            bottom: auto;
            width: calc(100% + 40px);
            height: clamp(330px, 84vw, 510px);
            margin: 3px -20px 0;

            -webkit-mask-image: linear-gradient(
              to bottom,
              #000 0%,
              #000 85%,
              transparent 100%
            );

            mask-image: linear-gradient(
              to bottom,
              #000 0%,
              #000 85%,
              transparent 100%
            );
          }

          .awh-hero-portrait::after {
            background: none;
          }

          .awh-portrait-image {
            object-fit: contain;
            object-position: center bottom;
          }
        }

        @media (max-width: 390px) {
          .awh-hero-inner {
            padding-right: 16px;
            padding-left: 16px;
          }

          .awh-hero-heading {
            font-size: 43px;
          }

          .awh-hero-portrait {
            width: calc(100% + 32px);
            margin-right: -16px;
            margin-left: -16px;
          }

          .awh-hero-primary,
          .awh-hero-secondary {
            padding: 10px 15px;
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .awh-reflection-slide {
            animation: none;
          }

          .awh-hero-primary,
          .awh-hero-secondary {
            transition: none;
          }
        }

        .awh-cinematic-hero a:focus-visible,
        .awh-cinematic-hero button:focus-visible {
          outline: 2px solid #315a48;
          outline-offset: 4px;
        }
      `}</style>
    </section>
  );
}
