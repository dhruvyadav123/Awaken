"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (isHovered || isFocused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % quotes.length);
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, [isFocused, isHovered]);

  const activeQuote = quotes[activeIndex];

  return <section
    className="home-hero-copy quote-slider"
    aria-label="Quotes by Meheck Mukherjee"
    aria-roledescription="carousel"
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    onFocus={() => setIsFocused(true)}
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
    }}
  >
    <p className="home-eyebrow"><span /> Words to sit with</p>
    <figure className="quote-slide" key={activeIndex} aria-roledescription="slide" aria-label={`${activeIndex + 1} of ${quotes.length}`}>
      <blockquote>{activeQuote.text}</blockquote>
      <figcaption>
        {activeQuote.source ? <cite>{activeQuote.source}</cite> : null}
        <span>— Meheck Mukherjee</span>
      </figcaption>
    </figure>
    <div className="quote-slider-controls" aria-label="Quote controls">
      <div className="quote-slider-dots" role="group" aria-label="Choose a quote">
        {quotes.map((quote, index) => <button
          key={quote.text}
          className={index === activeIndex ? "is-active" : ""}
          type="button"
          aria-label={`Show quote ${index + 1}`}
          aria-pressed={index === activeIndex}
          onClick={() => setActiveIndex(index)}
        />)}
      </div>
    </div>
  </section>;
}