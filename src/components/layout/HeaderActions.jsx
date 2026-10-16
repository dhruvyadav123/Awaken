"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";


import {
  CART_UPDATED_EVENT,
  getCartItemCount,
  readCart,
  refreshCart,
} from "../../lib/cart";

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 3.5h2l2.1 10.3a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 7H5.8" />

      <circle
        cx="9.5"
        cy="19.5"
        r="1.4"
      />

      <circle
        cx="18"
        cy="19.5"
        r="1.4"
      />
    </svg>
  );
}


function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="7.2"
        r="3.7"
      />

      <path d="M4.5 21v-1.4a7.5 7.5 0 0 1 15 0V21Z" />
    </svg>
  );
}

export default function HeaderActions({ user = null, checking = false }) {
  const pathname = usePathname();

  const [cartCount, setCartCount] =
    useState(0);

  const [cartPulse, setCartPulse] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const profileRef = useRef(null);

  const profileButtonRef =
    useRef(null);

  const firstProfileItemRef =
    useRef(null);

  const previousCartCountRef =
    useRef(0);

  const cartInitializedRef =
    useRef(false);

  const pulseTimerRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | CLOSE PROFILE ON ROUTE CHANGE
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const timer = setTimeout(() => setProfileOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  /*
  |--------------------------------------------------------------------------
  | CART SYNC
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    function syncCartCount() {
      const nextCount =
        getCartItemCount(
          readCart()
        );

      /*
       * Don't animate first client sync.
       */
      if (
        cartInitializedRef.current &&
        nextCount !==
          previousCartCountRef.current
      ) {
        setCartPulse(true);

        window.clearTimeout(
          pulseTimerRef.current
        );

        pulseTimerRef.current =
          window.setTimeout(() => {
            setCartPulse(false);
          }, 420);
      }

      previousCartCountRef.current =
        nextCount;

      cartInitializedRef.current =
        true;

      setCartCount(nextCount);
    }

    syncCartCount();
    refreshCart().catch(() => {});

    window.addEventListener(
      CART_UPDATED_EVENT,
      syncCartCount
    );

    window.addEventListener(
      "storage",
      syncCartCount
    );

    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        syncCartCount
      );

      window.removeEventListener(
        "storage",
        syncCartCount
      );

      window.clearTimeout(
        pulseTimerRef.current
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLOSE PROFILE
  |--------------------------------------------------------------------------
  */
  const closeProfile =
    useCallback(
      (restoreFocus = false) => {
        setProfileOpen(false);

        if (restoreFocus) {
          requestAnimationFrame(
            () => {
              profileButtonRef.current?.focus();
            }
          );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | PROFILE EVENTS
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!profileOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (
        !profileRef.current?.contains(
          event.target
        )
      ) {
        closeProfile(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();

        closeProfile(true);

        return;
      }

      const panel =
        profileRef.current;

      if (!panel) return;

      const items = Array.from(
        panel.querySelectorAll(
          '[role="menuitem"]'
        )
      ).filter(
        (item) =>
          !item.hasAttribute(
            "disabled"
          )
      );

      if (!items.length) return;

      const currentIndex =
        items.indexOf(
          document.activeElement
        );

      if (
        event.key ===
        "ArrowDown"
      ) {
        event.preventDefault();

        const nextIndex =
          currentIndex < 0
            ? 0
            : (currentIndex + 1) %
              items.length;

        items[nextIndex]?.focus();

        return;
      }

      if (
        event.key === "ArrowUp"
      ) {
        event.preventDefault();

        const nextIndex =
          currentIndex <= 0
            ? items.length - 1
            : currentIndex - 1;

        items[nextIndex]?.focus();

        return;
      }

      if (event.key === "Home") {
        event.preventDefault();

        items[0]?.focus();

        return;
      }

      if (event.key === "End") {
        event.preventDefault();

        items[
          items.length - 1
        ]?.focus();
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    profileOpen,
    closeProfile,
  ]);

  function openProfile({
    focusLast = false,
  } = {}) {
    setProfileOpen(true);

    requestAnimationFrame(() => {
      if (focusLast) {
        const items =
          profileRef.current?.querySelectorAll(
            '[role="menuitem"]'
          );

        items?.[
          items.length - 1
        ]?.focus();

        return;
      }

      firstProfileItemRef.current?.focus();
    });
  }

  function toggleProfile() {
    if (profileOpen) {
      closeProfile(false);
    } else {
      openProfile();
    }
  }

  function handleProfileButtonKeyDown(
    event
  ) {
    if (
      event.key === "ArrowDown"
    ) {
      event.preventDefault();

      openProfile();

      return;
    }

    if (
      event.key === "ArrowUp"
    ) {
      event.preventDefault();

      openProfile({
        focusLast: true,
      });
    }
  }

  function handleProfileBlur(event) {
    const nextElement =
      event.relatedTarget;

    if (
      nextElement &&
      profileRef.current?.contains(
        nextElement
      )
    ) {
      return;
    }

    setProfileOpen(false);
  }

  return (
    <div className="ml-auto flex shrink-0 items-center gap-[13px]">
      {/* CART */}
      <Link
        href="/cart"
        className="relative grid size-[38px] place-items-center rounded-full border border-transparent bg-transparent text-[#315b9d] transition-[background-color,border-color,transform] duration-200 hover:border-[#dbe4f1] hover:bg-[#f4f7fc] active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb2d0] motion-reduce:transition-none [&_svg]:size-[22px] [&_svg]:stroke-current [&_svg]:stroke-[1.8] [&_svg]:stroke-linecap-round [&_svg]:stroke-linejoin-round [&_svg_circle]:fill-none"
        aria-label={
          cartCount
            ? `Shopping cart, ${cartCount} item${
                cartCount === 1
                  ? ""
                  : "s"
              }`
            : "Shopping cart, empty"
        }
        title="Cart"
      >
        <CartIcon />

        {cartCount > 0 ? (
          <span
            className={[
              "absolute -top-0.5 -right-0.5 grid min-h-[17px] min-w-[17px]",
              "place-items-center rounded-[9px] border border-white",
              "bg-[#bf6255] px-1 text-[9px] leading-none font-bold text-white",
              "transition-transform duration-300 motion-reduce:transition-none",
              cartPulse
                ? "scale-[1.28]"
                : "scale-100",
            ].join(" ")}
            aria-hidden="true"
          >
            {cartCount > 99
              ? "99+"
              : cartCount}
          </span>
        ) : null}

        <span
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {cartCount
            ? `${cartCount} item${
                cartCount === 1
                  ? ""
                  : "s"
              } in cart`
            : "Cart is empty"}
        </span>
      </Link>

      {/* PROFILE */}
      {user ? <Link href="/dashboard/user" aria-label="Profile, open User Dashboard" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#315b9d] hover:bg-[#f4f7fc] max-[1080px]:hidden [&_svg]:size-[22px] [&_svg]:stroke-current [&_svg]:stroke-[1.8]"><ProfileIcon /><span>Profile</span></Link> : <div
        ref={profileRef}
        className="relative max-[1080px]:hidden"
        onBlur={handleProfileBlur}
      >
        <button
          ref={profileButtonRef}
          type="button"
          className="grid size-[38px] place-items-center rounded-full border border-transparent bg-transparent text-[#315b9d] transition-[background-color,border-color,transform] duration-200 hover:border-[#dbe4f1] hover:bg-[#f4f7fc] active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb2d0] motion-reduce:transition-none [&_svg]:size-[22px] [&_svg]:stroke-current [&_svg]:stroke-[1.8] [&_svg]:stroke-linecap-round [&_svg]:stroke-linejoin-round [&_svg_circle]:fill-none"
          disabled={checking}
          aria-label={checking ? "Checking account" : "Account"}
          aria-haspopup="menu"
          aria-expanded={
            profileOpen
          }
          aria-controls="awm-profile-panel"
          onClick={toggleProfile}
          onKeyDown={
            handleProfileButtonKeyDown
          }
        >
          <ProfileIcon />
        </button>

        {profileOpen ? (
          <div
            id="awm-profile-panel"
            role="menu"
            aria-label="Account menu"
            className="absolute top-[calc(100%_+_8px)] right-0 z-[70] grid min-w-[136px] border-b border-[#e1e7ef] bg-white py-[5px] shadow-[0_12px_32px_rgb(35_57_86/10%)]"
          >
            <Link
              ref={
                firstProfileItemRef
              }
              role="menuitem"
              tabIndex={0}
              href="/auth/login"
              onClick={() =>
                closeProfile(false)
              }
              className="px-[10px] py-[9px] text-xs text-[#29476f] outline-none transition-colors hover:bg-[#f3f6fb] focus:bg-[#f3f6fb]"
            >
              Sign in
            </Link>

            <Link
              role="menuitem"
              tabIndex={0}
              href="/auth/register"
              onClick={() =>
                closeProfile(false)
              }
              className="px-[10px] py-[9px] text-xs text-[#29476f] outline-none transition-colors hover:bg-[#f3f6fb] focus:bg-[#f3f6fb]"
            >
              Create account
            </Link>
          </div>
        ) : null}
      </div>}
    </div>
  );
}
