"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CART_UPDATED_EVENT, getCartItemCount, readCart } from "../../lib/cart";

function CartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 3.5h2l2.1 10.3a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 7H5.8" />
    <circle cx="9.5" cy="19.5" r="1.4" /><circle cx="18" cy="19.5" r="1.4" />
  </svg>;
}

function ProfileIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="7.2" r="3.7" /><path d="M4.5 21v-1.4a7.5 7.5 0 0 1 15 0V21Z" />
  </svg>;
}

export default function HeaderActions() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [openProfilePath, setOpenProfilePath] = useState(null);
  const profileOpen = openProfilePath === pathname;
  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);

  useEffect(() => {
    function syncCartCount() {
      setCartCount(getCartItemCount(readCart()));
    }
    syncCartCount();
    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
    window.addEventListener("storage", syncCartCount);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function onPointerDown(event) {
      if (!profileRef.current?.contains(event.target)) setOpenProfilePath(null);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpenProfilePath(null);
        profileButtonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  return <div className="ml-auto flex shrink-0 items-center gap-[13px]">
    <Link href="/cart" className="relative grid size-[38px] place-items-center rounded-full border border-transparent bg-transparent text-[#315b9d] hover:border-[#dbe4f1] hover:bg-[#f4f7fc] [&_svg]:size-[22px] [&_svg]:stroke-current [&_svg]:stroke-[1.8] [&_svg]:stroke-linecap-round [&_svg]:stroke-linejoin-round [&_svg_circle]:fill-none" aria-label={cartCount ? `Shopping cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Shopping cart, empty"} title="Cart">
      <CartIcon />
      {cartCount > 0 ? <span className="absolute -top-0.5 -right-0.5 grid min-h-[17px] min-w-[17px] place-items-center rounded-[9px] border border-white bg-[#bf6255] px-1 text-[9px] leading-none font-bold text-white" aria-hidden="true">{cartCount}</span> : null}
    </Link>
    <div className="relative max-[1080px]:hidden" ref={profileRef}>
      <button ref={profileButtonRef} type="button" className="grid size-[38px] place-items-center rounded-full border border-transparent bg-transparent text-[#315b9d] hover:border-[#dbe4f1] hover:bg-[#f4f7fc] [&_svg]:size-[22px] [&_svg]:stroke-current [&_svg]:stroke-[1.8] [&_svg]:stroke-linecap-round [&_svg]:stroke-linejoin-round [&_svg_circle]:fill-none" aria-label="Account"
        aria-expanded={profileOpen} aria-controls="awm-profile-panel" onClick={() => setOpenProfilePath(profileOpen ? null : pathname)}>
        <ProfileIcon />
      </button>
      {profileOpen ? <div id="awm-profile-panel" className="absolute top-[calc(100%_+_8px)] right-0 z-[70] grid min-w-[136px] border-b border-[#e1e7ef] bg-white py-[5px]">
        <Link className="px-[10px] py-[9px] text-xs text-[#29476f] hover:bg-[#f3f6fb]" href="/auth/login" onClick={() => setOpenProfilePath(null)}>Sign in</Link>
        <Link className="px-[10px] py-[9px] text-xs text-[#29476f] hover:bg-[#f3f6fb]" href="/auth/register" onClick={() => setOpenProfilePath(null)}>Create account</Link>
      </div> : null}
    </div>
  </div>;
}
 
