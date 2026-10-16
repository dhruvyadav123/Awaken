"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ContactTrigger } from "../common/ContactPopup";

import {
  isNavigationActive,
  prepareNavigationItems,
  navigationLinks,
} from "@/lib/navigation-menu";

// Preserve compatibility with existing imports.
export { navigationLinks };

const linkClass = [
  "relative inline-flex min-h-[68px]",
  "items-center gap-1.5 px-0.5",
  "text-[14px] font-medium leading-5",
  "whitespace-nowrap text-[#1766a5]",
  "transition-colors duration-200",
  "hover:text-[#0e4f87]",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-4",
  "focus-visible:outline-[#8fb2d0]",
].join(" ");

const dropdownLinkClass = [
  "block rounded-md px-3 py-2.5",
  "text-[13px] leading-5",
  "text-[#315b75]",
  "transition-colors",
  "hover:bg-[#f1f6fa]",
  "hover:text-[#0e4f87]",
  "focus-visible:outline-2",
  "focus-visible:outline-[#8fb2d0]",
].join(" ");

export default function PrimaryNavigation({
  mobile = false,
  onNavigate,
  cmsMenus = [],
  facilitatorLinks = [],
  onFacilitatorOpen,
}) {
  const pathname = usePathname();
  const navRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const items = useMemo(
    () =>
      prepareNavigationItems(
        cmsMenus,
        facilitatorLinks
      ),
    [cmsMenus, facilitatorLinks]
  );

  function closeDropdowns(except = null) {
    const nav = navRef.current;

    if (!nav) return;

    nav
      .querySelectorAll("details[open]")
      .forEach((details) => {
        if (details !== except) {
          details.open = false;
        }
      });
  }

  function handleNavigate() {
    closeDropdowns();
    onNavigate?.();
  }

  useEffect(() => {
    const nav = navRef.current;

    if (!nav) return;

    nav.querySelectorAll("details[open]").forEach(
      (details) => {
        details.open = false;
      }
    );
  }, [pathname]);

  useEffect(() => {
    function handleOutside(event) {
      if (!navRef.current?.contains(event.target)) {
        navRef.current
          ?.querySelectorAll("details[open]")
          .forEach((details) => {
            details.open = false;
          });
      }
    }

    function handleEscape(event) {
      if (event.key !== "Escape") return;

      const openDropdown = navRef.current
        ?.querySelector("details[open]");

      if (!openDropdown) return;

      event.preventDefault();
      closeDropdowns();

      openDropdown
        .querySelector("summary")
        ?.focus();
    }

    document.addEventListener(
      "pointerdown",
      handleOutside
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutside
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );

      if (hoverTimerRef.current) {
        window.clearTimeout(
          hoverTimerRef.current
        );
      }
    };
  }, []);

  function handleDropdownOpen(event, item) {
    if (!event.currentTarget.open) return;

    closeDropdowns(event.currentTarget);

    if (
      item.label.toLowerCase().includes(
        "facilitator"
      )
    ) {
      onFacilitatorOpen?.();
    }
  }

  function handleMouseEnter(event, item) {
    if (event.pointerType !== "mouse") return;

    if (hoverTimerRef.current) {
      window.clearTimeout(
        hoverTimerRef.current
      );
    }

    closeDropdowns(event.currentTarget);

    event.currentTarget.open = true;

    if (
      item.label.toLowerCase().includes(
        "facilitator"
      )
    ) {
      onFacilitatorOpen?.();
    }
  }

  function handleMouseLeave(event) {
    if (event.pointerType !== "mouse") return;

    const details = event.currentTarget;

    hoverTimerRef.current =
      window.setTimeout(() => {
        details.open = false;
      }, 200);
  }

  function handleNavKeyDown(event) {
    const details = event.target.closest("details");

    if (
      details &&
      details.open &&
      ["ArrowDown", "ArrowUp"].includes(event.key)
    ) {
      const links = Array.from(
        details.querySelectorAll("a[href]")
      );

      if (!links.length) return;

      event.preventDefault();

      const index = links.indexOf(
        document.activeElement
      );

      const next =
        event.key === "ArrowDown"
          ? (index + 1) % links.length
          : index <= 0
            ? links.length - 1
            : index - 1;

      links[next]?.focus();
      return;
    }

    if (
      !["ArrowLeft", "ArrowRight", "Home", "End"]
        .includes(event.key)
    ) {
      return;
    }

    const targets = Array.from(
      navRef.current?.querySelectorAll(
        ':scope > ul > li > a, :scope > ul > li > button, :scope > ul > li > details > summary'
      ) || []
    );

    if (!targets.length) return;

    event.preventDefault();

    const index = targets.indexOf(
      document.activeElement
    );

    let nextIndex = 0;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % targets.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        index <= 0
          ? targets.length - 1
          : index - 1;
    } else if (event.key === "End") {
      nextIndex = targets.length - 1;
    }

    targets[nextIndex]?.focus();
  }

  if (mobile) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      onKeyDown={handleNavKeyDown}
      className="min-w-0 flex-1 max-[1080px]:hidden"
    >
      <ul className="m-0 flex list-none items-center justify-between gap-3 p-0">
        {items.map((item) => {
          const children = item.children || [];

          const active =
            isNavigationActive(
              pathname,
              item.href
            ) ||
            children.some((child) =>
              isNavigationActive(
                pathname,
                child.href
              )
            );

          if (children.length > 0) {
            return (
              <li
                key={item.id}
                className="relative shrink-0"
              >
                <details
                  className="group"
                  onToggle={(event) =>
                    handleDropdownOpen(
                      event,
                      item
                    )
                  }
                  onPointerEnter={(event) =>
                    handleMouseEnter(
                      event,
                      item
                    )
                  }
                  onPointerLeave={
                    handleMouseLeave
                  }
                >
                  <summary
                    aria-current={
                      active
                        ? "location"
                        : undefined
                    }
                    className={`${linkClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
                  >
                    <span>{item.label}</span>

                    <svg
                      className="size-3 transition-transform group-open:rotate-180"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m4 6 4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </summary>

                  <ul className="absolute top-full left-0 z-50 m-0 max-h-[min(65vh,420px)] w-60 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-[#e6edf3] bg-white p-2 shadow-[0_12px_35px_rgb(21_52_83/12%)]">
                    {children.map((child) => (
                      <li
                        key={`${item.id}:${child.href}`}
                      >
                        <Link
                          href={child.href}
                          prefetch={false}
                          aria-current={
                            isNavigationActive(
                              pathname,
                              child.href
                            )
                              ? "page"
                              : undefined
                          }
                          onClick={handleNavigate}
                          className={
                            dropdownLinkClass
                          }
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            );
          }

          if (!item.href) return null;

          return (
            <li
              key={item.id}
              className="shrink-0"
            >
              {item.href === "/contact" ? (
                <ContactTrigger
                  className={linkClass}
                  onOpen={handleNavigate}
                >
                  {item.label}
                </ContactTrigger>
              ) : (
                <Link
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  onClick={handleNavigate}
                  className={`${linkClass} ${
                    active
                      ? "text-[#0e4f87]"
                      : ""
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}