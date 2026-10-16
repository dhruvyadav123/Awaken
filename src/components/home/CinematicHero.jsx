"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const reducedMotionQuery =
  "(prefers-reduced-motion: reduce)";

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

function subscribeMotion(callback) {
  const media = window.matchMedia(
    reducedMotionQuery
  );

  media.addEventListener(
    "change",
    callback
  );

  navigator.connection?.addEventListener?.(
    "change",
    callback
  );

  return () => {
    media.removeEventListener(
      "change",
      callback
    );

    navigator.connection?.removeEventListener?.(
      "change",
      callback
    );
  };
}

function getMotionPreference() {
  const reduced =
    window.matchMedia(
      reducedMotionQuery
    ).matches;

  const saveData =
    navigator.connection?.saveData === true;

  return !reduced && !saveData;
}

export default function CinematicHero() {
  const heroRef = useRef(null);
  const introRef = useRef(null);
  const videoRef = useRef(null);

  const motionAllowed =
    useSyncExternalStore(
      subscribeMotion,
      getMotionPreference,
      () => false
    );

  const [paused, setPaused] =
    useState(false);

  const [playing, setPlaying] =
    useState(false);

  const [failed, setFailed] =
    useState(false);

  const [
    autoplayBlocked,
    setAutoplayBlocked,
  ] = useState(false);

  const [
    reflectionIndex,
    setReflectionIndex,
  ] = useState(0);

  const animate =
    motionAllowed &&
    !paused &&
    !failed &&
    !autoplayBlocked;

  /*
   * Reflection rotation
   */
  useEffect(() => {
    if (!motionAllowed) {
      return undefined;
    }

    const timer =
      window.setInterval(() => {
        setReflectionIndex(
          (index) =>
            (index + 1) %
            reflections.length
        );
      }, 7500);

    return () =>
      window.clearInterval(timer);
  }, [motionAllowed]);

  /*
   * Nature video:
   * only load/play when required.
   */
  useEffect(() => {
    const video =
      videoRef.current;

    const hero =
      heroRef.current;

    if (!video || !hero) {
      return undefined;
    }

    if (!animate) {
      video.pause();

      return undefined;
    }

    let disposed = false;
    let inView = true;

    if (
      !video.getAttribute("src")
    ) {
      video.src =
        "/videos/forest-desktop.mp4";
    }

    function syncPlayback() {
      if (
        disposed ||
        !inView ||
        document.hidden
      ) {
        video.pause();

        return;
      }

      video
        .play()
        .catch((error) => {
          if (
            !disposed &&
            error.name ===
              "NotAllowedError"
          ) {
            setAutoplayBlocked(
              true
            );
          }
        });
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          inView =
            entry.isIntersecting;

          hero.dataset.inView =
            String(inView);

          syncPlayback();
        },
        {
          threshold: 0.05,
        }
      );

    observer.observe(hero);

    document.addEventListener(
      "visibilitychange",
      syncPlayback
    );

    syncPlayback();

    return () => {
      disposed = true;

      video.pause();

      observer.disconnect();

      document.removeEventListener(
        "visibilitychange",
        syncPlayback
      );
    };
  }, [animate]);

  /*
   * Very subtle hero scroll movement.
   *
   * This only shifts layout depth.
   * Portrait background itself does NOT animate.
   */
  useEffect(() => {
    const intro =
      introRef.current;

    if (
      !intro ||
      !motionAllowed
    ) {
      return undefined;
    }

    let scrollFrame = 0;

    function updateScroll() {
      cancelAnimationFrame(
        scrollFrame
      );

      scrollFrame =
        requestAnimationFrame(
          () => {
            const bounds =
              intro.getBoundingClientRect();

            const progress =
              Math.min(
                1,
                Math.max(
                  0,
                  -bounds.top /
                    Math.max(
                      1,
                      bounds.height
                    )
                )
              );

            intro.style.setProperty(
              "--intro-scroll",
              `${progress * 20}px`
            );
          }
        );
    }

    window.addEventListener(
      "scroll",
      updateScroll,
      {
        passive: true,
      }
    );

    updateScroll();

    return () => {
      cancelAnimationFrame(
        scrollFrame
      );

      window.removeEventListener(
        "scroll",
        updateScroll
      );
    };
  }, [motionAllowed]);

  function toggleMotion() {
    const video =
      videoRef.current;

    if (animate) {
      setPaused(true);

      video?.pause();

      return;
    }

    setPaused(false);

    setAutoplayBlocked(false);

    video
      ?.play()
      .catch(() => {
        setAutoplayBlocked(
          true
        );
      });
  }

  const reflection =
    reflections[
      reflectionIndex
    ];

  return (
    <>
      <section
        ref={introRef}
        className="cinema-hero"
        aria-labelledby="cinema-title"
      >
        <div className="cinema-layout">
          {/* ==============================
              LEFT CONTENT
              ============================== */}

          <div className="cinema-content">
            <p className="cinema-eyebrow">
              AWAKEN WITH MEHECK
            </p>

            <div
              className="hero-reflections"
              role="group"
              aria-label="Reflections by Meheck Mukherjee"
            >
              <p className="hero-reflections-label">
                WORDS TO CARRY WITH YOU
              </p>

              <div
                className="hero-reflections-stage"
                aria-roledescription="slide"
                aria-label={`${
                  reflectionIndex + 1
                } of ${
                  reflections.length
                }`}
              >
                <div
                  key={
                    reflectionIndex
                  }
                  className="hero-reflections-copy"
                >
                  <p className="hero-reflections-quote">
                    “
                    {
                      reflection.quote
                    }
                    ”
                  </p>

                  {reflection.title ? (
                    <p className="hero-reflections-title">
                      {
                        reflection.title
                      }
                    </p>
                  ) : null}

                  <p className="hero-reflections-author">
                    —{" "}
                    {
                      reflection.author
                    }
                  </p>
                </div>
              </div>

              <div className="hero-reflections-controls">
                <span
                  aria-hidden="true"
                >
                  {String(
                    reflectionIndex +
                      1
                  ).padStart(
                    2,
                    "0"
                  )}{" "}
                  /{" "}
                  {String(
                    reflections.length
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>
              </div>
            </div>

            <h1 id="cinema-title">
              <span>
                Come back
              </span>

              <span>
                to{" "}
                <em>
                  yourself.
                </em>
              </span>
            </h1>

            <p className="cinema-description">
              A little space to pause,
              reconnect, and grow.
              Explore mindful practices
              and meaningful
              conversations, with Meheck
              by your side.
            </p>

            <div className="cinema-actions">
              <Link
                href="#explore"
                className="cinema-primary"
              >
                <span>
                  Find your practice
                </span>

                <span
                  aria-hidden="true"
                >
                  ↗
                </span>
              </Link>

              <Link
                href="/about"
                className="cinema-story"
              >
                <span>
                  Meet Meheck
                </span>

                <span
                  aria-hidden="true"
                >
                  ↗
                </span>
              </Link>
            </div>

            <p className="cinema-note">
              At your pace. In your own
              way.
            </p>
          </div>

          {/* ==============================
              MEHECK PORTRAIT
              ============================== */}

          <div className="cinema-portrait">
            {/*
              Static professional wellness backdrop.

              No orbit.
              No stars.
              No shimmer.
              No animated decorative graphics.
            */}

            <div
              className="cinema-portrait-backdrop"
              aria-hidden="true"
            >
              <span className="cinema-backdrop-base" />

              <span className="cinema-backdrop-light" />

              <span className="cinema-backdrop-organic" />

              <span className="cinema-backdrop-line cinema-backdrop-line-one" />

              <span className="cinema-backdrop-line cinema-backdrop-line-two" />

              <span className="cinema-backdrop-ground" />
            </div>

            <div className="cinema-portrait-image">
              <Image
                src="/images/hero/meheck.png"
                alt="Meheck leaning on a railing, wearing a yellow and blue sari"
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                quality={90}
                priority
                className="cinema-meheck-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          NATURE / STILLNESS SECTION
          ============================== */}

      <section
        ref={heroRef}
        className="cinema-nature"
        aria-label="A quiet moment in nature"
        data-playing={playing}
      >
        <video
          ref={videoRef}
          className="cinema-video"
          muted
          loop
          playsInline
          preload="none"
          poster="/videos/forest-source-frame.jpg"
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          onPlaying={() =>
            setPlaying(true)
          }
          onPause={() =>
            setPlaying(false)
          }
          onError={() => {
            setFailed(true);
            setPlaying(false);
          }}
        />

        <div
          className="cinema-nature-shade"
          aria-hidden="true"
        />

        <div className="cinema-nature-copy">
          <p className="cinema-eyebrow">
            A MOMENT OF STILLNESS
          </p>

          <h2>
            Slow down.
            <br />

            <em>
              Just be here.
            </em>
          </h2>
        </div>

        {motionAllowed &&
          !failed && (
            <button
              className="cinema-control"
              type="button"
              onClick={
                toggleMotion
              }
              aria-label={
                animate
                  ? "Pause nature video"
                  : "Play nature video"
              }
              aria-pressed={
                !animate
              }
            >
              <span
                aria-hidden="true"
              >
                {animate
                  ? "Ⅱ"
                  : "▷"}
              </span>

              {animate
                ? "Pause video"
                : "Play video"}
            </button>
          )}
      </section>
    </>
  );
}