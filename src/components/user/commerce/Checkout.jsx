
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import {
  refreshCart,
  CART_UPDATED_EVENT,
  readCartSnapshot,
  removeProductFromCart,
} from "@/lib/cart";
import {
  allAccountPages,
  checkoutBody,
} from "@/lib/student-flow";
import { formatProductPrice } from "@/lib/product-format";
import { cartMediaRecord } from "@/lib/cart-media";
import { recordMedia } from "@/lib/record-display";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import AddressBook from "@/components/user/profile/AddressBook";
import { openRazorpayCheckout } from "./RazorpayCheckout";

const primary =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#315a48] px-5 text-sm font-semibold text-white transition hover:bg-[#244535] disabled:cursor-not-allowed disabled:opacity-50";

const panel =
  "rounded-xl border border-[#e3e9e4] bg-white p-5 sm:p-6";

function messageOf(error) {
  const message =
    error?.message || "Something went wrong. Please try again.";

  if (error?.code === "MEMBERSHIP_OVERLAP") {
    return `${message} You already have an active or pending membership. Remove the membership item from your cart, or use the existing membership renewal flow.`;
  }

  const versionConflict = [
    "CART_VERSION_CONFLICT",
    "ORDER_VERSION_CONFLICT",
    "CHECKOUT_VERSION_CONFLICT",
    "ADDRESS_VERSION_CONFLICT",
    "VERSION_CONFLICT",
  ].includes(error?.code);

  return (versionConflict || (error?.status === 409 && !error?.code))
    ? `${message} Your cart or order details may have changed. Refresh before continuing.`
    : message;
}

function isMembershipCartItem(item) {
  return String(item?.itemType || "").toUpperCase() === "MEMBERSHIP";
}

function createIntentKey() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `checkout-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function paymentParts(result) {
  const root = result?.data && typeof result.data === "object" ? result.data : result || {};
  const payment = root.payment || root.paymentRecord || root;
  const checkout = root.checkout || root.providerOrder || root.razorpay || {};
  return { root, payment, checkout };
}

function providerOrderIdFrom(result) {
  const { root, payment, checkout } = paymentParts(result);
  return firstString(
    checkout.id,
    checkout.order_id,
    checkout.orderId,
    root.providerOrderId,
    root.razorpayOrderId,
    root.razorpay_order_id,
    payment.providerOrderId,
    payment.razorpayOrderId,
    payment.razorpay_order_id
  );
}

function paymentIdFrom(result) {
  const { root, payment } = paymentParts(result);
  return firstString(
    payment.id,
    root.paymentId,
    root.payment?.id,
    root.id
  );
}

function razorpayKeyFrom(result) {
  const { root, payment, checkout } = paymentParts(result);
  return firstString(
    checkout.key,
    checkout.key_id,
    checkout.keyId,
    root.key,
    root.keyId,
    root.razorpayKeyId,
    root.razorpay_key_id,
    payment.keyId,
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  );
}

function paymentAmountInPaise(result, fallbackAmount) {
  const { root, payment, checkout } = paymentParts(result);
  const explicitPaise = [
    checkout.amountPaise,
    checkout.amountInPaise,
    root.amountPaise,
    root.amountInPaise,
    payment.amountPaise,
    payment.amountInPaise,
  ].find((value) => Number.isFinite(Number(value)));
  if (explicitPaise !== undefined) return Math.round(Number(explicitPaise));

  if (Number.isFinite(Number(checkout.amount))) return Math.round(Number(checkout.amount));
  const rupees = [payment.amount, root.amount, fallbackAmount].find((value) => Number.isFinite(Number(value)));
  return Number.isFinite(Number(rupees)) ? Math.round(Number(rupees) * 100) : 0;
}

function paymentCurrencyFrom(result, fallbackCurrency) {
  const { root, payment, checkout } = paymentParts(result);
  return firstString(checkout.currency, root.currency, payment.currency, fallbackCurrency, "INR");
}

function isPaidOrder(order) {
  const rawTotal = [
    order?.grandTotal,
    order?.totalAmount,
    order?.total,
  ].find((value) => value !== null && value !== undefined && value !== "");
  const total = Number(rawTotal);
  const paymentStatus = String(
    order?.paymentStatus || order?.payment?.status || ""
  ).toUpperCase();

  // Do not infer a paid order from a missing amount or a generic order status.
  // Only free orders or an explicit payment status can skip Razorpay.
  return (
    (Number.isFinite(total) && total <= 0) ||
    ["PAID", "CAPTURED", "SUCCESS", "SUCCEEDED"].includes(paymentStatus)
  );
}

function Money({ value, currency = "INR" }) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return <span>—</span>;
  }

  return (
    <>
      {formatProductPrice({
        price: Number(value),
        currency,
      })}
    </>
  );
}

function CartItem({ item, currency }) {
  const itemType = String(item.itemType || (item.product ? "PRODUCT" : item.sessionTypeId ? "SESSION" : item.courseId ? "COURSE" : item.planId || item.membershipPlanId ? "MEMBERSHIP" : "")).toUpperCase();
  const product = itemType === "PRODUCT" ? item.product || {} : {};
  const imageRecord = cartMediaRecord(item);
  const title = product.name || item.name || item.title || item.snapshot?.title || item.snapshot?.name || imageRecord.name || imageRecord.title || (itemType === "SESSION" ? "Session" : itemType === "COURSE" ? "Course" : itemType === "MEMBERSHIP" ? "Membership" : "Item");

  const variant =
    item.variant?.name ||
    item.productVariant?.name ||
    product.variant?.name;

  const hasImage = recordMedia(imageRecord, { imagesOnly: true }).length > 0;

  return (
    <li className="flex gap-4 border-b border-[#edf0ed] py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f1f4f0] text-[#8a9e8e] [&_img]:!h-full [&_img]:!w-full [&_img]:!object-cover">
        {hasImage ? (
          <RecordMedia record={imageRecord} compact imagesOnly />
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M4 7h16v14H4zM8 7V5a4 4 0 0 1 8 0v2" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-[14px] font-semibold leading-5 text-[#293d2e]">
          {title}
        </p>

        {variant && (
          <p className="mt-1 text-xs text-[#7a887e]">
            {variant}
          </p>
        )}

        <p className="mt-2 text-xs text-[#7a887e]">
          Qty: {item.quantity}
        </p>

        {item.startsAt && (
          <p className="mt-1 text-xs text-[#7a887e]">
            Selected time: {new Date(item.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right text-[13px] font-semibold text-[#293d2e]">
        <Money value={item.lineTotal} currency={currency} />
      </div>
    </li>
  );
}

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");

  const [showAddressChoices, setShowAddressChoices] =
    useState(false);

  const [manageAddresses, setManageAddresses] =
    useState(false);

  const [loadingAddresses, setLoadingAddresses] =
    useState(true);

  const [quote, setQuote] = useState(null);
  const [quoteExpired, setQuoteExpired] = useState(false);
  const [order, setOrder] = useState(null);
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentMessage, setPaymentMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");

  const [error, setError] = useState("");
  const [addressError, setAddressError] = useState("");

  const lock = useRef(false);
  const intent = useRef({});
  const paymentIntent = useRef({});
  const orderedCartItemIds = useRef([]);
  const revision = useRef(0);

  const invalidateQuote = useCallback(() => {
    revision.current += 1;
    setQuote(null);
    setQuoteExpired(false);
  }, []);

  // Load saved delivery addresses
  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);

    try {
      const records = await allAccountPages(
        accountFetch,
        "me/addresses",
        ["addresses", "items"]
      );

      const rows = records.filter(
        (row) => row && !row.archivedAt
      );

      setAddresses(rows);

      setAddressId((selected) =>
        rows.some((row) => row.id === selected)
          ? selected
          : rows.find((row) => row.isDefault)?.id ||
            rows[0]?.id ||
            ""
      );

      setAddressError("");
      invalidateQuote();
    } catch (caught) {
      setAddressError(messageOf(caught));
    } finally {
      setLoadingAddresses(false);
    }
  }, [invalidateQuote]);

  // Refresh cart and address information
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    invalidateQuote();

    try {
      const latest = await refreshCart();
      setCart(latest);

      await loadAddresses();
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setLoading(false);
    }
  }, [loadAddresses, invalidateQuote]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    const sync = () => {
      invalidateQuote();

      const snapshot = readCartSnapshot();

      if (snapshot) {
        setCart(snapshot);
      }
    };

    window.addEventListener(CART_UPDATED_EVENT, sync);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CART_UPDATED_EVENT, sync);
    };
  }, [load, invalidateQuote]);

  // Expire a quote when its validity window ends
  useEffect(() => {
    if (!quote) return;

    const remaining = Math.max(0, quote.expiresAt - Date.now());

    const timer = window.setTimeout(() => {
      setQuoteExpired(true);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [quote]);

  function selectAddress(id) {
    setAddressId(id);
    setShowAddressChoices(false);
    invalidateQuote();
  }

  // Step 1: calculate the final checkout amount
  async function getQuote() {
    if (lock.current || !cart?.items?.length) return;

    if (
      cart.requiresShipping &&
      (!addressId || addressError)
    ) {
      setError(
        "Select a valid delivery address before continuing."
      );
      return;
    }

    lock.current = true;
    setWorking("quote");
    setError("");
    invalidateQuote();

    try {
      const latest = await refreshCart();
      setCart(latest);

      if (
        latest?.checkoutReady === false ||
        !latest?.items?.length
      ) {
        throw new Error(
          "Your cart needs attention. Update it before continuing."
        );
      }

      const body = checkoutBody(latest, addressId);
      const requestRevision = revision.current;

      const response = await accountFetch(
        "me/checkout/quote",
        {
          method: "POST",
          body,
        }
      );

      const data = response?.data;
      const expiresIn = Number(data?.expiresIn);

      if (
        data?.grandTotal == null ||
        !Number.isFinite(Number(data.grandTotal)) ||
        !Number.isFinite(expiresIn) ||
        expiresIn <= 0
      ) {
        throw new Error(
          "A valid final quote was not returned. Please try again."
        );
      }

      if (revision.current !== requestRevision) {
        throw new Error(
          "Your cart or delivery address changed. Calculate the total again."
        );
      }

      setQuote({
        data,
        signature: JSON.stringify(body),
        cartVersion: latest.version,
        expiresAt: Date.now() + expiresIn * 1000,
      });

      setQuoteExpired(false);
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      lock.current = false;
      setWorking("");
    }
  }

  async function findPaymentId(orderId, providerOrderId) {
    const response = await accountFetch("me/payments");
    const rows = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.payments)
        ? response.data.payments
        : Array.isArray(response?.data?.items)
          ? response.data.items
          : [];
    return rows.find((payment) =>
      String(payment?.orderId || "") === String(orderId) ||
      String(payment?.providerOrderId || "") === String(providerOrderId)
    )?.id || "";
  }

  async function clearPurchasedCart() {
    const orderedIds = new Set(
      orderedCartItemIds.current.map((value) => String(value))
    );

    const latest = await refreshCart();
    const items = Array.isArray(latest?.items) ? latest.items : [];

    // The checkout API may already have emptied the cart. If it has not,
    // remove only the line items that were included in this order.
    for (const item of items) {
      const itemId = item?.id || item?.cartItemId;
      if (!itemId || !orderedIds.has(String(itemId))) continue;
      await removeProductFromCart(item);
    }

    await refreshCart();
    orderedCartItemIds.current = [];
  }

  async function syncCartAfterOrder() {
    try {
      await clearPurchasedCart();
      return "";
    } catch (caught) {
      return caught?.message || "Your order was confirmed, but the cart could not be refreshed.";
    }
  }

  async function startPayment(targetOrder) {
    if (!targetOrder?.id) return;

    setWorking("payment");
    setPaymentState("opening");
    setPaymentMessage("");
    setError("");

    try {
      const key = `payment-${targetOrder.id}`;
      paymentIntent.current[key] ||= createIntentKey();
      const result = await accountFetch(
        `me/orders/${encodeURIComponent(targetOrder.id)}/payment-attempts`,
        {
          method: "POST",
          body: { idempotencyKey: paymentIntent.current[key] },
        }
      );
      const providerOrderId = providerOrderIdFrom(result);
      const keyId = razorpayKeyFrom(result);
      const paymentId = paymentIdFrom(result) || await findPaymentId(targetOrder.id, providerOrderId);

      if (!providerOrderId) {
        throw new Error("Payment order was not created by the payment service. Please try again or contact support.");
      }
      if (!keyId) {
        throw new Error("Razorpay public key is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID or return keyId from the payment API.");
      }
      if (!paymentId) {
        throw new Error("Payment record was not returned. Refresh My Payments before retrying.");
      }

       const amountInPaise = paymentAmountInPaise(result, targetOrder.grandTotal);
       if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
         throw new Error("A valid payment amount was not returned for this order.");
       }

       const checkoutResult = await openRazorpayCheckout({
        key: keyId,
         amount: amountInPaise,
        currency: paymentCurrencyFrom(result, targetOrder.currency),
        name: "AwakenWithMeheck",
        description: `Order ${targetOrder.orderNumber || targetOrder.id}`,
        order_id: providerOrderId,
        prefill: {
          name: targetOrder.customer?.name || selectedAddress?.fullName || "",
          email: targetOrder.customer?.email || targetOrder.email || "",
          contact: targetOrder.customer?.phone || selectedAddress?.phone || "",
        },
        notes: { orderId: String(targetOrder.id), paymentId: String(paymentId) },
        theme: { color: "#315a48" },
      });

      if (checkoutResult.type === "dismissed") {
        setPaymentState("dismissed");
        setPaymentMessage("Payment window closed. You can safely retry without creating a duplicate order.");
        return;
      }

      const providerPaymentId = checkoutResult.response?.razorpay_payment_id;
      const returnedProviderOrderId = checkoutResult.response?.razorpay_order_id || providerOrderId;
      if (!providerPaymentId) throw new Error("Razorpay did not return a payment ID. Please retry the payment.");

      const verified = await accountFetch(
        `me/payments/${encodeURIComponent(paymentId)}/verify`,
        {
          method: "POST",
          body: {
            providerOrderId: returnedProviderOrderId,
            providerPaymentId,
          },
        }
      );

      setPaymentState("success");
      const cartSyncMessage = await syncCartAfterOrder();
      setPaymentMessage(
        verified?.message ||
          (cartSyncMessage
            ? `Payment received. ${cartSyncMessage}`
            : "Payment received. Your order is being confirmed.")
      );
      if (cartSyncMessage) setError(cartSyncMessage);
       if (cart?.items?.some(isMembershipCartItem)) {
         window.setTimeout(() => router.replace("/profile/membership"), 700);
       }
    } catch (caught) {
      setPaymentState("failed");
      setPaymentMessage("");
      setError(messageOf(caught));
    } finally {
      setWorking("");
    }
  }

  // Step 2: create the actual order
  async function placeOrder() {
    if (lock.current || !quote || order) return;

    lock.current = true;
    setWorking("order");
    setError("");

    try {
      if (quoteExpired) {
        setQuoteExpired(true);

        throw new Error(
          "Your reviewed total has expired. Recalculate the amount before ordering."
        );
      }

      const requestRevision = revision.current;

      const response = await accountFetch("me/cart");
      const latest = response?.data;

      if (!latest || !latest.items?.length) {
        throw new Error(
          "Your cart is no longer ready for checkout. Return to your cart and review it."
        );
      }

      const body = checkoutBody(latest, addressId);
      const signature = JSON.stringify(body);

      if (
        String(latest.version) !==
          String(quote.cartVersion) ||
        signature !== quote.signature ||
        revision.current !== requestRevision
      ) {
        setCart(latest);
        invalidateQuote();

        throw new Error(
          "Your cart or delivery address changed. Review the updated total before placing the order."
        );
      }

      orderedCartItemIds.current = latest.items
        .map((item) => item?.id || item?.cartItemId)
        .filter(Boolean);

      if (quoteExpired) {
        throw new Error(
          "Your reviewed total has expired. Recalculate it before ordering."
        );
      }

      // Reuse the same key when retrying an identical order.
      if (intent.current.signature !== signature) {
        intent.current = {
          signature,
          key: createIntentKey(),
        };
      }

      const createdResponse = await accountFetch(
        "me/checkout",
        {
          method: "POST",
          body: {
            ...body,
            idempotencyKey: intent.current.key,
          },
        }
      );

      const createdPayload =
        createdResponse?.data?.order ||
        createdResponse?.data;
      const created = createdPayload
        ? {
            ...createdPayload,
            grandTotal:
              createdPayload.grandTotal ??
              createdPayload.totalAmount ??
              quote.data.grandTotal,
            currency:
              createdPayload.currency ??
              quote.data.currency,
          }
        : null;

      if (!created?.id) {
        throw new Error(
          "Order confirmation is unclear. Check My Orders before trying again to avoid duplicate orders."
        );
      }

      setOrder(created);
      setQuote(null);
      if (isPaidOrder(created)) {
        setPaymentState("success");
        const cartSyncMessage = await syncCartAfterOrder();
        setPaymentMessage(
          cartSyncMessage
            ? `Your order has been confirmed. ${cartSyncMessage}`
            : "Your order has been confirmed."
        );
        if (cartSyncMessage) setError(cartSyncMessage);
        if (cart?.items?.some(isMembershipCartItem)) {
          window.setTimeout(() => router.replace("/profile/membership"), 700);
        }
      } else {
        await startPayment(created);
      }
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      lock.current = false;
      setWorking("");
    }
  }

  const hasItems = Boolean(cart?.items?.length);

  const shippingRequired = Boolean(
    cart?.requiresShipping
  );

  const selectedAddress = addresses.find(
    (address) => address.id === addressId
  );

  const canReview = Boolean(
    hasItems &&
      cart?.checkoutReady &&
      !working &&
      (!shippingRequired ||
        (addressId &&
          !addressError &&
          !loadingAddresses))
  );

  const currency =
    quote?.data?.currency ||
    cart?.currency ||
    "INR";
  const paymentComplete = Boolean(order && (paymentState === "success" || isPaidOrder(order)));

  return (
    <main className="min-h-[65vh] bg-white px-4 pb-14 pt-7 text-[#29473c] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-[#607566] hover:text-[#315a48]"
        >
          <span aria-hidden="true">←</span>
          Back to cart
        </Link>

        <div className="mb-7 mt-4">
          <h1 className="text-[28px] font-semibold tracking-tight text-[#243b2c] sm:text-[32px]">
            Checkout
          </h1>

          <p className="mt-1 text-[13px] text-[#819086]">
            Review your delivery details and total before
            placing an order.
          </p>
        </div>

        {/* Error handling */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-[#f3dfda] bg-[#fff7f4] px-4 py-3 text-[13px] text-[#9c4c40]"
          >
            <p>{error}</p>

            <div className="mt-2 flex flex-wrap gap-4">
              <button
                type="button"
                className="font-semibold underline"
                disabled={Boolean(working)}
                onClick={load}
              >
                Refresh checkout
              </button>

              {/sign.?in|unauthoriz|log.?in/i.test(error) && (
                <Link
                  href="/auth/login?next=%2Fcheckout"
                  className="font-semibold underline"
                >
                  Sign in
                </Link>
              )}

              {/unclear|duplicate/i.test(error) && (
                <Link
                  href="/profile/orders"
                  className="font-semibold underline"
                >
                  Check My Orders
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Order and payment result */}
        {order ? (
          <section
            className={`${panel} mx-auto max-w-xl py-9 text-center`}
            role="status"
          >
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${paymentComplete ? "bg-[#eaf4ed] text-[#315a48]" : "bg-[#fff6df] text-[#a26f16]"}`}>
              {paymentComplete ? "✓" : "₹"}
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-[#233b2a]">
              {paymentComplete ? "Order placed successfully" : "Complete your payment"}
            </h2>

            {order.orderNumber && (
              <p className="mt-2 text-sm text-[#7b8b80]">
                Order #{order.orderNumber}
              </p>
            )}

            <p className="mt-4 text-xl font-semibold">
              <Money
                value={order.grandTotal}
                currency={order.currency || currency}
              />
            </p>

            <p className="mt-3 text-[13px] leading-6 text-[#718176]">
              {paymentComplete
                ? paymentMessage || "Your payment has been verified and your order is being processed."
                : paymentState === "opening"
                  ? "Opening secure Razorpay checkout..."
                  : paymentMessage || "Your order is ready. Complete the secure payment to confirm it."}
            </p>

            {(order.orderStatus || order.paymentStatus) && (
              <p className="mt-3 text-xs text-[#607566]">
                {order.orderStatus &&
                  `Order: ${String(
                    order.orderStatus
                  ).replaceAll("_", " ")}`}

                {order.orderStatus &&
                  order.paymentStatus &&
                  " · "}

                {order.paymentStatus &&
                  `Payment: ${String(
                    order.paymentStatus
                  ).replaceAll("_", " ")}`}
              </p>
            )}

            {!paymentComplete && (
              <button
                type="button"
                disabled={Boolean(working)}
                onClick={() => startPayment(order)}
                className={`${primary} mt-6 w-full`}
              >
                {working === "payment" || paymentState === "opening"
                  ? "Opening payment..."
                  : paymentState === "failed" || paymentState === "dismissed"
                    ? "Retry payment"
                    : "Pay securely with Razorpay"}
              </button>
            )}

            <Link
              href={`/profile/orders/${encodeURIComponent(
                order.id
              )}`}
              className={`${primary} mt-6`}
            >
              View order details →
            </Link>
          </section>
        ) : loading ? (
          <div
            role="status"
            className="rounded-xl border border-[#e3e9e4] p-8 text-sm text-[#728276]"
          >
            Loading checkout...
          </div>
        ) : !cart ? (
          <div className={panel}>
            <p className="text-sm text-[#66776b]">
              Unable to load your cart.
            </p>

            <button
              type="button"
              className={`${primary} mt-4`}
              onClick={load}
            >
              Try again
            </button>
          </div>
        ) : !hasItems ? (
          <section className={`${panel} py-14 text-center`}>
            <h2 className="text-lg font-semibold">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-[#7d8b80]">
              Add products to your cart to continue.
            </p>

            <Link
              href="/shop"
              className={`${primary} mt-5`}
            >
              Continue shopping
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
            {/* Left: Cart and address */}
            <div className="min-w-0 space-y-5">
              {/* Cart items */}
              <section
                className={panel}
                aria-labelledby="checkout-items-title"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2
                    id="checkout-items-title"
                    className="text-[17px] font-semibold text-[#263b2e]"
                  >
                    Order items
                  </h2>

                  <Link
                    href="/cart"
                    className="text-[12px] font-semibold text-[#315a48] hover:underline"
                  >
                    Edit cart
                  </Link>
                </div>

                <ul>
                  {cart.items.map((item, index) => (
                    <CartItem
                      key={item.id || index}
                      item={item}
                      currency={cart.currency}
                    />
                  ))}
                </ul>
              </section>

              {/* Delivery address */}
              {shippingRequired && (
                <section
                  className={panel}
                  aria-labelledby="delivery-heading"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2
                      id="delivery-heading"
                      className="text-[17px] font-semibold text-[#263b2e]"
                    >
                      Delivery address
                    </h2>

                    <button
                      type="button"
                      disabled={Boolean(working)}
                      className="text-[12px] font-semibold text-[#315a48] hover:underline disabled:opacity-50"
                      onClick={() =>
                        setManageAddresses(true)
                      }
                    >
                      Manage addresses
                    </button>
                  </div>

                  {addressError && (
                    <p
                      role="alert"
                      className="mt-4 text-[13px] text-[#a65447]"
                    >
                      {addressError}{" "}

                      <button
                        type="button"
                        disabled={
                          loadingAddresses ||
                          Boolean(working)
                        }
                        onClick={loadAddresses}
                        className="font-semibold underline"
                      >
                        Retry
                      </button>
                    </p>
                  )}

                  {loadingAddresses ? (
                    <p
                      role="status"
                      className="mt-4 text-sm text-[#7c8b7f]"
                    >
                      Loading addresses...
                    </p>
                  ) : !addresses.length ? (
                    <div className="mt-4 rounded-lg border border-dashed border-[#d9e3da] px-4 py-6">
                      <p className="text-[13px] text-[#6e7f73]">
                        Add a delivery address to continue
                        with your order.
                      </p>

                      <button
                        type="button"
                        disabled={Boolean(working)}
                        onClick={() =>
                          setManageAddresses(true)
                        }
                        className={`${primary} mt-4`}
                      >
                        Add delivery address
                      </button>
                    </div>
                  ) : (
                    <>
                      {selectedAddress && (
                        <div className="mt-4 rounded-lg border border-[#dce6dc] bg-[#fafcf9] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[13px] font-semibold text-[#314b37]">
                              {selectedAddress.label ||
                                "Address"}

                              {selectedAddress.isDefault && (
                                <span className="ml-2 text-[11px] font-medium text-[#6b8e75]">
                                  Default
                                </span>
                              )}
                            </p>

                            <button
                              type="button"
                              disabled={Boolean(working)}
                              onClick={() =>
                                setShowAddressChoices(
                                  (open) => !open
                                )
                              }
                              className="text-[12px] font-semibold text-[#315a48] hover:underline disabled:opacity-50"
                            >
                              Change address
                            </button>
                          </div>

                          <p className="mt-2 text-[13px] font-medium text-[#35483a]">
                            {selectedAddress.fullName}
                          </p>

                          <p className="mt-1 text-[13px] leading-6 text-[#68776c]">
                            {[
                              selectedAddress.addressLine1,
                              selectedAddress.addressLine2,
                              selectedAddress.landmark,
                              [
                                selectedAddress.city,
                                selectedAddress.state,
                                selectedAddress.postalCode,
                              ]
                                .filter(Boolean)
                                .join(", "),
                              selectedAddress.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>

                          {selectedAddress.phone && (
                            <p className="mt-1 text-[12px] text-[#68776c]">
                              Phone: {selectedAddress.phone}
                            </p>
                          )}
                        </div>
                      )}

                      {showAddressChoices && (
                        <fieldset
                          disabled={Boolean(working)}
                          className="mt-3 space-y-2"
                        >
                          <legend className="mb-2 text-[12px] font-medium text-[#6f8173]">
                            Choose delivery address
                          </legend>

                          {addresses.map((address) => (
                            <label
                              key={address.id}
                              className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e1e8e1] p-3 text-[13px] hover:bg-[#f7faf7]"
                            >
                              <input
                                type="radio"
                                name="shipping-address"
                                checked={
                                  addressId === address.id
                                }
                                onChange={() =>
                                  selectAddress(address.id)
                                }
                                className="mt-1 accent-[#315a48]"
                              />

                              <span className="min-w-0 text-[#485d4c]">
                                <strong>
                                  {address.label ||
                                    "Address"}
                                </strong>{" "}
                                · {address.fullName},{" "}
                                {address.city},{" "}
                                {address.postalCode}
                              </span>
                            </label>
                          ))}

                          <button
                            type="button"
                            onClick={() =>
                              setManageAddresses(true)
                            }
                            className="pt-2 text-[12px] font-semibold text-[#315a48] hover:underline"
                          >
                            Add or edit an address
                          </button>
                        </fieldset>
                      )}
                    </>
                  )}
                </section>
              )}
            </div>

            {/* Right: Final order summary */}
            <aside
              className={`${panel} lg:sticky lg:top-24`}
              aria-labelledby="summary-title"
            >
              <h2
                id="summary-title"
                className="text-[18px] font-semibold text-[#263b2e]"
              >
                Order summary
              </h2>

              <p className="mt-1 text-[12px] text-[#7b8d80]">
                {cart.items.length} item
                {cart.items.length !== 1 ? "s" : ""}
              </p>

              {!quote ? (
                <p className="mt-5 border-y border-[#edf0ed] py-5 text-[13px] leading-6 text-[#758579]">
                  Calculate your final total, including any
                  applicable taxes, discounts and delivery
                  charges.
                </p>
              ) : (
                <div className="mt-5 space-y-3 border-t border-[#edf0ed] pt-5 text-[13px]">
                  {[
                    ["Subtotal", "subtotal"],
                    ["Discount", "discount"],
                    ["Tax", "tax"],
                    ["Delivery", "shipping"],
                  ]
                    .filter(
                      ([, key]) =>
                        quote.data[key] !== null &&
                        quote.data[key] !== undefined
                    )
                    .map(([label, key]) => (
                      <div
                        key={key}
                        className="flex justify-between gap-3 text-[#637567]"
                      >
                        <span>{label}</span>

                        <span className="font-medium text-[#344a39]">
                          {key === "discount" &&
                          Number(quote.data[key]) > 0
                            ? "−"
                            : ""}

                          {key === "shipping" &&
                          Number(quote.data[key]) === 0 ? (
                            "Free"
                          ) : (
                            <Money
                              value={quote.data[key]}
                              currency={currency}
                            />
                          )}
                        </span>
                      </div>
                    ))}

                  <div className="flex items-center justify-between gap-3 border-t border-[#e8eee8] pt-4">
                    <span className="font-semibold text-[#2f4534]">
                      Total payable
                    </span>

                    <span className="text-xl font-bold text-[#294733]">
                      <Money
                        value={quote.data.grandTotal}
                        currency={currency}
                      />
                    </span>
                  </div>
                </div>
              )}

              {!cart.checkoutReady && (
                <p className="mt-4 text-[12px] leading-5 text-[#a25b49]">
                  Some cart items require attention. Edit
                  your cart before checkout.
                </p>
              )}

              {quoteExpired && (
                <p
                  role="status"
                  className="mt-4 text-[12px] text-[#a25b49]"
                >
                  This price quote expired. Please calculate
                  the total again.
                </p>
              )}

              {!quote || quoteExpired ? (
                <button
                  type="button"
                  disabled={!canReview}
                  onClick={getQuote}
                  className={`${primary} mt-5 w-full`}
                >
                  {working === "quote"
                    ? "Calculating total..."
                    : quoteExpired
                    ? "Recalculate final total"
                    : "Review final total"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    Boolean(working) || quoteExpired
                  }
                  onClick={placeOrder}
                  className={`${primary} mt-5 w-full`}
                >
                  {working === "order"
                    ? "Placing your order..."
                    : "Continue to payment"}
                </button>
              )}

              <p className="mt-3 text-center text-[11px] leading-5 text-[#8d9b90]">
                Payment and order status are available in
                your order details.
              </p>
            </aside>
          </div>
        )}
      </div>

      {/* Address management modal */}
      {manageAddresses && !order && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#18271e]/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !working
            ) {
              setManageAddresses(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Manage delivery addresses"
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                disabled={Boolean(working)}
                onClick={() =>
                  setManageAddresses(false)
                }
                aria-label="Close address manager"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f5f1] text-xl text-[#54705d]"
              >
                ×
              </button>
            </div>

            <AddressBook
              onChange={async () => {
                invalidateQuote();
                await loadAddresses();
                setManageAddresses(false);
                setShowAddressChoices(false);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
