"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatPrice, products } from "../../data/products";
import {
  CART_UPDATED_EVENT,
  readCart,
  removeProductFromCart,
} from "../../lib/cart";

function EmptyCartIcon() {
  return (
    <div
      className="flex h-[148px] w-[180px] items-center justify-center rounded-full bg-[#f5f6ef]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 180 140"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="91"
          cy="112"
          rx="57"
          ry="13"
          fill="#F2F4EC"
        />

        <path
          d="M54 103C43 90 42 75 47 61C55 68 61 77 62 89C63 95 61 100 54 103Z"
          fill="#9DAF83"
        />
        <path
          d="M45 93C32 89 25 79 22 67C34 69 43 76 48 87C50 91 49 93 45 93Z"
          fill="#B7C4A0"
        />
        <path
          d="M58 86C58 73 64 62 74 53C77 67 74 78 65 88C62 91 59 90 58 86Z"
          fill="#819A6A"
        />

        <path
          d="M54 105C51 88 50 73 56 58"
          stroke="#6E825A"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M116 52H77L82 84H126L133 61H83"
          stroke="#405428"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx="90"
          cy="94"
          r="5"
          stroke="#405428"
          strokeWidth="3"
        />
        <circle
          cx="120"
          cy="94"
          r="5"
          stroke="#405428"
          strokeWidth="3"
        />

        <path
          d="M134 42L136 47L141 49L136 51L134 56L132 51L127 49L132 47L134 42Z"
          fill="#D7C67D"
        />
      </svg>
    </div>
  );
}

export default function CartContents() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    function syncCart() {
      setCart(readCart());
    }

    syncCart();

    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const items = cart
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.id),
    }))
    .filter((item) => item.product);

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const currency = items[0]?.product.currency || "INR";

  if (!items.length) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-[linear-gradient(180deg,#f7f8f3_0%,#fcfcf9_38%,#fcfcf9_100%)]">
        <div className="mx-auto w-[min(100%-48px,1120px)] pb-20 pt-5 max-[720px]:w-[min(100%-36px,560px)] max-[380px]:w-[min(100%-28px,560px)]">
          <div className="border-b border-[#e7e9e4] pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[1.7px] text-[#587361]">
              Awaken With Meheck / Cart
            </p>
          </div>

          <section className="mx-auto mt-10 flex min-h-[500px] max-w-[760px] flex-col items-center justify-center rounded-[18px] border border-[#e4e8df] bg-white/75 px-6 py-16 text-center shadow-[0_20px_55px_rgba(43,63,49,.06)] backdrop-blur-sm max-[720px]:mt-6 max-[720px]:min-h-[460px]">
            <EmptyCartIcon />

            <h1 className="mt-4 font-[Georgia,serif] text-[42px] font-normal leading-[1.15] text-[#263f35] max-[720px]:text-[34px]">
              Your cart is empty.
            </h1>

            <p className="mt-4 max-w-[470px] text-[14px] leading-7 text-[#6b746d]">
              Choose a thoughtful read from the shop and it will appear here, ready for your next quiet moment.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex min-h-[46px] items-center justify-center gap-7 rounded-[4px] bg-[#244f3d] px-6 text-[12px] font-semibold !text-white transition hover:bg-[#193c2e] hover:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#567aa9]"
            >
              View eBook in the Shop
              <span aria-hidden="true">&rarr;</span>
            </Link>
              <div className="mt-10 grid w-full max-w-[560px] grid-cols-3 border-t border-[#e4e8df] pt-6 text-left max-[560px]:grid-cols-1 max-[560px]:gap-4 max-[560px]:text-center">
                <div className="px-5 max-[560px]:px-0"><strong className="block text-[11px] font-semibold text-[#29483a]">Digital format</strong><span className="mt-1 block text-[10px] leading-5 text-[#7a847c]">Read at your own pace</span></div>
                <div className="border-x border-[#e4e8df] px-5 max-[560px]:border-x-0 max-[560px]:px-0"><strong className="block text-[11px] font-semibold text-[#29483a]">Mindful reading</strong><span className="mt-1 block text-[10px] leading-5 text-[#7a847c]">Made for quieter moments</span></div>
                <div className="px-5 max-[560px]:px-0"><strong className="block text-[11px] font-semibold text-[#29483a]">Simple access</strong><span className="mt-1 block text-[10px] leading-5 text-[#7a847c]">No physical delivery</span></div>
              </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[linear-gradient(180deg,#f7f8f3_0%,#fcfcf9_280px)]">
      <div className="mx-auto w-[min(100%-48px,1120px)] pb-20 pt-5 max-[720px]:w-[min(100%-36px,560px)] max-[380px]:w-[min(100%-28px,560px)]">
        <header className="border-b border-[#e7e9e4] pb-7">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[1.7px] text-[#587361]">
            Awaken With Meheck / Cart
          </p>

          <h1 className="font-[Georgia,serif] text-[48px] font-normal leading-[1.1] text-[#263f35] max-[720px]:text-[38px]">
            Your cart
          </h1>

          <p className="mt-3 text-[14px] leading-7 text-[#69736c]">
            Review your selection before continuing.
          </p>
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-12 pt-8 max-[900px]:grid-cols-[minmax(0,1fr)_280px] max-[900px]:gap-8 max-[720px]:grid-cols-1 max-[720px]:gap-8">
          <section className="space-y-4" aria-label="Items in your cart">
            {items.map(({ id, quantity, product }) => (
              <article
                key={id}
                className="grid grid-cols-[82px_minmax(0,1fr)_auto] gap-5 rounded-[10px] border border-[#e4e8e2] bg-white p-5 shadow-[0_8px_24px_rgba(43,63,49,.04)] transition-shadow hover:shadow-[0_12px_30px_rgba(43,63,49,.07)] max-[480px]:grid-cols-[70px_minmax(0,1fr)] max-[480px]:gap-4 max-[480px]:p-4"
              >
                <div className="overflow-hidden rounded-[2px] bg-[#f1f1eb] shadow-[0_7px_18px_rgba(48,66,52,0.12)]">
                  <Image
                    src={product.cover}
                    alt={`Cover of ${product.title}`}
                    width={100}
                    height={132}
                    className="h-[108px] w-[82px] object-cover max-[480px]:h-[94px] max-[480px]:w-[70px]"
                  />
                </div>

                <div className="min-w-0 pt-1">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[1.7px] text-[#55745f]">
                    {product.format}
                  </p>

                  <h2 className="font-[Georgia,serif] text-[21px] font-normal leading-[1.3] text-[#263f35]">
                    {product.title}
                  </h2>

                  <p className="mt-1 text-[12px] text-[#717b73]">
                    By {product.author}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeProductFromCart(id)}
                    className="mt-5 cursor-pointer border-0 border-b border-[#aeb8ae] bg-transparent px-0 pb-[2px] text-[11px] text-[#667169] transition hover:border-[#324e3d] hover:text-[#324e3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#567aa9]"
                  >
                    Remove
                  </button>
                </div>

                <strong className="pt-5 text-[14px] font-semibold text-[#29483a] max-[480px]:col-start-2 max-[480px]:pt-0">
                  {formatPrice({
                    ...product,
                    price: product.price * quantity,
                  })}
                </strong>
              </article>
            ))}
          </section>

          <aside
            aria-label="Order summary"
            className="sticky top-6 rounded-[12px] border border-[#dde3da] bg-[#f5f6f0] p-6 shadow-[0_14px_38px_rgba(43,63,49,.07)] max-[720px]:static max-[720px]:w-full"
          >
            <h2 className="font-[Georgia,serif] text-[24px] font-normal text-[#233d32]">
              Order summary
            </h2>

            <div className="mt-5 flex items-center justify-between border-t border-[#dfe4dc] py-4 text-[13px] text-[#657067]">
              <span>Subtotal</span>
              <strong className="font-semibold text-[#29483a]">
                {formatPrice({
                  currency,
                  price: total,
                })}
              </strong>
            </div>

            <div className="flex items-center justify-between border-t border-[#dfe4dc] py-4 text-[13px] text-[#657067]">
              <span>Format</span>
              <span className="font-semibold text-[#29483a]">
                Digital eBook
              </span>
            </div>

            <p className="border-t border-[#dfe4dc] pt-4 text-[12px] leading-[1.8] text-[#6a746c]">
              Secure checkout and eBook delivery are not connected yet.
            </p>

            <button
              type="button"
              disabled
              className="mt-5 min-h-[44px] w-full cursor-not-allowed rounded-[4px] border-0 bg-[#d8dcd5] text-[12px] font-medium text-[#7a817a]"
            >
              Checkout coming soon
            </button>

            <Link
              href="/shop"
              className="mt-5 flex items-center justify-center gap-4 text-[11px] font-medium text-[#315a48] transition hover:text-[#183d2d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#567aa9]"
            >
              Continue browsing
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
