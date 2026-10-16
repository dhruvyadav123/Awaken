"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  navigationLinks,
  isNavigationActive,
} from "@/lib/navigation-menu";

const additionalLinks = [
  ["Start here", "/start-here"],
  ["My Profile", "/profile"],
];

const quickLinks = Array.from(
  new Map(
    [...navigationLinks, ...additionalLinks]
      .map(([label, href]) => [
        href,
        { label, href },
      ])
  ).values()
);

export default function HeaderCommandPalette({
  open,
  onClose,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] =
    useState(0);

  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);

  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) return quickLinks;

    return quickLinks.filter((item) =>
      `${item.label} ${item.href}`
        .toLowerCase()
        .includes(text)
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    previousFocusRef.current =
      document.activeElement;

    document.body.style.overflow = "hidden";

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);

      document.body.style.overflow =
        previousOverflow;

      const previous =
        previousFocusRef.current;

      requestAnimationFrame(() => {
        if (
          previous &&
          document.contains(previous)
        ) {
          previous.focus?.();
        }
      });
    };
  }, [open]);

  function openResult(index) {
    const item = matches[index];

    if (!item) return;

    onClose?.();

    router.push(item.href);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
      return;
    }

    if (
      event.key === "ArrowDown" &&
      matches.length
    ) {
      event.preventDefault();

      setActiveIndex((index) =>
        index >= matches.length - 1
          ? 0
          : index + 1
      );

      return;
    }

    if (
      event.key === "ArrowUp" &&
      matches.length
    ) {
      event.preventDefault();

      setActiveIndex((index) =>
        index <= 0
          ? matches.length - 1
          : index - 1
      );

      return;
    }

    if (
      event.key === "Enter" &&
      document.activeElement ===
        inputRef.current
    ) {
      if (!matches.length) return;

      event.preventDefault();
      openResult(
        Math.min(
          activeIndex,
          matches.length - 1
        )
      );

      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      panelRef.current?.querySelectorAll(
        [
          'input:not([disabled])',
          'button:not([disabled])',
          'a[href]',
          '[tabindex]:not([tabindex="-1"])',
        ].join(",")
      ) || []
    ).filter(
      (element) =>
        element.getClientRects().length > 0
    );

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[min(14vh,120px)]"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#10243d]/65 backdrop-blur-sm"
        aria-label="Close quick navigation"
        tabIndex={-1}
        onClick={onClose}
      />

      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="awm-command-title"
        className="relative flex max-h-[min(76vh,650px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#dce4e9] bg-white shadow-[0_28px_80px_rgb(10_32_54/28%)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#e4e9ee] px-5 py-4">
          <div>
            <h2
              id="awm-command-title"
              className="text-base font-semibold text-[#27456d]"
            >
              Quick navigation
            </h2>

            <p className="text-xs text-[#60748a]">
              Find a page or search the site
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick navigation"
            className="rounded-full p-2 text-[#49657d] hover:bg-[#eef3f7]"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m5 5 14 14M19 5 5 19" />
            </svg>
          </button>
        </div>

        <form
          action="/search"
          method="get"
          role="search"
          className="flex gap-2 border-b border-[#e4e9ee] px-5 py-4"
        >
          <label
            htmlFor="awm-command-search"
            className="sr-only"
          >
            Search Awaken With Meheck
          </label>

          <input
            ref={inputRef}
            id="awm-command-search"
            type="search"
            name="q"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search classes, workshops..."
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-[#cfdbe5] px-3 py-2 text-sm text-[#27456d] outline-none focus:border-[#315b9d] focus:ring-2 focus:ring-[#315b9d]/15"
          />

          <button
            type="submit"
            className="rounded-lg bg-[#315b9d] px-4 py-2 text-sm font-medium text-white hover:bg-[#244676]"
          >
            Search
          </button>
        </form>

        <div className="overflow-y-auto px-3 py-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#718296]">
            Pages
          </p>

          {matches.length ? (
            <nav aria-label="Quick links">
              <ul className="grid gap-1">
                {matches.map((item, index) => {
                  const selected =
                    index === activeIndex;

                  const activePage =
                    isNavigationActive(
                      pathname,
                      item.href
                    );

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={
                          activePage
                            ? "page"
                            : undefined
                        }
                        onMouseEnter={() =>
                          setActiveIndex(index)
                        }
                        onFocus={() =>
                          setActiveIndex(index)
                        }
                        onClick={onClose}
                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[#27456d] transition-colors ${
                          selected
                            ? "bg-[#edf4f8]"
                            : "hover:bg-[#edf4f8]"
                        }`}
                      >
                        <span>
                          {item.label}
                        </span>

                        <span aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : (
            <p
              className="px-3 py-5 text-sm text-[#60748a]"
              aria-live="polite"
            >
              No matching page found.
              Use Search to search site content.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#e4e9ee] px-5 py-3 text-xs text-[#718296]">
          <span>Esc to close</span>

          <span className="hidden sm:inline">
            ↑ ↓ Navigate · Enter Open
          </span>
        </div>
      </section>
    </div>
  );
}