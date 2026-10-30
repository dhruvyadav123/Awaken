"use client";

import { useState } from "react";

const quotes = [
  { text: "I enter peoples' lives when they are ready for transformation - Fast and Radical", color: "#315b66" },
  { text: "You always have a CHOICE! And after making a choice you still have a choice !", color: "#805582" },
];

export default function TransformationQuote() {
  const [index, setIndex] = useState(0);
  const quote = quotes[index];
  return <figure className="transformation-quote">
    <h1 id="cms-home-title" className="sr-only">Quotes by Meheck Mukherjee</h1>
    <blockquote className="transformation-quote-stage" aria-labelledby="cms-home-title">
      <p key={index} className="transformation-quote-slide" style={{ color: quote.color }} onAnimationEnd={() => setIndex((current) => (current + 1) % quotes.length)}>
        <span className="transformation-quote-inline-mark transformation-quote-inline-mark-open" aria-hidden="true">&ldquo;</span>
        {quote.text}
        <span className="transformation-quote-inline-mark transformation-quote-inline-mark-close" aria-hidden="true">&rdquo;</span>
      </p>
    </blockquote>
    <figcaption><span aria-hidden="true" />Meheck Mukherjee</figcaption>
  </figure>;
}
