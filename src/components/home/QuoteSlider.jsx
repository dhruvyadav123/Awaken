"use client";

import { useCallback, useEffect, useState } from "react";

const quotes = [
  {
    text: "You are unwilling to see the truth, because the truth will set you free !",
    source: "Choices and Voices of Children",
  },
  {
    text: "I enter peoples' lives when they are ready for transformation - Fast and Radical",
  },
  {
    text: "The mind is not your enemy - it is just trying to keep you safe.\nThe heart is not your friend - it is just fond of healing.",
  },
  {
    text: "… As I live every moment\nBe willing to Receive Everything\nAs I die every moment\nBe willing to let go everything !",
  },
  {
    text: "Every molecule of the Universe conspires in my Favour",
  },
];

export default function QuoteSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const showQuote = useCallback((index) => {
    setActiveIndex(
      (index + quotes.length) % quotes.length
    );
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (
      isHovered ||
      isFocused ||
      reducedMotion.matches
    ) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex(
        (current) => (current + 1) % quotes.length
      );
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, [isHovered, isFocused]);

  const activeQuote = quotes[activeIndex];

  return (
    <section
      className="home-hero-copy quote-slider"
      aria-label="Quotes by Meheck Mukherjee"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget
          )
        ) {
          setIsFocused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          showQuote(activeIndex + 1);
        }

        if (event.key === "ArrowLeft") {
          showQuote(activeIndex - 1);
        }
      }}
    >
      <p className="home-eyebrow">
        <span />
        Words to sit with
      </p>

      <div className="quote-slider-stage">
        <figure
          className="quote-slide"
          key={activeIndex}
          aria-roledescription="slide"
          aria-label={`${activeIndex + 1} of ${
            quotes.length
          }`}
        >
          <blockquote>
            {activeQuote.text
              .split("\n")
              .map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index <
                    activeQuote.text.split("\n")
                      .length -
                      1 && <br />}
                </span>
              ))}
          </blockquote>

          <figcaption>
            {activeQuote.source ? (
              <cite>{activeQuote.source}</cite>
            ) : null}

            <span>— Meheck Mukherjee</span>
          </figcaption>
        </figure>
      </div>

      <div
        className="quote-slider-controls"
        aria-label="Quote controls"
      >
        <button
          type="button"
          className="quote-nav-button"
          aria-label="Previous quote"
          onClick={() =>
            showQuote(activeIndex - 1)
          }
        >
          ←
        </button>

        <div
          className="quote-slider-dots"
          role="group"
          aria-label="Choose a quote"
        >
          {quotes.map((quote, index) => (
            <button
              key={quote.text}
              className={
                index === activeIndex
                  ? "is-active"
                  : ""
              }
              type="button"
              aria-label={`Show quote ${
                index + 1
              }`}
              aria-pressed={
                index === activeIndex
              }
              onClick={() =>
                setActiveIndex(index)
              }
            />
          ))}
        </div>

        <button
          type="button"
          className="quote-nav-button"
          aria-label="Next quote"
          onClick={() =>
            showQuote(activeIndex + 1)
          }
        >
          →
        </button>
      </div>
    </section>
  );
}