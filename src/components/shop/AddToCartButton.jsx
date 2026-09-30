"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  addProductToCart,
  CART_UPDATED_EVENT,
  readCart,
} from "../../lib/cart";

function CartIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 5H6L8.4 17H21.5L23.8 8.5H7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="10.5"
        cy="22"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="20"
        cy="22"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AddToCartButton({ productId }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    function syncCart() {
      setAdded(readCart().some((item) => item.id === productId));
    }

    syncCart();

    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, [productId]);

  if (added) {
    return (
      <Link
        href="/cart"
        className="inline-flex min-h-[68px] min-w-[342px] items-center justify-between gap-8 rounded-[5px] border border-[#275744] bg-white px-7 font-[Georgia,serif] text-[19px] text-[#214737] transition duration-200 hover:bg-[#f4f6f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315c4c] max-[560px]:min-w-0 max-[560px]:flex-1"
      >
        <span className="flex items-center gap-5">
          <CartIcon />
          View your cart
        </span>

        <ArrowIcon />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => addProductToCart(productId)}
      className="inline-flex min-h-[68px] min-w-[342px] cursor-pointer items-center justify-between gap-8 rounded-[5px] border border-[#245640] bg-[#245640] px-7 font-[Georgia,serif] text-[19px] text-white transition duration-200 hover:bg-[#1b4735] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315c4c] max-[560px]:min-w-0 max-[560px]:flex-1"
    >
      <span className="flex items-center gap-5">
        <CartIcon />
        Add to cart
      </span>

      {/* <span className="text-[34px] font-light leading-none" aria-hidden="true">
        +
      </span> */}
    </button>
  );
}


