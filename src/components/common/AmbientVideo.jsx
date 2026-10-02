"use client";

import { useEffect, useRef, useState } from "react";

export default function AmbientVideo({
  src,
  poster = "/images/ambient-morning.webp",
  eyebrow,
  title,
  description,
  objectPosition = "center",
}) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;

    if (!section || !video || !src) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let visible = false;
    let loaded = false;

    const syncPlayback = () => {
      if (
        !visible ||
        document.hidden ||
        reducedMotion.matches ||
        failed
      ) {
        video.pause();
        return;
      }

      video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;

        if (visible && !loaded) {
          loaded = true;
          video.src = src;
          video.load();
        }

        syncPlayback();
      },
      {
        rootMargin: "300px 0px",
        threshold: 0.05,
      }
    );

    observer.observe(section);

    document.addEventListener(
      "visibilitychange",
      syncPlayback
    );

    reducedMotion.addEventListener(
      "change",
      syncPlayback
    );

    return () => {
      observer.disconnect();

      document.removeEventListener(
        "visibilitychange",
        syncPlayback
      );

      reducedMotion.removeEventListener(
        "change",
        syncPlayback
      );

      video.pause();
    };
  }, [src, failed]);

  return (
    <section
      ref={sectionRef}
      aria-label={title}
      className="
        relative isolate
        min-h-[560px]
        w-full
        overflow-hidden
        bg-[#20342b]
        text-white

        sm:min-h-[620px]
        lg:min-h-[700px]
        xl:min-h-[760px]
      "
    >
      {/* =====================================================
          FALLBACK / POSTER IMAGE
      ====================================================== */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${poster}")`,
          backgroundPosition: objectPosition,
        }}
      />

      {/* =====================================================
          REAL BACKGROUND VIDEO
      ====================================================== */}
      {!failed && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster={poster}
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          onCanPlay={() => setReady(true)}
          onPlaying={() => setReady(true)}
          onError={() => {
            setFailed(true);
            setReady(false);
          }}
          className={`
            absolute inset-0 z-[1]
            h-full w-full
            object-cover

            transition-opacity
            duration-1000
            ease-out

            ${
              ready && !failed
                ? "opacity-100"
                : "opacity-0"
            }
          `}
          style={{
            objectPosition,
          }}
        />
      )}

      {/* =====================================================
          MORNING COLOR TREATMENT
      ====================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 z-[2]

          bg-[linear-gradient(180deg,rgba(135,177,197,.05)_0%,rgba(242,205,150,.035)_44%,rgba(28,43,34,.15)_100%)]
        "
      />

      {/* =====================================================
          MAIN LEFT DARK GREEN GRADIENT
          Image wali composition ka main part
      ====================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 z-[3]

          bg-[linear-gradient(90deg,rgba(14,36,27,.94)_0%,rgba(17,42,32,.84)_18%,rgba(20,43,34,.61)_40%,rgba(22,42,34,.27)_61%,rgba(18,31,25,.04)_82%,transparent_100%)]
        "
      />

      {/* Bottom depth */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 z-[4]

          bg-[linear-gradient(0deg,rgba(13,27,21,.46)_0%,rgba(14,29,23,.14)_26%,transparent_56%)]
        "
      />

      {/* =====================================================
          SOFT SUNRISE GLOW
      ====================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-[-7%]
          top-[-18%]
          z-[4]

          h-[620px]
          w-[620px]
          rounded-full

          bg-[radial-gradient(circle,rgba(255,219,156,.23)_0%,rgba(250,196,117,.09)_33%,transparent_68%)]

          blur-[8px]

          max-[700px]:right-[-50%]
        "
      />

      {/* =====================================================
          SUBTLE EDGE VIGNETTE
      ====================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 z-[5]

          shadow-[inset_0_0_120px_rgba(8,20,15,.18)]
        "
      />

      {/* =====================================================
          VERY SUBTLE DECORATIVE LINE
      ====================================================== */}
      <div
        aria-hidden="true"
        className="
          absolute
          left-5
          top-1/2
          z-[9]

          hidden
          h-[150px]
          w-px
          -translate-y-1/2

          bg-gradient-to-b
          from-transparent
          via-white/20
          to-transparent

          xl:block
        "
      />

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <div
        className="
          relative z-10

          mx-auto
          flex
          min-h-[560px]
          w-full
          max-w-[1440px]

          items-center

          px-6
          py-20

          sm:min-h-[620px]
          sm:px-10
          sm:py-24

          lg:min-h-[700px]
          lg:px-16

          xl:min-h-[760px]
          xl:px-[86px]
        "
      >
        <div
          className="
            w-full
            max-w-[760px]

            max-[700px]:max-w-[600px]
          "
        >
          {/* Eyebrow */}
          {eyebrow ? (
            <div
              className="
                mb-7
                flex
                items-center
                gap-4

                sm:mb-8
              "
            >
              <span
                aria-hidden="true"
                className="
                  h-px
                  w-8
                  bg-[#bfd0b9]/70
                "
              />

              <p
                className="
                  m-0

                  text-[9px]
                  font-bold
                  uppercase

                  tracking-[0.38em]

                  text-[#d4dfcf]

                  sm:text-[10px]
                "
              >
                {eyebrow}
              </p>
            </div>
          ) : null}

          {/* Main heading */}
          <h2
            className="
              m-0

              max-w-[740px]

              font-serif

              text-[46px]
              font-normal

              leading-[0.99]

              tracking-[-0.045em]

              text-[#f8faf5]

              drop-shadow-[0_4px_24px_rgba(0,0,0,.14)]

              sm:text-[60px]
              sm:leading-[.98]

              lg:text-[76px]

              xl:text-[88px]

              max-[420px]:text-[40px]
            "
          >
            {title}
          </h2>

          {/* Description */}
          {description ? (
            <p
              className="
                mt-7
                mb-0

                max-w-[590px]

                text-[14px]

                leading-[1.85]

                text-white/80

                sm:mt-8
                sm:text-[16px]
                sm:leading-[1.9]

                lg:max-w-[620px]
                lg:text-[17px]
              "
            >
              {description}
            </p>
          ) : null}

          {/* Tiny decorative nature detail */}
          <div
            aria-hidden="true"
            className="
              mt-9
              flex
              items-center
              gap-3
            "
          >
            <span
              className="
                block
                h-[5px]
                w-[5px]
                rounded-full
                bg-[#b7c9af]
              "
            />

            <span
              className="
                block
                h-px
                w-[72px]

                bg-gradient-to-r
                from-[#b7c9af]/60
                to-transparent
              "
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE EXTRA GRADIENT
          Text ki readability maintain karega
      ====================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 z-[6]

          hidden

          max-[700px]:block
          max-[700px]:bg-[linear-gradient(90deg,rgba(16,37,29,.88)_0%,rgba(18,39,31,.64)_55%,rgba(18,35,28,.22)_100%)]
        "
      />
    </section>
  );
}