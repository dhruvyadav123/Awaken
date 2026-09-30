"use client";

import { useEffect, useRef } from "react";

export default function HomepageMotion({ children }) {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer;
    const targets = root.querySelectorAll(".renew-section-heading, .renew-need, .renew-how > div, .renew-steps > li, .renew-community, .renew-offering, .renew-pause > div, .renew-philosophy > div, .renew-faq > div, .renew-cta > h2, .renew-cta > p, .renew-cta > button");
    function setup() {
      observer?.disconnect();
      if (query.matches || !("IntersectionObserver" in window)) {
        targets.forEach(node => node.removeAttribute("data-reveal"));
        return;
      }
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.dataset.reveal = "visible"; observer.unobserve(entry.target); }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
      targets.forEach((node, index) => {
        node.style.setProperty("--reveal-delay", node.classList.contains("renew-offering") ? `${(index % 3) * 90}ms` : "0ms");
        // Keep content already on screen visible during hydration.
        node.dataset.reveal = node.getBoundingClientRect().top < window.innerHeight - 24 ? "visible" : "waiting";
        if (node.dataset.reveal === "waiting") observer.observe(node);
      });
    }
    setup();
    query.addEventListener("change", setup);
    return () => { observer?.disconnect(); query.removeEventListener("change", setup); targets.forEach(node => node.removeAttribute("data-reveal")); };
  }, []);
  return <div ref={rootRef} className="renew-home">{children}</div>;
}

