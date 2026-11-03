"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";


import { getCsrfToken } from "@/lib/client-account";
import {
  CART_UPDATED_EVENT,
  getCartItemCount,
  readCartSnapshot,
  refreshCart,
} from "@/lib/cart";
import { clearSession } from "@/lib/session";


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

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3.5 4.5h2l1.7 10.2h10.9l2-7.2H6.2" />
      <circle cx="9.2" cy="19.2" r="1.2" />
      <circle cx="17.2" cy="19.2" r="1.2" />
    </svg>
  );
}

export default function HeaderActions({ user = null, checking = false }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let active = true;

    const syncCartCount = (snapshot = readCartSnapshot()) => {
      if (active) setCartCount(getCartItemCount(snapshot?.items || []));
    };

    syncCartCount();

    const handleCartUpdate = () => syncCartCount();
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    window.addEventListener("cart:updated", handleCartUpdate);

    if (user) {
      refreshCart()
        .then((cart) => syncCartCount(cart))
        .catch(() => {
          // The cart link remains available when the account cart is temporarily unavailable.
        });
    }

    return () => {
      active = false;
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
      window.removeEventListener("cart:updated", handleCartUpdate);
    };
  }, [user]);

  const currentPath = `${pathname || "/"}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const loginHref = pathname?.startsWith("/auth/") ? "/auth/login" : `/auth/login?next=${encodeURIComponent(currentPath)}`;
  const role = String(user?.role || "").toUpperCase();
  const accountName = user?.displayName || user?.name || user?.email || "Account";

  async function logout() {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { "x-csrf-token": getCsrfToken() } });
    } finally {
      clearSession();
      setLogoutBusy(false);
      setProfileOpen(false);
      router.refresh();
    }
  }

  const [profileOpen, setProfileOpen] =
    useState(false);

  const profileRef = useRef(null);

  const profileButtonRef =
    useRef(null);

  const firstProfileItemRef =
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
      [setProfileOpen]
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
      <Link
        href="/cart"
        className="awm-icon-button awm-cart-link"
        aria-label={cartCount ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : "Cart"}
        title="Cart"
      >
        <CartIcon />
        {cartCount > 0 && <span className="awm-cart-count">{cartCount > 99 ? "99+" : cartCount}</span>}
      </Link>

      {/* PROFILE */}
      <div
        ref={profileRef}
        className="relative max-[1080px]:hidden"
        onBlur={handleProfileBlur}
      >
        <button
          ref={profileButtonRef}
          type="button"
          className="grid size-[38px] place-items-center rounded-full border border-transparent bg-transparent text-[#315b9d] transition-[background-color,border-color,transform] duration-200 hover:border-[#dbe4f1] hover:bg-[#f4f7fc] active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fb2d0] motion-reduce:transition-none [&_svg]:size-[22px] [&_svg]:stroke-current [&_svg]:stroke-[1.8] [&_svg]:stroke-linecap-round [&_svg]:stroke-linejoin-round [&_svg_circle]:fill-none"
          disabled={checking || logoutBusy}
          aria-label={checking ? "Checking account" : `Account${user ? `, ${accountName}` : ""}`}
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
            className="absolute top-[calc(100%_+_8px)] right-0 z-[70] grid w-56 overflow-hidden rounded-xl border border-[#e1e7ef] bg-white py-1 shadow-[0_12px_32px_rgb(35_57_86/14%)]"
          >
            {user ? <>
              <div className="border-b border-[#edf1f5] px-3 py-2"><p className="truncate text-xs font-semibold text-[#243b52]">{accountName}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.1em] text-[#7890aa]">{role === "FACILITATOR" ? "Facilitator account" : "Student account"}</p></div>
              <Link ref={firstProfileItemRef} role="menuitem" tabIndex={0} href={role === "FACILITATOR" ? "/dashboard/facilitator" : "/dashboard/user"} onClick={() => closeProfile(false)} className="px-3 py-2 text-[11px] font-semibold text-[#29476f] outline-none transition-colors hover:bg-[#f3f6fb] focus:bg-[#f3f6fb]">{role === "FACILITATOR" ? "Facilitator dashboard" : "My dashboard"}</Link>
              {role === "FACILITATOR" && <Link role="menuitem" tabIndex={0} href="/dashboard/user" onClick={() => closeProfile(false)} className="px-3 py-2 text-[11px] text-[#29476f] outline-none transition-colors hover:bg-[#f3f6fb] focus:bg-[#f3f6fb]">Student dashboard</Link>}
              <Link role="menuitem" tabIndex={0} href="/profile/details" onClick={() => closeProfile(false)} className="px-3 py-2 text-[11px] text-[#29476f] outline-none transition-colors hover:bg-[#f3f6fb] focus:bg-[#f3f6fb]">Profile settings</Link>
              <button type="button" role="menuitem" tabIndex={0} disabled={logoutBusy} onClick={logout} className="border-t border-[#edf1f5] px-3 py-2 text-left text-[11px] font-semibold text-[#a24f48] outline-none transition-colors hover:bg-[#fff5f3] focus:bg-[#fff5f3] disabled:opacity-60">{logoutBusy ? "Signing out…" : "Log out"}</button>
            </> : <>
              <Link ref={firstProfileItemRef} role="menuitem" tabIndex={0} href={loginHref} onClick={() => closeProfile(false)} className="px-3 py-2 text-[11px] font-semibold text-[#29476f] outline-none transition-colors hover:bg-[#f3f6fb] focus:bg-[#f3f6fb]">Sign in</Link>
              <Link role="menuitem" tabIndex={0} href={`/auth/register?next=${encodeURIComponent(currentPath)}`} onClick={() => closeProfile(false)} className="px-3 py-2 text-[11px] text-[#29476f] outline-none transition-colors hover:bg-[#f3f6fb] focus:bg-[#f3f6fb]">Create account</Link>
            </>}
          </div>
        ) : null}
      </div>
    </div>
  );
}
