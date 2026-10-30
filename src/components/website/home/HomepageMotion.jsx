"use client";

import { useEffect, useRef } from "react";

const REVEAL_SELECTOR = [
  ".renew-section-heading",
  ".renew-community",
  ".renew-offering",
  ".renew-philosophy > div",
  ".renew-faq > div",
  ".renew-cta > h2",
  ".renew-cta > p",
  ".renew-cta > button",
].join(",");

export default function HomepageMotion({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let observer = null;
    let revealFrame = null;

    const targets = Array.from(root.querySelectorAll(REVEAL_SELECTOR));

    function makeVisible() {
      targets.forEach((node) => {
        node.dataset.reveal = "visible";
      });
    }

    function setupReveal() {
      observer?.disconnect();

      if (
        reducedMotion.matches ||
        !("IntersectionObserver" in window)
      ) {
        makeVisible();
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.dataset.reveal = "visible";
            observer?.unobserve(entry.target);
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -40px 0px",
        }
      );

      targets.forEach((node, index) => {
        const alreadyVisible =
          node.getBoundingClientRect().top <
          window.innerHeight - 24;

        node.style.setProperty(
          "--reveal-delay",
          node.classList.contains("renew-offering")
            ? `${(index % 3) * 90}ms`
            : "0ms"
        );

        node.dataset.reveal = alreadyVisible
          ? "visible"
          : "waiting";

        if (!alreadyVisible) {
          observer.observe(node);
        }
      });
    }

    // Let the initial server-rendered tree finish hydrating before mutating
    // descendants. This is especially important for streamed Suspense content:
    // changing its attributes during the first frame can look like a server /
    // client markup mismatch to React.
    const scheduleReveal = () => {
      if (revealFrame !== null) {
        window.cancelAnimationFrame(revealFrame);
      }

      revealFrame = window.requestAnimationFrame(() => {
        revealFrame = null;
        setupReveal();
      });
    };

    scheduleReveal();

    reducedMotion.addEventListener("change", scheduleReveal);

    return () => {
      if (revealFrame !== null) {
        window.cancelAnimationFrame(revealFrame);
      }

      observer?.disconnect();

      reducedMotion.removeEventListener(
        "change",
        scheduleReveal
      );

      targets.forEach((node) => {
        node.removeAttribute("data-reveal");
        node.style.removeProperty("--reveal-delay");
      });
    };
  }, []);

  return (
    <div ref={rootRef} className="renew-home">
      {children}
    </div>
  );
}
