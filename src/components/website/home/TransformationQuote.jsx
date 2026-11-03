
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SLIDE_INTERVAL = 2000;
const EXIT_DURATION = 250;
const ENTER_DURATION = 450;

const quotes = [
  {
    lines: [
      "I enter peoples' lives when they are ready for transformation - Fast and Radical",
    ],
    colors: ["#315B66"],
    source: "",
  },
  {
    lines: [
      "You always have a CHOICE! And after making a choice you still have a choice !",
    ],
    colors: ["#805582"],
    source: "",
  },
  {
    lines: [
      "… As I live every moment",
      "Be willing to Receive Everything",
      "As I die every moment",
      "Be willing to let go everything !",
    ],
    colors: [
      "#315A48",
      "#94613E",
      "#456A88",
      "#805582",
    ],
    source: "",
  },
  {
    lines: [
      "The mind is not your enemy - it is just trying to keep you safe.",
      "The heart is not your friend - it is just fond of healing.",
    ],
    colors: ["#315B66", "#965477"],
    source: "",
  },
  {
    lines: [
      "Every molecule of the Universe conspires in my Favour",
    ],
    colors: ["#A16A3B"],
    source: "",
  },
  {
    lines: [
      "You are unwilling to see the truth, because the truth will set you free !",
    ],
    colors: ["#65558C"],
    source: "Choices and Voices of Children",
  },
];

function QuoteContent({ quote }) {
  return (
    <blockquote className="mx-auto w-full max-w-[900px] px-1 text-center sm:px-5">
      <div className="space-y-1 sm:space-y-2">
        {quote.lines.map((line, index) => {
          const color =
            quote.colors[index % quote.colors.length];

          const isFirst = index === 0;
          const isLast = index === quote.lines.length - 1;

          return (
            <p
              key={index}
              style={{ color }}
              className="break-words font-serif text-[clamp(19px,2.25vw,28px)] font-normal leading-[1.55] tracking-[-0.015em]"
            >
              {isFirst && (
                <span
                  aria-hidden="true"
                  className="mr-1 inline text-[1.16em] font-semibold leading-none"
                >
                  &ldquo;
                </span>
              )}

              {line}

              {isLast && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline text-[1.16em] font-semibold leading-none"
                >
                  &rdquo;
                </span>
              )}
            </p>
          );
        })}
      </div>

      {quote.source && (
        <p className="mt-4 text-[12px] italic tracking-wide text-[#718276] sm:text-sm">
          {quote.source}
        </p>
      )}
    </blockquote>
  );
}

export default function TransformationQuote() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [direction, setDirection] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  const currentIndexRef = useRef(0);
  const animatingRef = useRef(false);
  const timersRef = useRef([]);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const updateMotion = () => {
      setReducedMotion(media.matches);
    };

    updateMotion();

    media.addEventListener("change", updateMotion);

    return () => {
      media.removeEventListener("change", updateMotion);
    };
  }, []);

  const changeQuote = useCallback(
    (target, newDirection = 1) => {
      const next =
        ((target % quotes.length) + quotes.length) %
        quotes.length;

      if (animatingRef.current) return;
      if (next === currentIndexRef.current) return;

      if (reducedMotion) {
        currentIndexRef.current = next;
        setIndex(next);
        return;
      }

      animatingRef.current = true;

      const schedule = (callback, delay) => {
        const timer = window.setTimeout(callback, delay);
        timersRef.current.push(timer);
      };

      setDirection(newDirection);
      setPhase("exit");

      // Current quote exits completely.
      schedule(() => {
        currentIndexRef.current = next;
        setIndex(next);
        setPhase("prepare");

        // New quote enters from the opposite side.
        schedule(() => {
          setPhase("enter");

          schedule(() => {
            setPhase("idle");
            animatingRef.current = false;
          }, ENTER_DURATION);
        }, 40);
      }, EXIT_DURATION);
    },
    [reducedMotion]
  );

  useEffect(() => {
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      changeQuote(currentIndexRef.current + 1, 1);
    }, SLIDE_INTERVAL);

    return () => window.clearInterval(interval);
  }, [changeQuote, reducedMotion]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, []);

  const offset = direction === 1 ? 75 : -75;

  let slideStyle = {
    opacity: 1,
    transform: "translate3d(0,0,0)",
    transition: "none",
  };

  if (phase === "exit") {
    slideStyle = {
      opacity: 0,
      transform: `translate3d(${-offset}px,0,0)`,
      transition:
        "opacity 250ms ease-in, transform 250ms ease-in",
    };
  }

  if (phase === "prepare") {
    slideStyle = {
      opacity: 0,
      transform: `translate3d(${offset}px,0,0)`,
      transition: "none",
    };
  }

  if (phase === "enter") {
    slideStyle = {
      opacity: 1,
      transform: "translate3d(0,0,0)",
      transition:
        "opacity 450ms ease-out, transform 450ms cubic-bezier(0.22,1,0.36,1)",
    };
  }

  return (
    <section
      aria-label="Quotes by Meheck Mukherjee"
      className="relative isolate w-full overflow-hidden border-0 bg-[#FAFBF8]"
    >
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-8 sm:px-8 sm:pb-14 sm:pt-10 lg:pb-16 lg:pt-12">

        {/* Simple section heading */}
        <div className="mb-6 flex items-center justify-center gap-3 sm:mb-8">
          <span className="h-px w-7 bg-[#B1C4B5] sm:w-10" />

          <span className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#62806A] sm:text-xs">
            Words to Reflect On
          </span>

          <span className="h-px w-7 bg-[#B1C4B5] sm:w-10" />
        </div>

        {/* Single quote — no overlapping slides */}
        <div className="mx-auto flex min-h-[290px] w-full items-center justify-center overflow-hidden py-3 sm:min-h-[250px] lg:min-h-[220px]">

          <div
            className="w-full"
            style={slideStyle}
          >
            <QuoteContent quote={quotes[index]} />
          </div>

        </div>

        {/* Author */}
        <div className="mt-4 flex flex-col items-center justify-center gap-3 text-center sm:mt-5">
          <span className="h-px w-11 bg-[#AFC5B3]" />

          <p className="text-[13px] font-semibold tracking-[0.07em] text-[#315A48] sm:text-sm">
            — Meheck Mukherjee
          </p>
        </div>

        {/* Slider navigation */}
        <nav
          aria-label="Quote navigation"
          className="mt-7 flex items-center justify-center gap-5 sm:mt-9"
        >
          {/* Previous */}
          <button
            type="button"
            aria-label="Previous quote"
            onClick={() =>
              changeQuote(currentIndexRef.current - 1, -1)
            }
            className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[#315A48] transition-colors duration-200 hover:bg-[#E5EBE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315A48]"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          {/* Indicators */}
          <div className="flex items-center justify-center gap-2">
            {quotes.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show quote ${i + 1}`}
                aria-current={
                  index === i ? "true" : undefined
                }
                onClick={() =>
                  changeQuote(
                    i,
                    i >= currentIndexRef.current ? 1 : -1
                  )
                }
                className={`h-[7px] rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315A48] ${
                  index === i
                    ? "w-7 bg-[#315A48]"
                    : "w-[7px] bg-[#CEDBCF] hover:bg-[#8AA591]"
                }`}
              />
            ))}
          </div>

          {/* Next */}
          <button
            type="button"
            aria-label="Next quote"
            onClick={() =>
              changeQuote(currentIndexRef.current + 1, 1)
            }
            className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[#315A48] transition-colors duration-200 hover:bg-[#E5EBE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315A48]"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </nav>
      </div>
    </section>
  );
}
