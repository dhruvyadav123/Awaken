"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { ContactTrigger } from "../common/ContactPopup";

import {
  isNavigationActive,
  prepareNavigationItems,
} from "@/lib/navigation-menu";

export default function MobileSidebar({
  cmsMenus = [],
  facilitatorLinks = [],
  onFacilitatorOpen,
  user = null,
  checking = false,
}) {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);

  const triggerRef = useRef(null);
  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const lastPathRef = useRef(pathname);

  const items = useMemo(
    () =>
      prepareNavigationItems(
        cmsMenus,
        facilitatorLinks
      ),
    [cmsMenus, facilitatorLinks]
  );

  const close = useCallback(
    (restoreFocus = true) => {
      setIsOpen(false);

      if (restoreFocus) {
        requestAnimationFrame(() => {
          triggerRef.current?.focus();
        });
      }
    },
    []
  );

  const open = useCallback(() => {
    previousFocusRef.current =
      document.activeElement;

    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;

      // Close after Next.js navigation.
      const frame = requestAnimationFrame(() => {
        setIsOpen(false);
      });

      return () => cancelAnimationFrame(frame);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const frame = requestAnimationFrame(() => {
      drawerRef.current
        ?.querySelector(
          '[data-drawer-close="true"]'
        )
        ?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;

      if (!drawer) return;

      const focusable = Array.from(
        drawer.querySelectorAll(
          [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'summary',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
          ].join(",")
        )
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

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      cancelAnimationFrame(frame);

      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen, close]);

  function handleGroupToggle(event, item) {
    if (!event.currentTarget.open) return;

    const isFacilitator =
      item.label
        .toLowerCase()
        .includes("facilitator");

    if (isFacilitator) {
      onFacilitatorOpen?.();
    }
  }

  return (
    <div className="awm-mobile-menu">
      <button
        ref={triggerRef}
        type="button"
        className="awm-mobile-trigger"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="awm-mobile-drawer"
        onClick={open}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="awm-mobile-layer">
          <button
            className="awm-mobile-backdrop"
            type="button"
            aria-label="Close navigation menu"
            tabIndex={-1}
            onClick={() => close()}
          />

          <aside
            id="awm-mobile-drawer"
            ref={drawerRef}
            className="awm-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="awm-drawer-title"
          >
            <div className="awm-drawer-header">
              <Link
                href="/"
                className="awm-drawer-brand"
                aria-label="Awaken With Meheck home"
                onClick={() => close(false)}
              >
                <Image
                  src="/images/logo/awaken.png"
                  alt="Awaken with Meheck"
                  width={126}
                  height={112}
                  priority
                />
              </Link>

              <h2
                id="awm-drawer-title"
                className="awm-sr-only"
              >
                Site navigation
              </h2>

              <button
                data-drawer-close="true"
                className="awm-drawer-close"
                type="button"
                aria-label="Close menu"
                onClick={() => close()}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="awm-drawer-account">
              {checking ? (
                <span role="status">
                  Checking account...
                </span>
              ) : user ? (
                <Link
                  href="/dashboard/user"
                  onClick={() => close(false)}
                >
                  My Profile
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => close(false)}
                  >
                    Login
                  </Link>

                  <Link
                    href="/auth/register"
                    onClick={() => close(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            <form
              className="awm-drawer-search"
              action="/search"
              method="get"
              role="search"
            >
              <label
                className="awm-sr-only"
                htmlFor="awm-drawer-search-input"
              >
                Search the website
              </label>

              <input
                id="awm-drawer-search-input"
                name="q"
                type="search"
                placeholder="Search here..."
                required
              />

              <button
                type="submit"
                aria-label="Search"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.8"
                    cy="10.8"
                    r="6.8"
                  />
                  <path d="m16 16 4.5 4.5" />
                </svg>
              </button>
            </form>

            <nav
              className="awm-drawer-navigation"
              aria-label="Mobile navigation"
            >
              <ul>
                {items.map((item) => {
                  const children =
                    item.children || [];

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

                  return (
                    <li
                      key={item.id}
                      className={
                        active
                          ? "is-active"
                          : ""
                      }
                    >
                      {children.length ? (
                        <details
                          className="awm-drawer-group"
                          onToggle={(event) =>
                            handleGroupToggle(
                              event,
                              item
                            )
                          }
                        >
                          <summary>
                            {item.label}
                          </summary>

                          <ul>
                            {children.map(
                              (child) => (
                                <li
                                  key={`${item.id}:${child.href}`}
                                >
                                  <Link
                                    href={
                                      child.href
                                    }
                                    prefetch={
                                      false
                                    }
                                    aria-current={
                                      isNavigationActive(
                                        pathname,
                                        child.href
                                      )
                                        ? "page"
                                        : undefined
                                    }
                                    onClick={() =>
                                      close(false)
                                    }
                                  >
                                    {
                                      child.label
                                    }
                                  </Link>
                                </li>
                              )
                            )}
                          </ul>
                        </details>
                      ) : item.href ===
                        "/contact" ? (
                        <ContactTrigger
                          className="awm-drawer-link"
                          onOpen={() =>
                            close(false)
                          }
                        >
                          {item.label}
                        </ContactTrigger>
                      ) : (
                        <Link
                          className="awm-drawer-link"
                          href={item.href}
                          aria-current={
                            active
                              ? "page"
                              : undefined
                          }
                          onClick={() =>
                            close(false)
                          }
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="awm-drawer-legal">
              <Link
                href="/privacy-policy"
                onClick={() => close(false)}
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                onClick={() => close(false)}
              >
                Terms
              </Link>

              <Link
                href="/refund-policy"
                onClick={() => close(false)}
              >
                Refunds
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}