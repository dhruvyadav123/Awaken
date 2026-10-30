
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { accountFetch } from "@/lib/client-account";
import { dataOf, externalUrl, listOf, titleOf } from "@/lib/learning-data";
import { formatProductPrice } from "@/lib/product-format";
import { recordMedia } from "@/lib/record-display";
import { openRazorpayCheckout } from "./RazorpayCheckout";

const button =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#234d39] px-5 text-sm font-semibold text-white transition hover:bg-[#183c2a] disabled:cursor-not-allowed disabled:opacity-50";

const field =
  "mt-2 w-full rounded-xl border border-[#dfe7df] bg-white px-4 py-3 text-sm text-[#253d2e] outline-none focus:border-[#6e9a79] focus:ring-2 focus:ring-[#6e9a79]/10";

function norm(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function pretty(v) {
  return String(v || "Pending")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function amount(v, currency = "INR") {
  if (
    v == null ||
    v === "" ||
    !Number.isFinite(Number(v))
  ) {
    return "—";
  }

  return formatProductPrice({
    price: Number(v),
    currency: currency || "INR",
  });
}

function dateText(v) {
  if (!v || Number.isNaN(new Date(v).getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(v));
}

function getItems(v) {
  return listOf(v, ["items", "orderItems"]);
}

function orderNumber(v) {
  return v?.orderNumber || v?.number || v?.id || "—";
}

function itemName(v) {
  return (
    v?.titleSnapshot ||
    v?.snapshot?.name ||
    v?.product?.name ||
    v?.title ||
    "Order item"
  );
}

function orderDate(v) {
  return dateText(
    v?.placedAt ||
      v?.createdAt ||
      v?.orderedAt ||
      v?.date
  );
}

function statusOf(v) {
  return (
    v?.orderStatus ||
    v?.status ||
    v?.fulfillmentStatus ||
    ""
  );
}

function paymentMethod(v) {
  const choices = [
    v?.paymentMethod,
    v?.paymentMethodType,
    v?.payment?.method,
    v?.payment?.paymentMethod,
    v?.paymentMethodSnapshot?.type,
  ];

  const text = choices
    .map((x) =>
      typeof x === "object"
        ? x?.code || x?.type || x?.name || ""
        : x
    )
    .filter(Boolean)
    .join(" ");

  if (
    /\bCOD\b|CASH[_\s-]*ON[_\s-]*DELIVERY|PAY[_\s-]*ON[_\s-]*DELIVERY/i.test(
      text
    )
  ) {
    return "Cash on delivery";
  }

  return (
    choices
      .map((x) =>
        typeof x === "string"
          ? x
          : x?.name || x?.type
      )
      .find(Boolean) || ""
  );
}

function isCOD(v) {
  return paymentMethod(v) === "Cash on delivery";
}

function canCancel(v) {
  if (
    !v ||
    v.canCancel === false ||
    v.cancellationAllowed === false
  ) {
    return false;
  }

  const state = norm(statusOf(v));
  const fulfill = norm(v.fulfillmentStatus);

  if (!state && !fulfill) {
    return v.canCancel === true;
  }

  const blocked = [
    "CANCELLED",
    "CANCELED",
    "CANCEL_REQUESTED",
    "CANCELLATION_REQUESTED",
    "DELIVERED",
    "COMPLETED",
    "RETURNED",
    "REFUNDED",
    "CLOSED",
  ];

  const blockedFulfillment = [
    "SHIPPED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FULFILLED",
  ];

  return (
    !blocked.includes(state) &&
    !blockedFulfillment.includes(fulfill)
  );
}

function canPay(v) {
  return (
    v &&
    !isCOD(v) &&
    ![
      "CANCELLED",
      "CANCELED",
      "DELIVERED",
      "REFUNDED",
    ].includes(norm(statusOf(v))) &&
    ["PENDING", "FAILED"].includes(
      norm(v.paymentStatus)
    )
  );
}

function canRefund(v) {
  return (
    v &&
    v.canRefund !== false &&
    v.refundEligible !== false &&
    ["PAID", "PARTIALLY_REFUNDED"].includes(
      norm(v.paymentStatus)
    )
  );
}

function statusTone(v) {
  const s = norm(v);

  if (
    [
      "PAID",
      "SUCCESS",
      "SUCCEEDED",
      "DELIVERED",
      "COMPLETED",
      "FULFILLED",
      "APPROVED",
    ].includes(s)
  ) {
    return "bg-[#eaf4eb] text-[#276344]";
  }

  if (
    [
      "CANCELLED",
      "CANCELED",
      "FAILED",
      "REJECTED",
      "REFUNDED",
    ].includes(s)
  ) {
    return "bg-[#fff0ed] text-[#a55042]";
  }

  if (
    [
      "SHIPPED",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "PACKED",
      "PROCESSING",
    ].includes(s)
  ) {
    return "bg-[#eaf1fa] text-[#456c9c]";
  }

  return "bg-[#f4f0e4] text-[#846a36]";
}

function Status({ value }) {
  if (!value) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium ${statusTone(
        value
      )}`}
    >
      {pretty(value)}
    </span>
  );
}

function safeUrl(v) {
  return typeof v === "string" &&
    /^https:\/\//i.test(v)
    ? v
    : "";
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function paymentPayload(result) {
  const root = dataOf(result) || {};
  const payment = root.payment || root.paymentRecord || root;
  const checkout = root.checkout || root.providerOrder || root.razorpay || {};
  return { root, payment, checkout };
}

function Photo({ item, size = "large" }) {
  const snapshot =
    item?.snapshot || item?.product || {};

  const hasImage =
    recordMedia(snapshot, {
      imagesOnly: true,
    }).length > 0;

  return (
    <div
      className={`${
        size === "small"
          ? "size-16"
          : "size-20 sm:size-24"
      } shrink-0 overflow-hidden rounded-xl bg-[#f2f5ef] order-photo-frame`}
    >
      {hasImage ? (
        <div className="h-full w-full [&_img]:!h-full [&_img]:!w-full [&_img]:!object-cover [&_picture]:!block [&_picture]:!h-full">
          <RecordMedia
            record={{
              ...snapshot,
              title: itemName(item),
            }}
            imagesOnly
            compact
          />
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-[#88a08c]"
          aria-label="Product image unavailable"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            aria-hidden="true"
          >
            <path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z" />
            <path d="m3 7 9 5 9-5M12 12v9" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------
   ORDER LIST CARD
---------------------------------- */

function OrderRow({ order }) {
  const items = getItems(order);
  const id = order?.id || order?.orderId;
  const total =
    order?.grandTotal ??
    order?.totalAmount ??
    order?.total;

  const first = items[0];

  return (
    <article className="group rounded-[18px] border border-[#e7ede8] bg-white px-4 py-4 shadow-[0_3px_18px_rgba(29,65,43,0.035)] transition-all duration-200 hover:border-[#cdded1] hover:shadow-[0_7px_24px_rgba(29,65,43,0.06)] sm:px-5 sm:py-5">

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#718275]">
          <span className="break-all font-semibold text-[#365441]">
            #{orderNumber(order)}
          </span>

          {orderDate(order) && (
            <>
              <span className="text-[#b9c7bb]">·</span>
              <span>{orderDate(order)}</span>
            </>
          )}
        </div>

        <Status value={statusOf(order)} />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Photo
          item={first || {}}
          size="small"
        />

        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-sm font-semibold leading-6 text-[#223e2e] sm:text-[15px]">
            {first
              ? itemName(first)
              : "Order details"}
          </h2>

          <p className="mt-1 text-xs text-[#849287]">
            {items.length > 1
              ? `${items.length} items`
              : first
              ? `Qty: ${first.quantity ?? 1}`
              : "View purchased items"}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2.5 text-right">
          {total != null && (
            <p className="text-sm font-semibold text-[#203c2c] sm:text-base">
              {amount(total, order.currency)}
            </p>
          )}

          {id && (
            <Link
              href={`/profile/orders/${encodeURIComponent(
                id
              )}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#eff5ef] px-3 py-2 text-[11px] font-semibold text-[#2d6042] transition group-hover:bg-[#e2ede3] sm:text-xs"
            >
              View details
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/* ----------------------------------
   CLEAN TOP FILTER
---------------------------------- */

function OrderFilters({
  value,
  onChange,
  search,
  onSearch,
}) {
  const options = [
    ["ALL", "All orders"],
    ["ACTIVE", "In progress"],
    ["DELIVERED", "Delivered"],
    ["CANCELLED", "Cancelled"],
  ];

  return (
    <section
      aria-label="Filter your orders"
      className="mb-5 rounded-[18px] bg-[#f7f9f6] p-3 sm:p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={value === key}
              className={`shrink-0 rounded-full px-3.5 py-2.5 text-xs font-semibold transition sm:px-4 ${
                value === key
                  ? "bg-[#264f3a] text-white shadow-sm"
                  : "text-[#6c7d70] hover:bg-white hover:text-[#315b41]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="relative block w-full shrink-0 lg:w-[230px]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#91a295]"
          >
            <circle
              cx="10.8"
              cy="10.8"
              r="6.8"
            />
            <path d="m16 16 4.4 4.4" />
          </svg>

          <span className="sr-only">
            Search orders on the current page
          </span>

          <input
            type="search"
            value={search}
            onChange={(e) =>
              onSearch(e.target.value)
            }
            placeholder="Search orders"
            className="h-10 w-full rounded-xl border border-[#e2ebe3] bg-white pl-9 pr-3 text-xs text-[#304838] outline-none transition placeholder:text-[#9caaa0] focus:border-[#81a78b] focus:ring-2 focus:ring-[#81a78b]/10"
          />
        </label>
      </div>
    </section>
  );
}

/* ----------------------------------
   ORDER PRODUCTS
---------------------------------- */

function OrderProducts({ order }) {
  const items = getItems(order);

  return (
    <section>
      <h2 className="text-lg font-semibold text-[#263d2d]">
        Items ordered
        <span className="ml-1 text-sm font-normal text-[#829082]">
          ({items.length})
        </span>
      </h2>

      {items.length ? (
        <ul className="mt-3 space-y-4">
          {items.map((item, i) => (
            <li
              key={item.id || item.orderItemId || i}
              className="flex items-start gap-4"
            >
              <Photo item={item} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-6 text-[#273f2f]">
                  {itemName(item)}
                </p>

                {(item.snapshot?.variant?.name ||
                  item.variant?.name) && (
                  <p className="mt-1 text-xs text-[#788a7c]">
                    {item.snapshot?.variant?.name ||
                      item.variant?.name}
                  </p>
                )}

                <p className="mt-1 text-xs text-[#788a7c]">
                  Qty: {item.quantity ?? 1}
                </p>

                {item.fulfillment?.hasAccess === true &&
                  item.itemType === "PRODUCT" &&
                  item.snapshot?.productType ===
                    "DIGITAL" && (
                    <Link
                      href="/profile/digital-library"
                      className="mt-2 inline-block text-xs font-semibold text-[#286344] hover:underline"
                    >
                      Open digital library ↗
                    </Link>
                  )}
              </div>

              {(item.finalPrice ??
                item.totalPrice ??
                item.price) != null && (
                <p className="shrink-0 text-sm font-semibold text-[#2b4534]">
                  {amount(
                    item.finalPrice ??
                      item.totalPrice ??
                      item.price,
                    order.currency
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#758579]">
          Item details were not returned by the service.
        </p>
      )}
    </section>
  );
}

/* ----------------------------------
   PRICE SUMMARY
---------------------------------- */

function PriceSummary({ order }) {
  const total =
    order.grandTotal ??
    order.totalAmount ??
    order.total;

  const rows = [
    ["Subtotal", order.subtotal],
    ["Discount", order.discount, true],
    ["Tax", order.tax],
    ["Shipping", order.shipping],
  ].filter(
    ([label, value, discount]) =>
      value != null &&
      (!discount || Number(value) !== 0)
  );

  return (
    <section className="rounded-2xl bg-[#f6f8f4] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-[#263d2d]">
        Payment summary
      </h2>

      <dl className="mt-5 space-y-3 text-sm">
        {rows.map(([label, value, discount]) => (
          <div
            key={label}
            className="flex justify-between gap-3"
          >
            <dt className="text-[#78897b]">
              {label}
            </dt>

            <dd
              className={
                discount
                  ? "font-medium text-[#2a7550]"
                  : "font-medium text-[#354d3b]"
              }
            >
              {discount && Number(value) > 0
                ? "−"
                : ""}
              {amount(value, order.currency)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex items-end justify-between gap-4 pt-4">
        <span className="text-sm font-semibold text-[#2d4433]">
          Total
        </span>

        <strong className="text-2xl tracking-tight text-[#234d39]">
          {amount(total, order.currency)}
        </strong>
      </div>

      {(order.paymentStatus ||
        paymentMethod(order)) && (
        <p className="mt-3 text-xs leading-5 text-[#76877a]">
          {paymentMethod(order) || "Payment"}

          {order.paymentStatus
            ? ` · ${
                isCOD(order) &&
                norm(order.paymentStatus) === "PENDING"
                  ? "Pay on delivery"
                  : pretty(order.paymentStatus)
              }`
            : ""}
        </p>
      )}
    </section>
  );
}

/* ----------------------------------
   SHIPPING / PAYMENT DETAILS
---------------------------------- */

function OrderInformation({ order }) {
  const addr =
    order.shippingAddressSnapshot ||
    order.shippingAddress;

  const address =
    addr && typeof addr === "object"
      ? [
          addr.fullName || addr.name,
          addr.addressLine1 ||
            addr.line1 ||
            addr.street,
          addr.addressLine2 || addr.line2,
          [
            addr.city,
            addr.state,
            addr.postalCode || addr.zipCode,
          ]
            .filter(Boolean)
            .join(", "),
          addr.country,
        ].filter(Boolean)
      : [];

  const shipment = order.shipment || {};

  const trackingUrl = safeUrl(
    shipment.trackingUrl ||
      shipment.trackingLink
  );

  const payments = Array.isArray(order.payments)
    ? order.payments
    : [];

  const refunds = Array.isArray(order.refunds)
    ? order.refunds
    : [];

  return (
    <section className="grid gap-6 sm:grid-cols-2">
      {address.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[#273f2f]">
            Delivery address
          </h2>

          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#697b6d]">
            {address.join("\n")}
          </p>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-[#273f2f]">
          Order information
        </h2>

        <dl className="mt-3 space-y-3 text-sm">
          {order.fulfillmentStatus && (
            <div>
              <dt className="text-xs text-[#829184]">
                Fulfillment
              </dt>

              <dd className="mt-0.5 font-medium text-[#365240]">
                {pretty(order.fulfillmentStatus)}
              </dd>
            </div>
          )}

          {shipment.status && (
            <div>
              <dt className="text-xs text-[#829184]">
                Shipment status
              </dt>

              <dd className="mt-0.5 font-medium text-[#365240]">
                {pretty(shipment.status)}
              </dd>
            </div>
          )}

          {(shipment.trackingNumber ||
            shipment.trackingId) && (
            <div>
              <dt className="text-xs text-[#829184]">
                Tracking number
              </dt>

              <dd className="mt-0.5 break-all font-medium text-[#365240]">
                {shipment.trackingNumber ||
                  shipment.trackingId}
              </dd>
            </div>
          )}

          {(shipment.carrier ||
            shipment.courierName) && (
            <div>
              <dt className="text-xs text-[#829184]">
                Courier
              </dt>

              <dd className="mt-0.5 font-medium text-[#365240]">
                {shipment.carrier ||
                  shipment.courierName}
              </dd>
            </div>
          )}

          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-semibold text-[#286344] hover:underline"
            >
              Track with courier ↗
            </a>
          )}
        </dl>
      </div>

      {payments.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[#273f2f]">
            Payments
          </h2>

          <div className="mt-3 space-y-2">
            {payments
              .filter((x) => x.id)
              .map((x) => (
                <Link
                  key={x.id}
                  href={`/profile/payments/${encodeURIComponent(
                    x.id
                  )}`}
                  className="block text-sm text-[#286344] hover:underline"
                >
                  {pretty(x.status)} ·{" "}
                  {amount(
                    x.amount,
                    x.currency || order.currency
                  )}{" "}
                  ↗
                </Link>
              ))}
          </div>
        </div>
      )}

      {refunds.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[#273f2f]">
            Refunds
          </h2>

          <div className="mt-3 space-y-2">
            {refunds
              .filter((x) => x.id)
              .map((x) => (
                <Link
                  key={x.id}
                  href={`/profile/refunds/${encodeURIComponent(
                    x.id
                  )}`}
                  className="block text-sm text-[#286344] hover:underline"
                >
                  {pretty(x.status)} ·{" "}
                  {amount(
                    x.amount,
                    x.currency || order.currency
                  )}{" "}
                  ↗
                </Link>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}

function TransactionRow({ entry, section }) {
  const id =
    entry.id ||
    entry.paymentId ||
    entry.refundId;

  const value =
    entry.amount ??
    entry.totalAmount ??
    entry.total;

  const title = titleOf(
    entry,
    section === "payments"
      ? `Payment ${id || ""}`
      : `Refund ${id || ""}`
  );

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-1 py-4 hover:bg-[#f8faf7] sm:px-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#253e2d]">
          {title}
        </p>

        {entry.createdAt && (
          <p className="mt-1 text-xs text-[#829184]">
            {dateText(entry.createdAt)}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">
          {amount(value, entry.currency)}
        </p>

        <div className="mt-1 flex items-center justify-end gap-2">
          <Status
            value={
              entry.status ||
              entry.paymentStatus
            }
          />

          {id && (
            <Link
              href={`/profile/${section}/${encodeURIComponent(
                id
              )}`}
              className="text-xs font-semibold text-[#286344] hover:underline"
            >
              Details →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------
   MAIN COMPONENT
---------------------------------- */

export default function CommerceCenter({
  section = "orders",
  id,
  embedded = false,
}) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);

  const [orderFilter, setOrderFilter] =
    useState("ALL");

  const [orderSearch, setOrderSearch] =
    useState("");

  const [pagination, setPagination] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [activeForm, setActiveForm] =
    useState("");

  const [cancelReason, setCancelReason] =
    useState("");

  const [refundReason, setRefundReason] =
    useState("");

  const [refundItems, setRefundItems] =
    useState([]);

  const [providerOrderId, setProviderOrderId] =
    useState("");

  const [providerPaymentId, setProviderPaymentId] =
    useState("");

  const [lastAction, setLastAction] =
    useState("");

  const [actionResult, setActionResult] =
    useState(null);

  const lock = useRef(false);
  const fetchSeq = useRef(0);
  const keys = useRef({});

  function intentKey(name) {
    if (!keys.current[name]) {
      keys.current[name] =
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;
    }

    return keys.current[name];
  }

  const load = useCallback(async () => {
    const seq = ++fetchSeq.current;
    setLoading(true);

    try {
      const response = await accountFetch(
        `me/${section}${
          id
            ? `/${encodeURIComponent(id)}`
            : `?page=${page}&limit=20`
        }`
      );

      if (seq !== fetchSeq.current) return;

      setData(dataOf(response));
      setPagination(
        response.pagination || null
      );
      setError("");
    } catch (e) {
      if (seq === fetchSeq.current) {
        setData(null);

        setError(
          e?.message ||
            "Unable to load your information."
        );
      }
    } finally {
      if (seq === fetchSeq.current) {
        setLoading(false);
      }
    }
  }, [section, id, page]);

  useEffect(() => {
    void load();

    return () => {
      fetchSeq.current += 1;
    };
  }, [load]);

  async function runAction(name, handler) {
    if (lock.current) return;

    lock.current = true;
    setWorking(name);
    setError("");
    setNotice("");

    try {
      await handler();
    } catch (e) {
      setError(
        e?.message ||
          "Unable to complete this request."
      );
    } finally {
      lock.current = false;
      setWorking("");
    }
  }

  /* List and filtering */

  const entries = !id
    ? Array.isArray(data)
      ? data
      : listOf(
          data,
          section === "orders"
            ? ["orders", "items", "recentOrders"]
            : [section, "items"]
        )
    : [];

  const filteredEntries =
    section === "orders"
      ? entries.filter((entry) => {
          const searchTerm = orderSearch
            .trim()
            .toLowerCase();

          const searchable = `${orderNumber(
            entry
          )} ${getItems(entry)
            .map(itemName)
            .join(" ")}`.toLowerCase();

          if (
            searchTerm &&
            !searchable.includes(searchTerm)
          ) {
            return false;
          }

          const statuses = [
            statusOf(entry),
            entry.fulfillmentStatus,
            entry.shipment?.status,
          ].map(norm);

          const isCancelled = statuses.some(
            (s) =>
              [
                "CANCELLED",
                "CANCELED",
                "CANCEL_REQUESTED",
                "CANCELLATION_REQUESTED",
              ].includes(s)
          );

          const isDelivered = statuses.some(
            (s) =>
              [
                "DELIVERED",
                "COMPLETED",
              ].includes(s)
          );

          if (orderFilter === "CANCELLED") {
            return isCancelled;
          }

          if (orderFilter === "DELIVERED") {
            return isDelivered;
          }

          if (orderFilter === "ACTIVE") {
            return (
              !isCancelled &&
              !isDelivered
            );
          }

          return true;
        })
      : entries;

  const hasOrderFilter =
    orderFilter !== "ALL" ||
    Boolean(orderSearch.trim());

  const selected = id
    ? data?.[section.slice(0, -1)] || data
    : null;

  const orderedItems =
    section === "orders" && selected
      ? getItems(selected)
      : [];

  const refundChoices = orderedItems.filter(
    (x) => x.id || x.orderItemId
  );

  const payable =
    section === "orders" && canPay(selected);

  const cancelable =
    section === "orders" && canCancel(selected);

  const refundable =
    section === "orders" &&
    canRefund(selected) &&
    refundChoices.length > 0;

  const paymentUrl =
    lastAction === "payment"
      ? externalUrl(actionResult) ||
        externalUrl(actionResult?.checkout) ||
        externalUrl(actionResult?.payment)
      : "";

  const paymentId =
    lastAction === "payment"
      ? actionResult?.payment?.id ||
        actionResult?.paymentId ||
        actionResult?.id
      : null;

  const refundId =
    lastAction === "refund"
      ? actionResult?.refund?.id ||
        actionResult?.refundId ||
        actionResult?.id
      : null;

  /* API actions */

  async function cancelOrder(event) {
    event.preventDefault();

    if (
      !id ||
      !cancelReason.trim() ||
      !cancelable
    ) {
      return;
    }

    await runAction("cancel", async () => {
      const response = await accountFetch(
        `me/orders/${encodeURIComponent(id)}`
      );

      const original = dataOf(response);
      const latest =
        original?.order || original;

      if (latest?.version == null) {
        throw new Error(
          "Current order version is unavailable. Please refresh and retry."
        );
      }

      if (!canCancel(latest)) {
        throw new Error(
          "This order is no longer eligible for cancellation."
        );
      }

      const result = await accountFetch(
        `me/orders/${encodeURIComponent(
          id
        )}/cancel`,
        {
          method: "POST",
          body: {
            version: latest.version,
            reason: cancelReason.trim(),
          },
        }
      );

      setNotice(
        result.message ||
          "Cancellation request submitted."
      );

      setCancelReason("");
      setActiveForm("");

      await load();
    });
  }

  async function requestPayment() {
    if (!id || !payable) return;

    await runAction("payment", async () => {
      const key = `payment-${id}`;

      const result = await accountFetch(
        `me/orders/${encodeURIComponent(
          id
        )}/payment-attempts`,
        {
          method: "POST",
          body: {
            idempotencyKey:
              intentKey(key),
          },
        }
      );

      const { root, payment, checkout } = paymentPayload(result);
      const providerOrderId = firstText(
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
      const keyId = firstText(
        checkout.key,
        checkout.key_id,
        checkout.keyId,
        root.key,
        root.keyId,
        root.razorpayKeyId,
        root.razorpay_key_id,
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      );
      let paymentId = firstText(
        payment.id,
        root.paymentId,
        root.payment?.id,
        root.id
      );

      if (!paymentId) {
        const paymentsResponse = await accountFetch("me/payments");
        const payments = Array.isArray(paymentsResponse?.data)
          ? paymentsResponse.data
          : Array.isArray(paymentsResponse?.data?.payments)
            ? paymentsResponse.data.payments
            : Array.isArray(paymentsResponse?.data?.items)
              ? paymentsResponse.data.items
              : [];
        paymentId = payments.find((item) =>
          String(item?.orderId || "") === String(id) ||
          String(item?.providerOrderId || "") === String(providerOrderId)
        )?.id || "";
      }

      if (!providerOrderId || !keyId || !paymentId) {
        throw new Error("Payment setup is incomplete. Refresh the order and try again.");
      }

      const explicitPaise = [
        checkout.amountPaise,
        checkout.amountInPaise,
        root.amountPaise,
        root.amountInPaise,
        payment.amountPaise,
        payment.amountInPaise
      ].find((value) => Number.isFinite(Number(value)));
      const amountInPaise = explicitPaise !== undefined
        ? Math.round(Number(explicitPaise))
        : Number.isFinite(Number(checkout.amount))
          ? Math.round(Number(checkout.amount))
          : Math.round(
              Number(
                payment.amount ??
                  root.amount ??
                  selected?.grandTotal
              ) * 100
            );
      if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
        throw new Error("A valid payment amount was not returned for this order.");
      }
      const checkoutResult = await openRazorpayCheckout({
        key: keyId,
        amount: Number.isFinite(amountInPaise) ? amountInPaise : 0,
        currency: firstText(checkout.currency, root.currency, payment.currency, selected?.currency, "INR"),
        name: "AwakenWithMeheck",
        description: `Order ${orderNumber(selected)}`,
        order_id: providerOrderId,
        theme: { color: "#234d39" },
      });

      if (checkoutResult.type === "dismissed") {
        setNotice("Payment window closed. You can retry when you are ready.");
        return;
      }

      const providerPaymentId = checkoutResult.response?.razorpay_payment_id;
      if (!providerPaymentId) throw new Error("Razorpay did not return a payment ID. Please retry the payment.");

      const verified = await accountFetch(
        `me/payments/${encodeURIComponent(paymentId)}/verify`,
        {
          method: "POST",
          body: {
            providerOrderId: checkoutResult.response?.razorpay_order_id || providerOrderId,
            providerPaymentId,
          },
        }
      );

      delete keys.current[key];
      setActionResult(dataOf(verified));
      setLastAction("payment");
      setNotice(verified.message || "Payment verification submitted. Refreshing your order status.");

      await load();
    });
  }

  async function requestRefund(event) {
    event.preventDefault();

    const valid = new Set(
      refundChoices.map((x) =>
        String(x.id || x.orderItemId)
      )
    );

    const items = refundItems.filter(
      (x) => valid.has(x)
    );

    if (
      !id ||
      !refundable ||
      !items.length ||
      !refundReason.trim()
    ) {
      return;
    }

    await runAction("refund", async () => {
      const key = `refund-${id}`;

      const result = await accountFetch(
        `me/orders/${encodeURIComponent(
          id
        )}/refunds`,
        {
          method: "POST",
          body: {
            items,
            idempotencyKey:
              intentKey(key),
            reason:
              refundReason.trim(),
          },
        }
      );

      delete keys.current[key];

      setActionResult(dataOf(result));
      setLastAction("refund");

      setNotice(
        result.message ||
          "Refund request submitted."
      );

      setRefundReason("");
      setRefundItems([]);
      setActiveForm("");

      await load();
    });
  }

  async function verifyPayment(event) {
    event.preventDefault();

    if (
      !id ||
      !providerOrderId.trim() ||
      !providerPaymentId.trim()
    ) {
      return;
    }

    await runAction("verify", async () => {
      const result = await accountFetch(
        `me/payments/${encodeURIComponent(
          id
        )}/verify`,
        {
          method: "POST",
          body: {
            providerOrderId:
              providerOrderId.trim(),
            providerPaymentId:
              providerPaymentId.trim(),
          },
        }
      );

      setNotice(
        result.message ||
          "Payment verification submitted."
      );

      setProviderOrderId("");
      setProviderPaymentId("");
      setActiveForm("");

      await load();
    });
  }

  const totalPages = Number(
    pagination?.totalPages ??
      pagination?.pages ??
      (pagination?.total &&
      pagination?.limit
        ? Math.ceil(
            pagination.total /
              pagination.limit
          )
        : 0)
  );

  const more =
    typeof pagination?.hasNextPage === "boolean"
      ? pagination.hasNextPage
      : typeof pagination?.hasNext === "boolean"
      ? pagination.hasNext
      : totalPages > 0
      ? page < totalPages
      : entries.length === 20;

  const showPages =
    !id && (page > 1 || more);

  const title =
    section === "orders"
      ? "My orders"
      : section === "payments"
      ? "My payments"
      : "My refunds";

  return (
    <main className="min-h-[65vh] bg-white text-[#263d2e]">
      <div className={`mx-auto max-w-6xl pb-14 ${embedded ? "px-0 pt-0" : "px-5 pt-4 sm:px-8 sm:pt-5 lg:pt-7"}`}>

        {!embedded && <Link
          href={
            id
              ? `/profile/${section}`
              : "/profile"
          }
          className="inline-flex items-center gap-2 text-sm text-[#718575] hover:text-[#234d39]"
        >
          ←{" "}
          {id
            ? `Back to ${title.toLowerCase()}`
            : "My account"}
        </Link>}

        {!embedded && <header className="mb-5 mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-[Georgia,serif] text-3xl tracking-tight text-[#223e2e] sm:text-4xl">
              {id
                ? section === "orders"
                  ? "Order details"
                  : section === "payments"
                  ? "Payment details"
                  : "Refund details"
                : title}
            </h1>

            {!id && (
              <p className="mt-2 text-sm text-[#7a8a7e]">
                {section === "orders"
                  ? "Your purchases, all in one place."
                  : "Your recent transactions."}
              </p>
            )}
          </div>

          {!id && section === "orders" && (
            <Link
              href="/profile/digital-library"
              className="pt-2 text-sm font-medium text-[#2a6547] hover:underline"
            >
              Digital library ↗
            </Link>
          )}
        </header>}

        {embedded && !id && <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#7a8a7e]">{section === "orders" ? "Your purchases, all in one place." : "Your recent transactions."}</p>
          {section === "orders" && <Link href="/profile/digital-library" className="text-sm font-medium text-[#2a6547] hover:underline">Digital library</Link>}
        </div>}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl bg-[#fff3ef] px-4 py-3 text-sm text-[#9d5140]"
          >
            {error}

            <button
              type="button"
              onClick={() => void load()}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {notice && (
          <p
            role="status"
            className="mb-6 rounded-xl bg-[#edf7ee] px-4 py-3 text-sm text-[#2c7149]"
          >
            {notice}
          </p>
        )}

        {loading ? (
          <div
            role="status"
            className="animate-pulse space-y-5"
          >
            <div className="h-20 rounded-xl bg-[#f4f7f3]" />
            <div className="h-24 rounded-xl bg-[#f4f7f3]" />

            <span className="sr-only">
              Loading…
            </span>
          </div>
        ) : error ? null : !id ? (
          <>
            {/* TOP FILTERS */}
            {section === "orders" &&
              entries.length > 0 && (
                <OrderFilters
                  value={orderFilter}
                  onChange={setOrderFilter}
                  search={orderSearch}
                  onSearch={setOrderSearch}
                />
              )}

            {/* ORDER CARDS */}
            {filteredEntries.length ? (
              <div className="grid gap-3 sm:gap-4">
                {filteredEntries.map(
                  (entry, i) =>
                    section === "orders" ? (
                      <OrderRow
                        key={
                          entry.id ||
                          entry.orderId ||
                          i
                        }
                        order={entry}
                      />
                    ) : (
                      <TransactionRow
                        key={entry.id || i}
                        entry={entry}
                        section={section}
                      />
                    )
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#f8faf7] px-5 py-12 text-center">
                <p className="text-lg font-semibold">
                  {hasOrderFilter
                    ? "No matching orders"
                    : "Nothing here yet"}
                </p>

                <p className="mt-2 text-sm text-[#7e8e81]">
                  {hasOrderFilter
                    ? "Try another status or search term."
                    : section === "orders"
                    ? "Your orders will appear here after you place one."
                    : `Your ${section} will appear here when available.`}
                </p>

                {hasOrderFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderFilter("ALL");
                      setOrderSearch("");
                    }}
                    className="mt-4 text-sm font-semibold text-[#286344] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* PAGINATION */}
            {showPages && (
              <nav
                aria-label="Pagination"
                className="mt-8 flex items-center justify-center gap-5 text-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) =>
                      Math.max(1, p - 1)
                    )
                  }
                  disabled={page === 1}
                  className="px-2 py-2 font-semibold text-[#2f6548] disabled:opacity-30"
                >
                  ← Previous
                </button>

                <span className="text-[#849385]">
                  Page {page}
                  {totalPages > 0
                    ? ` of ${totalPages}`
                    : ""}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => p + 1)
                  }
                  disabled={!more}
                  className="px-2 py-2 font-semibold text-[#2f6548] disabled:opacity-30"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        ) : !selected ? (
          <p className="text-sm text-[#79887c]">
            Details are unavailable.
          </p>
        ) : section === "orders" ? (
          <section className="rounded-2xl border border-[#e4ebe5] bg-[#fbfcfa] p-5 shadow-[0_4px_20px_rgba(34,62,46,0.04)] sm:p-6 lg:p-7">
            {/* ORDER DETAIL HEADER */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                {embedded && <Link href="/profile/orders" className="text-sm font-medium text-[#718575] hover:text-[#234d39]">Back to orders</Link>}
                <p className="break-all text-sm font-semibold text-[#385340]">
                  Order #{orderNumber(selected)}
                </p>

                {orderDate(selected) && (
                  <p className="mt-1 text-sm text-[#829183]">
                    Placed on {orderDate(selected)}
                  </p>
                )}
              </div>

              <Status value={statusOf(selected)} />
            </div>

            <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_315px] lg:gap-10">
              <div className="min-w-0 space-y-8">
                <OrderProducts order={selected} />

                <OrderInformation order={selected} />

                {/* ORDER ACTIONS */}
                {(payable ||
                  paymentUrl ||
                  paymentId ||
                  cancelable ||
                  refundable ||
                  refundId) && (
                  <section>
                    <h2 className="text-base font-semibold text-[#273f2f]">
                      Order actions
                    </h2>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                      {payable && (
                        <button
                          type="button"
                          onClick={requestPayment}
                          disabled={Boolean(working)}
                          className={button}
                        >
                          {working === "payment"
                            ? "Preparing…"
                            : "Pay now"}
                        </button>
                      )}

                      {paymentUrl && (
                        <a
                          href={paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#286344] hover:underline"
                        >
                          Open payment page ↗
                        </a>
                      )}

                      {paymentId && (
                        <Link
                          href={`/profile/payments/${encodeURIComponent(
                            paymentId
                          )}`}
                          className="text-sm font-semibold text-[#286344] hover:underline"
                        >
                          Payment status ↗
                        </Link>
                      )}

                      {cancelable && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveForm((v) =>
                              v === "cancel"
                                ? ""
                                : "cancel"
                            )
                          }
                          className="text-sm font-medium text-[#9a5d50] hover:underline"
                        >
                          Request cancellation
                        </button>
                      )}

                      {refundable && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveForm((v) =>
                              v === "refund"
                                ? ""
                                : "refund"
                            )
                          }
                          className="text-sm font-medium text-[#286344] hover:underline"
                        >
                          Request refund
                        </button>
                      )}

                      {refundId && (
                        <Link
                          href={`/profile/refunds/${encodeURIComponent(
                            refundId
                          )}`}
                          className="text-sm font-semibold text-[#286344] hover:underline"
                        >
                          Refund status ↗
                        </Link>
                      )}
                    </div>

                    {/* CANCEL FORM */}
                    {activeForm === "cancel" &&
                      cancelable && (
                        <form
                          onSubmit={cancelOrder}
                          className="mt-5 max-w-lg rounded-2xl bg-[#f8faf7] p-5"
                        >
                          <p className="text-sm font-medium">
                            Why would you like to cancel?
                          </p>

                          <label className="mt-3 block text-sm text-[#627466]">
                            Reason

                            <textarea
                              required
                              rows={3}
                              maxLength={500}
                              value={cancelReason}
                              onChange={(e) =>
                                setCancelReason(
                                  e.target.value
                                )
                              }
                              placeholder="Enter your reason"
                              className={field}
                            />
                          </label>

                          <div className="mt-4 flex flex-wrap items-center gap-4">
                            <button
                              disabled={
                                Boolean(working) ||
                                !cancelReason.trim()
                              }
                              className={button}
                            >
                              {working === "cancel"
                                ? "Submitting…"
                                : "Send cancellation request"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveForm("")
                              }
                              className="text-sm text-[#7d8d80]"
                            >
                              Keep order
                            </button>
                          </div>
                        </form>
                      )}

                    {/* REFUND FORM */}
                    {activeForm === "refund" &&
                      refundable && (
                        <form
                          onSubmit={requestRefund}
                          className="mt-5 max-w-lg rounded-2xl bg-[#f8faf7] p-5"
                        >
                          <p className="text-sm font-medium">
                            Select items for refund
                          </p>

                          <div className="mt-3 space-y-3">
                            {refundChoices.map((item) => {
                              const itemId = String(
                                item.id ||
                                  item.orderItemId
                              );

                              return (
                                <label
                                  key={itemId}
                                  className="flex cursor-pointer items-start gap-3 text-sm text-[#4c6452]"
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-1 accent-[#234d39]"
                                    checked={refundItems.includes(
                                      itemId
                                    )}
                                    onChange={(e) =>
                                      setRefundItems(
                                        (current) =>
                                          e.target
                                            .checked
                                            ? [
                                                ...new Set([
                                                  ...current,
                                                  itemId,
                                                ]),
                                              ]
                                            : current.filter(
                                                (x) =>
                                                  x !==
                                                  itemId
                                              )
                                      )
                                    }
                                  />

                                  {itemName(item)}
                                </label>
                              );
                            })}
                          </div>

                          <label className="mt-4 block text-sm text-[#627466]">
                            Reason

                            <textarea
                              required
                              rows={3}
                              maxLength={500}
                              value={refundReason}
                              onChange={(e) =>
                                setRefundReason(
                                  e.target.value
                                )
                              }
                              placeholder="Describe the issue"
                              className={field}
                            />
                          </label>

                          <div className="mt-4 flex flex-wrap items-center gap-4">
                            <button
                              disabled={
                                Boolean(working) ||
                                !refundItems.length ||
                                !refundReason.trim()
                              }
                              className={button}
                            >
                              {working === "refund"
                                ? "Submitting…"
                                : "Request refund"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveForm("")
                              }
                              className="text-sm text-[#7d8d80]"
                            >
                              Close
                            </button>
                          </div>
                        </form>
                      )}
                  </section>
                )}
              </div>

              <aside className="lg:sticky lg:top-24">
                <PriceSummary order={selected} />
              </aside>
            </div>
          </section>
        ) : (
          /* PAYMENT AND REFUND DETAILS */
          <div className="max-w-2xl">
            <div className="rounded-2xl bg-[#f7f9f5] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#274130]">
                  {titleOf(
                    selected,
                    section === "payments"
                      ? "Payment details"
                      : "Refund details"
                  )}
                </h2>

                <Status
                  value={
                    selected.status ||
                    selected.paymentStatus
                  }
                />
              </div>

              <p className="mt-5 text-2xl font-semibold text-[#234d39]">
                {amount(
                  selected.amount ??
                    selected.totalAmount ??
                    selected.grandTotal ??
                    selected.total,
                  selected.currency
                )}
              </p>

              {selected.createdAt && (
                <p className="mt-2 text-xs text-[#829184]">
                  {dateText(selected.createdAt)}
                </p>
              )}
            </div>

            {section === "payments" &&
              ![
                "PAID",
                "SUCCEEDED",
                "REFUNDED",
              ].includes(
                norm(
                  selected.status ||
                    selected.paymentStatus
                )
              ) && (
                <div className="mt-6">
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#286344] hover:underline"
                    onClick={() =>
                      setActiveForm((v) =>
                        v === "verify"
                          ? ""
                          : "verify"
                      )
                    }
                  >
                    Have provider payment IDs? Verify payment →
                  </button>

                  {activeForm === "verify" && (
                    <form
                      className="mt-4 rounded-2xl bg-[#f8faf7] p-5"
                      onSubmit={verifyPayment}
                    >
                      <label className="block text-sm text-[#627466]">
                        Provider order ID

                        <input
                          required
                          value={providerOrderId}
                          onChange={(e) =>
                            setProviderOrderId(
                              e.target.value
                            )
                          }
                          className={field}
                        />
                      </label>

                      <label className="mt-4 block text-sm text-[#627466]">
                        Provider payment ID

                        <input
                          required
                          value={providerPaymentId}
                          onChange={(e) =>
                            setProviderPaymentId(
                              e.target.value
                            )
                          }
                          className={field}
                        />
                      </label>

                      <button
                        disabled={
                          Boolean(working) ||
                          !providerOrderId.trim() ||
                          !providerPaymentId.trim()
                        }
                        className={`${button} mt-5`}
                      >
                        {working === "verify"
                          ? "Verifying…"
                          : "Verify payment"}
                      </button>
                    </form>
                  )}
                </div>
              )}
          </div>
        )}
      </div>
    </main>
  );
}
