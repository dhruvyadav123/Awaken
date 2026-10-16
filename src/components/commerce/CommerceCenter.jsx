"use client";

import { RecordMedia, RecordDetails } from "@/components/common/ApiRecordDisplay";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { dataOf, externalUrl, listOf, titleOf } from "@/lib/learning-data";

import { Pagination } from "@/components/dashboard/Elements";
import { formatProductPrice } from "@/lib/product-format";
import { recordMedia } from "@/lib/record-display";
const buttonClass = "rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50";

export default function CommerceCenter({ section, id }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1), [pagination, setPagination] = useState(null);
  const lock = useRef(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resultData, setResultData] = useState(null);
  const [lastAction, setLastAction] = useState("");
  const [reason, setReason] = useState("");
  const [itemIds, setItemIds] = useState("");
  const [providerOrderId, setProviderOrderId] = useState("");
  const [providerPaymentId, setProviderPaymentId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const intentKeys = useRef({});
  const keyFor = (name) => intentKeys.current[name] ||= crypto.randomUUID();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const path = `me/${section}${id ? `/${encodeURIComponent(id)}` : `?page=${page}&limit=20`}`;
      const result = await accountFetch(path);
      setData(dataOf(result)); setPagination(result.pagination); setError("");
    } catch (caught) { setError(caught.message); }
    finally { setLoading(false); }
  }, [section, id, page]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function createPaymentAttempt() {
    if (lock.current) return; lock.current = true;
    setWorking("payment"); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/orders/${encodeURIComponent(id)}/payment-attempts`, { method: "POST", body: { idempotencyKey: keyFor(`payment-${id}`) } });
      delete intentKeys.current[`payment-${id}`]; setResultData(dataOf(result)); setLastAction("payment");
      setNotice(result.message || "Payment attempt created. Follow the payment instructions returned by the service."); await load();
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  async function requestRefund(event) {
    event.preventDefault();
    const items = itemIds.split(",").map((value) => value.trim()).filter(Boolean);
    if (lock.current || !items.length || !reason.trim()) return; lock.current = true;
    setWorking("refund"); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/orders/${encodeURIComponent(id)}/refunds`, { method: "POST", body: { items, idempotencyKey: keyFor(`refund-${id}`), reason: reason.trim() } });
      delete intentKeys.current[`refund-${id}`]; setResultData(dataOf(result)); setLastAction("refund");
      setNotice(result.message || "Refund request submitted."); setReason("");
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  async function verifyPayment(event) {
    event.preventDefault();
    if (lock.current || !providerOrderId.trim() || !providerPaymentId.trim()) return; lock.current = true;
    setWorking("verify"); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/payments/${encodeURIComponent(id)}/verify`, { method: "POST", body: { providerOrderId: providerOrderId.trim(), providerPaymentId: providerPaymentId.trim() } });
      setResultData(dataOf(result)); setLastAction("verify"); setNotice(result.message || "Payment verification submitted."); await load();
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }

  async function cancelOrder(event) {
    event.preventDefault(); if (lock.current || !cancelReason.trim()) return; lock.current = true; setWorking("cancel"); setError("");
    try { const latest = await accountFetch(`me/orders/${encodeURIComponent(id)}`); const order = latest.data?.order || latest.data; if (order?.version == null) throw new Error("The current order version is unavailable."); const result = await accountFetch(`me/orders/${encodeURIComponent(id)}/cancel`, { method: "POST", body: { version: order.version, reason: cancelReason.trim() } }); setNotice(result.message || "Cancellation submitted."); setCancelReason(""); await load(); }
    catch (caught) { setError(caught.message); } finally { lock.current = false; setWorking(""); }
  }

  const orders = listOf(data, ["orders", "items", "recentOrders"]);
  const entries = section === "orders" ? orders : listOf(data, [section, "items"]);
  const selected = data?.[section.slice(0, -1)] || data;
  const orderItems = section === "orders" && id ? listOf(selected, ["items", "orderItems"]) : [];
  const paymentUrl = lastAction === "payment" ? externalUrl(resultData) || externalUrl(resultData?.checkout) || externalUrl(resultData?.payment) : "";
  const generatedPaymentId = lastAction === "payment" ? resultData?.payment?.id || resultData?.paymentId || resultData?.id : null;
  const generatedRefundId = lastAction === "refund" ? resultData?.refund?.id || resultData?.refundId || resultData?.id : null;
  const cancelled = ["CANCELLED", "CANCELED"].includes(selected?.orderStatus);
  const canPay = !cancelled && ["PENDING", "FAILED"].includes(selected?.paymentStatus);
  const canRefund = ["PAID", "PARTIALLY_REFUNDED"].includes(selected?.paymentStatus);
  const heading = section === "orders" ? id ? "Order actions" : "Recent orders" : section === "payments" ? id ? "Payment details" : "My payments" : id ? "Refund details" : "My refunds";

  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c]"><div className="mx-auto max-w-4xl"><Link href={id ? `/profile/${section}` : "/profile"} className="text-sm font-semibold text-[#315a48] underline">← Back</Link><h1 className="mt-8 font-[Georgia,serif] text-4xl">{heading}</h1>{["orders", "payments"].includes(section) && <p className="mt-4 text-sm">After payment is confirmed, your digital resources are available in <Link className="font-semibold underline" href="/profile/digital-library">My digital library</Link>.</p>}{!loading && id && selected && <><RecordDetails record={selected} /><RecordMedia record={selected} imagesOnly /></>}
    {loading && <p className="mt-6" role="status">Loading…</p>}{error && <p className="mt-6 rounded-lg bg-[#fff4f0] p-4 text-sm text-[#8a4c3c]" role="alert">{error}</p>}{notice && <p className="mt-6 rounded-lg bg-[#edf5ed] p-4 text-sm" role="status">{notice}</p>}
    {!loading && !error && !id && (entries.length ? <div className="mt-8 grid gap-3">{entries.map((entry) => { const itemId = entry.id || entry.orderId || entry.paymentId || entry.refundId; return <Link key={itemId} href={`/profile/${section}/${encodeURIComponent(itemId)}`} className="rounded-xl border border-[#dfe7dd] bg-white p-5"><strong>{titleOf(entry, `${section === "orders" ? "Order" : section === "payments" ? "Payment" : "Refund"} ${entry.number || entry.orderNumber || itemId}`)}</strong><span className="mt-2 block text-sm text-[#647368]">{entry.orderStatus || entry.status || "View details"}{entry.paymentStatus && ` ? Payment: ${entry.paymentStatus}`}{entry.grandTotal != null && ` ? ${formatProductPrice({ price: entry.grandTotal, currency: entry.currency })}`}</span></Link>; })}</div> : <p className="mt-8 rounded-xl bg-white p-6">{section === "orders" ? "No recent orders were returned by the dashboard." : `No ${section} were returned.`}</p>)}
    {!id && !loading && !error && <Pagination page={page} pagination={pagination} count={entries.length} loading={loading} onChange={setPage} />}
    {!loading && !error && id && selected && <div className="mt-8 space-y-6"><section className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">{section === "orders" ? `Order ${selected.orderNumber || id}` : titleOf(selected, `${section === "payments" ? "Payment" : "Refund"} ${id}`)}</h2>{(selected?.orderStatus || selected?.status) && <p className="mt-2 text-sm">Status: <strong>{selected.orderStatus || selected.status}</strong></p>}{(selected?.grandTotal ?? selected?.amount ?? selected?.totalAmount ?? selected?.total) != null && <p className="mt-2 text-sm">Amount: {selected.currency || ""} {selected.grandTotal ?? selected.amount ?? selected.totalAmount ?? selected.total}</p>}</section>
      {section === "orders" && <><OrderDetails order={selected} /><p className="text-sm text-[#647368]">{cancelled ? "This order is cancelled." : canPay ? "Payment is pending. Continue below to create a payment attempt." : `Payment status: ${selected.paymentStatus || "Unavailable"}.`}{!canRefund && " Refund requests become available for eligible paid orders."}</p><form onSubmit={cancelOrder} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Cancel order</h2><label className="mt-4 block text-sm">Reason<textarea required maxLength={500} value={cancelReason} onChange={event => setCancelReason(event.target.value)} className="mt-2 min-h-24 w-full rounded border border-[#cbd8cb] p-3" /></label><button disabled={Boolean(working) || cancelled || !cancelReason.trim() || selected.version == null} className={`${buttonClass} mt-4`}>{working === "cancel" ? "Submitting…" : "Request cancellation"}</button></form><section className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Payment attempt</h2><p className="mt-2 text-sm text-[#647368]">Create an attempt for this order, then follow the returned payment instructions.</p><button type="button" disabled={Boolean(working) || !canPay} onClick={createPaymentAttempt} className={`${buttonClass} mt-4`}>{working === "payment" ? "Creating…" : "Create payment attempt"}</button>{paymentUrl && <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block text-sm font-semibold text-[#315a48] underline">Open payment page ↗</a>}{generatedPaymentId && <Link href={`/profile/payments/${encodeURIComponent(generatedPaymentId)}`} className="mt-3 block text-sm font-semibold text-[#315a48] underline">View payment status</Link>}</section>
        <form onSubmit={requestRefund} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Request a refund</h2><p className="mt-2 text-sm text-[#647368]">Select order items or enter their IDs from your receipt.</p>{orderItems.length > 0 && <div className="mt-4 grid gap-2">{orderItems.map((item) => { const itemId = item.id || item.orderItemId; return <label key={itemId} className="flex gap-2 text-sm"><input type="checkbox" checked={itemIds.split(",").includes(String(itemId))} onChange={(event) => setItemIds((current) => { const ids = current.split(",").map((value) => value.trim()).filter(Boolean); return (event.target.checked ? [...new Set([...ids, String(itemId)])] : ids.filter((value) => value !== String(itemId))).join(","); })} />{titleOf(item.product || item, `Item ${itemId}`)}</label>; })}</div>}<label className="mt-4 block text-sm">Order item IDs (comma separated)<input required value={itemIds} onChange={(event) => setItemIds(event.target.value)} className="mt-2 block w-full rounded border border-[#cbd8cb] p-3" /></label><label className="mt-4 block text-sm">Reason<textarea required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-24 w-full rounded border border-[#cbd8cb] p-3" /></label><button disabled={Boolean(working) || !canRefund || !itemIds.trim() || !reason.trim()} className={`${buttonClass} mt-4`}>{working === "refund" ? "Submitting…" : "Request refund"}</button>{generatedRefundId && <Link href={`/profile/refunds/${encodeURIComponent(generatedRefundId)}`} className="mt-3 block text-sm font-semibold text-[#315a48] underline">View refund status</Link>}</form></>}
      {section === "payments" && <form onSubmit={verifyPayment} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Verify payment</h2><p className="mt-2 text-sm text-[#647368]">Use the IDs returned by your payment provider after completing payment.</p><label className="mt-4 block text-sm">Provider order ID<input required value={providerOrderId} onChange={(event) => setProviderOrderId(event.target.value)} className="mt-2 block w-full rounded border border-[#cbd8cb] p-3" /></label><label className="mt-4 block text-sm">Provider payment ID<input required value={providerPaymentId} onChange={(event) => setProviderPaymentId(event.target.value)} className="mt-2 block w-full rounded border border-[#cbd8cb] p-3" /></label><button disabled={Boolean(working) || ["PAID", "SUCCEEDED", "REFUNDED"].includes(selected.status) || !providerOrderId.trim() || !providerPaymentId.trim()} className={`${buttonClass} mt-4`}>{working === "verify" ? "Verifying…" : "Verify payment"}</button></form>}
    </div>}
  </div></main>;
}

function OrderItem({ item, currency }) {
  const snapshot = item.snapshot || {};
  const title = item.titleSnapshot || snapshot.name || "Order item";
  const hasImage = recordMedia(snapshot, { imagesOnly: true }).length > 0;
  return <li className="flex items-start gap-4 border-b border-[#dfe7dd] pb-4">
    {hasImage ? <div className="w-20 shrink-0 overflow-hidden rounded-lg bg-[#eef1e9] sm:w-28"><RecordMedia record={{ ...snapshot, title, imageAlt: title }} imagesOnly compact /></div> : item.itemType === "PRODUCT" ? <div className="flex min-h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[#eef1e9] p-2 text-center text-xs text-[#647368] sm:w-28">No product image</div> : null}
    <div className="min-w-0 flex-1"><strong className="block break-words">{title}</strong>
      {snapshot.variant?.name && <p className="mt-1 text-sm text-[#647368]">{snapshot.variant.name}</p>}
      <p className="mt-1 text-sm">Quantity: {item.quantity}</p>
      <p className="mt-1 text-sm font-semibold">{formatProductPrice({ price: item.finalPrice, currency })}</p>
      {item.fulfillment?.hasAccess === true && item.itemType === "PRODUCT" && snapshot.productType === "DIGITAL" && <Link className="mt-2 inline-block text-sm underline" href="/profile/digital-library">Open digital library</Link>}
    </div>
  </li>;
}

function OrderDetails({ order }) {
  return <section className="rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Order summary</h2><p className="mt-3 text-sm">Payment: {order.paymentStatus} ? Fulfillment: {order.fulfillmentStatus}</p><ul className="mt-4 space-y-4">{order.items?.map(item => <OrderItem key={item.id} item={item} currency={order.currency} />)}</ul><dl className="mt-5 space-y-2 text-sm">{[["Subtotal","subtotal"],["Discount","discount"],["Tax","tax"],["Shipping","shipping"],["Total","grandTotal"]].map(([label,key]) => <div key={key} className="flex justify-between gap-3"><dt>{label}</dt><dd>{formatProductPrice({ price: order[key], currency: order.currency })}</dd></div>)}</dl>{order.shippingAddressSnapshot && <div className="mt-6"><h3 className="font-semibold">Delivery address</h3><p className="mt-2 whitespace-pre-line text-sm leading-6">{[order.shippingAddressSnapshot.fullName,order.shippingAddressSnapshot.addressLine1,order.shippingAddressSnapshot.addressLine2,order.shippingAddressSnapshot.city,order.shippingAddressSnapshot.state,order.shippingAddressSnapshot.postalCode,order.shippingAddressSnapshot.country].filter(Boolean).join("\n")}</p></div>}{order.shipment && <div className="mt-5"><h3 className="font-semibold">Shipment</h3><RecordDetails record={order.shipment} /></div>}{order.payments?.length > 0 && <div className="mt-5"><h3 className="font-semibold">Payments</h3>{order.payments.map(payment => <Link className="mt-2 block text-sm underline" key={payment.id} href={"/profile/payments/"+encodeURIComponent(payment.id)}>{payment.status} ? {formatProductPrice({price:payment.amount,currency:payment.currency||order.currency})}</Link>)}</div>}{order.refunds?.length > 0 && <div className="mt-5"><h3 className="font-semibold">Refunds</h3>{order.refunds.map(refund => <Link className="mt-2 block text-sm underline" key={refund.id} href={"/profile/refunds/"+encodeURIComponent(refund.id)}>{refund.status} ? {formatProductPrice({price:refund.amount,currency:refund.currency||order.currency})}</Link>)}</div>}</section>;
}
