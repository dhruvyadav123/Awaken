"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { usePathname } from "next/navigation";

import PrimaryNavigation from "./PrimaryNavigation";
import HeaderActions from "./HeaderActions";
import MobileSidebar from "./MobileSidebar";
import HeaderCommandPalette from "./HeaderCommandPalette";

import useVerifiedAccount from "@/hooks/useVerifiedAccount";

function isEditableElement(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"]'
    )
  );
}

export default function Navbar({
  cmsMenus = [],
}) {
  const pathname = usePathname();

  const account = useVerifiedAccount(pathname);

  const [facilitatorLinks, setFacilitatorLinks] =
    useState([]);

  const [commandOpen, setCommandOpen] =
    useState(false);

  const searchInputRef = useRef(null);

  const facilitatorRequestRef = useRef(null);

  const mountedRef = useRef(false);

  const closeCommand = useCallback(() => {
    setCommandOpen(false);
  }, []);

  const toggleCommand = useCallback(() => {
    setCommandOpen((current) => !current);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadFacilitators = useCallback(() => {
    if (facilitatorRequestRef.current) {
      return facilitatorRequestRef.current;
    }

    const request = fetch(
      "/api/navigation/facilitators",
      {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Facilitator menu request failed: ${response.status}`
          );
        }

        return response.json();
      })
      .then((result) => {
        const links = Array.isArray(
          result?.links
        )
          ? result.links
          : Array.isArray(result?.data?.links)
            ? result.data.links
            : Array.isArray(result?.data)
              ? result.data
              : [];

        if (mountedRef.current) {
          setFacilitatorLinks(links);
        }

        return links;
      })
      .catch((error) => {
        facilitatorRequestRef.current = null;

        if (
          process.env.NODE_ENV === "development"
        ) {
          console.warn(
            "Facilitator navigation:",
            error.message
          );
        }

        return [];
      });

    facilitatorRequestRef.current = request;

    return request;
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setCommandOpen(false);
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    function handleGlobalKeyDown(event) {
      if (typeof event.key !== "string") return;

      const key = event.key.toLowerCase();

      if (
        (event.ctrlKey || event.metaKey) &&
        key === "k"
      ) {
        event.preventDefault();
        toggleCommand();
        return;
      }

      if (
        event.key === "/" &&
        !isEditableElement(event.target) &&
        !commandOpen &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();

        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }

    window.addEventListener(
      "keydown",
      handleGlobalKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown
      );
    };
  }, [commandOpen, toggleCommand]);

  function handleSearchKeyDown(event) {
    if (event.key !== "Escape") return;

    event.preventDefault();

    if (event.currentTarget.value) {
      event.currentTarget.value = "";
    } else {
      event.currentTarget.blur();
    }
  }

  return (
    <>
      <header className="sticky top-0 z-[60] w-full bg-white shadow-[0_1px_0_rgb(35_57_86/8%)]">
        {/* TOP SEARCH BAR */}
        <div className="bg-[#f4f5f7]">
          <div className="mx-auto flex min-h-[42px] w-[min(100%-40px,1280px)] items-center justify-end max-[520px]:min-h-10 max-[1080px]:w-[min(100%-32px,1280px)]">
            <form
              action="/search"
              method="get"
              role="search"
              className="flex h-8 gap-[5px] max-[520px]:w-[min(100%,340px)]"
            >
              <label
                htmlFor="awm-site-search"
                className="sr-only"
              >
                Search the website
              </label>

              <div className="flex min-w-44 items-center gap-[7px] rounded-[7px] border border-[#d7dce5] bg-white px-[10px] transition-[border-color,box-shadow] duration-200 focus-within:border-[#9eb7d1] focus-within:shadow-[0_0_0_2px_rgb(49_91_157/8%)] max-[520px]:min-w-0 max-[520px]:flex-1">
                <svg
                  className="size-[15px] shrink-0 stroke-[#71809a] stroke-[1.7]"
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

                <input
                  ref={searchInputRef}
                  id="awm-site-search"
                  name="q"
                  type="search"
                  placeholder="Search ..."
                  autoComplete="off"
                  aria-keyshortcuts="/"
                  onKeyDown={
                    handleSearchKeyDown
                  }
                  className="w-full min-w-0 border-0 bg-transparent text-xs text-[#27456d] outline-0 [font:inherit] placeholder:text-[#8a96a7]"
                />
              </div>

              <button
                type="submit"
                className="cursor-pointer rounded-md border-0 bg-[#315b9d] px-[13px] text-xs text-white transition-[background-color,transform] duration-150 hover:bg-[#244676] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb2d0] motion-reduce:transition-none"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* MAIN HEADER */}
        <div className="mx-auto flex min-h-[68px] w-[min(100%-40px,1280px)] items-center gap-[clamp(14px,1.4vw,20px)] max-[1080px]:min-h-16 max-[1080px]:w-[min(100%-32px,1280px)]">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fb2d0]"
            aria-label="Awaken with Meheck home"
          >
            <Image
              src="/images/logo/awaken.png"
              alt="Awaken with Meheck"
              width={76}
              height={78}
              priority
              sizes="76px"
              className="block h-14 w-[54px] object-contain max-[520px]:h-[50px] max-[520px]:w-12"
            />
          </Link>

          <PrimaryNavigation
            cmsMenus={cmsMenus}
            facilitatorLinks={
              facilitatorLinks
            }
            onFacilitatorOpen={
              loadFacilitators
            }
          />

          <HeaderActions
            user={account.user}
            checking={account.checking}
          />

          <MobileSidebar
            cmsMenus={cmsMenus}
            facilitatorLinks={
              facilitatorLinks
            }
            onFacilitatorOpen={
              loadFacilitators
            }
            user={account.user}
            checking={account.checking}
          />
        </div>
      </header>

      {commandOpen && (
        <HeaderCommandPalette
          open={commandOpen}
          onClose={closeCommand}
        />
      )}
    </>
  );
}
