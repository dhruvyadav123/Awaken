"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { addProductToCart } from "@/lib/cart";
import { formatProductPrice } from "@/lib/product-format";

function getVariantId(variant) {
  return String(
    variant?.id || variant?._id || ""
  );
}

export default function AddToCartButton({
  productId,
  variants = [],
  disabled = false,
  showIcon = true,
  compact = false,
  className = "",
  buttonClassName = "",
}) {
  const options = Array.isArray(variants)
    ? variants.filter((variant) => getVariantId(variant))
    : [];

  const [variantId, setVariantId] = useState(
    options.length === 1
      ? getVariantId(options[0])
      : ""
  );

  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedVariant =
    options.find(
      (variant) => getVariantId(variant) === variantId
    ) || null;

  const selectedUnavailable =
    Boolean(selectedVariant?.status && selectedVariant.status !== "ACTIVE") ||
    selectedVariant?.inStock === false ||
    selectedVariant?.isAvailable === false ||
    selectedVariant?.stockStatus === "OUT_OF_STOCK";

  const canAdd =
    Boolean(productId) &&
    !disabled &&
    !busy &&
    !selectedUnavailable &&
    (options.length === 0 || Boolean(variantId));

  async function handleAddToCart() {
    if (lock.current || !canAdd) return; lock.current = true;

    setBusy(true);
    setMessage("");
    setSuccess(false);

    try {
      const result = await addProductToCart(
        productId,
        variantId || undefined
      );

      if (
        result?.success === false ||
        result?.error
      ) {
        throw new Error(
          result?.message ||
          result?.error ||
          "Unable to add this product."
        );
      }

      setSuccess(true);
      setMessage("Product added to your cart.");

      // Notify cart-count components if they listen
      // for local cart updates.
      window.dispatchEvent(
        new CustomEvent("cart:updated", {
          detail: { productId, variantId },
        })
      );
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not add this product to your cart."
      );
    } finally {
      lock.current = false; setBusy(false);
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {selectedVariant && <p className={`${compact ? "mb-2 text-xs" : "mb-3 text-sm"} font-semibold text-[#315a48]`}>{selectedVariant.name || selectedVariant.title}: {formatProductPrice(selectedVariant)}</p>}
      {options.length > 1 && (
        <div className={compact ? "mb-4" : "mb-5"}>
          <label
            htmlFor={`variant-${productId}`}
            className={`${compact ? "mb-1.5 text-xs" : "mb-2 text-sm"} block font-medium text-[#263a31]`}
          >
            Select an option
          </label>

          <select
            id={`variant-${productId}`}
            value={variantId}
            onChange={(event) => {
              setVariantId(event.target.value);
              setMessage("");
              setSuccess(false);
            }}
            className={`${compact ? "h-10 rounded-lg px-3 text-xs" : "h-11 rounded-lg px-4 text-sm"} w-full border border-[#dce6df] bg-white text-[#263a31] outline-none transition focus:border-[#38684d] focus:ring-2 focus:ring-[#38684d]/10`}
          >
            <option value="">
              Choose an option
            </option>

            {options.map((variant) => {
              const id = getVariantId(variant);

              const unavailable =
                Boolean(variant.status && variant.status !== "ACTIVE") ||
                variant.inStock === false ||
                variant.isAvailable === false ||
                variant.stockStatus === "OUT_OF_STOCK";

              return (
                <option
                  key={id}
                  value={id}
                  disabled={unavailable}
                >
                  {variant.title ||
                    variant.name ||
                    variant.label ||
                    "Product option"}

                  {unavailable
                    ? " — Out of stock"
                    : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAdd}
          className={`${compact ? "min-h-10 rounded-lg px-3 py-2 text-xs" : "min-h-11 rounded-lg px-5 py-2.5 text-sm"} ${buttonClassName} inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 bg-[#28563e] font-semibold text-white transition duration-200 hover:bg-[#1c412e] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {busy ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Adding...
            </>
          ) : (
            <>
              {showIcon && (
                <svg
                  className={compact ? "size-3.5" : "size-4"}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.5 13h12l2-9H6" />
                </svg>
              )}
              {disabled || selectedUnavailable
                ? "Out of stock"
                : "Add to cart"}
            </>
          )}
        </button>

        {success && (
          <Link
            href="/cart"
            className={`${compact ? "min-h-10 rounded-lg px-3 text-xs" : "min-h-11 rounded-lg px-4 text-sm"} inline-flex items-center justify-center border border-[#cdded1] bg-white font-semibold text-[#28563e] transition hover:bg-[#f2f7f3]`}
          >
            View cart →
          </Link>
        )}
      </div>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`${compact ? "mt-2 px-2.5 py-2 text-xs leading-5" : "mt-3 px-3 py-2.5 text-sm leading-6"} rounded-lg ${
            success
              ? "bg-[#eff7f0] text-[#28563e]"
              : "bg-[#fff3ef] text-[#9a493a]"
          }`}
        >
          {message}

          {!success &&
            /sign.in|login|unauthori[sz]ed|401/i.test(
              message
            ) && (
              <Link
                href="/auth/login?next=%2Fcart"
                className="ml-2 font-semibold underline underline-offset-2"
              >
                Sign in
              </Link>
            )}
        </div>
      )}
    </div>
  );
}
