"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { refreshCart, CART_UPDATED_EVENT, readCartSnapshot } from "@/lib/cart";
import { allAccountPages, checkoutBody } from "@/lib/student-flow";
import { formatProductPrice } from "@/lib/product-format";
import AddressBook from "@/components/account/AddressBook";

const button = "rounded-lg bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50";
export default function Checkout() {
  const [cart, setCart] = useState(null), [addresses, setAddresses] = useState([]), [addressId, setAddressId] = useState("");
  const [quote, setQuote] = useState(null), [order, setOrder] = useState(null), [loading, setLoading] = useState(true), [working, setWorking] = useState("");
  const [error, setError] = useState(""), [addressError, setAddressError] = useState(""), [expired, setExpired] = useState(false);
  const lock = useRef(false), intent = useRef({});
  const loadAddresses = useCallback(async () => {
    try { const rows = (await allAccountPages(accountFetch, "me/addresses", ["addresses", "items"])).filter(row => !row.archivedAt); setAddresses(rows); setAddressId(current => rows.some(row => row.id === current) ? current : rows.find(row => row.isDefault)?.id || rows[0]?.id || ""); setAddressError(""); }
    catch (caught) { setAddressError(caught.message); }
  }, []);
  const load = useCallback(async () => {
    setLoading(true); setError(""); setQuote(null);
    try { setCart(await refreshCart()); await loadAddresses(); } catch (caught) { setError(caught.message); }
    finally { setLoading(false); }
  }, [loadAddresses]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); const sync = () => { setCart(readCartSnapshot()); setQuote(null); }; window.addEventListener(CART_UPDATED_EVENT, sync); return () => { clearTimeout(timer); window.removeEventListener(CART_UPDATED_EVENT, sync); }; }, [load]);
  useEffect(() => { if (!quote) return; const timer = setTimeout(() => setExpired(true), Math.max(0, quote.expiresAt - Date.now())); return () => clearTimeout(timer); }, [quote]);
  async function getQuote() {
    if (lock.current) return; lock.current = true; setWorking("quote"); setError(""); setQuote(null);
    try {
      const latest = await refreshCart(); setCart(latest);
      const body = checkoutBody(latest, addressId);
      const result = await accountFetch("me/checkout/quote", { method: "POST", body });
      if (!result.data || !Number.isFinite(result.data.grandTotal) || !(result.data.expiresIn > 0)) throw new Error("The quote is incomplete. Please request a fresh quote.");
      setQuote({ data: result.data, body, version: latest.version, expiresAt: Date.now() + result.data.expiresIn * 1000 }); setExpired(false);
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }
  async function placeOrder() {
    if (lock.current || !quote || order) return; lock.current = true; setWorking("order"); setError("");
    try {
      if (Date.now() >= quote.expiresAt) { setExpired(true); throw new Error("Your quote has expired. Request a new quote before placing the order."); }
      const latest = (await accountFetch("me/cart")).data;
      const body = checkoutBody(latest, addressId);
      if (latest.version !== quote.version || JSON.stringify(body) !== JSON.stringify(quote.body)) { setCart(latest); setQuote(null); throw new Error("Your cart or delivery address changed. Review a new quote before placing the order."); }
      const signature = JSON.stringify(body);
      if (intent.current.signature !== signature) intent.current = { signature, key: crypto.randomUUID() };
      const result = await accountFetch("me/checkout", { method: "POST", body: { ...body, idempotencyKey: intent.current.key } });
      const created = result.data?.order || result.data;
      if (!created?.id) throw new Error("The order could not be confirmed. Retry with the same request or check My orders.");
      setOrder(created);
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(""); }
  }
  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c]"><div className="mx-auto max-w-5xl"><Link href="/cart" className="text-sm font-semibold underline">Back to cart</Link><h1 className="mt-6 font-[Georgia,serif] text-4xl">Checkout</h1><p className="mt-3 text-sm text-[#647368]">Review your items, delivery details and final quote before placing your order.</p>
    {loading && <p className="mt-6" role="status">Loading checkout…</p>}{error && <p role="alert" className="mt-6 rounded bg-[#fff4f0] p-4">{error} {/sign.in/i.test(error) && <Link className="underline" href="/auth/login?next=%2Fcheckout">Sign in to checkout</Link>} <button className="underline" disabled={Boolean(working)} onClick={load}>Refresh checkout</button></p>}
    {order ? <section className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Order {order.orderNumber || "created"}</h2><p className="mt-3">Order status: {order.orderStatus} · Payment: {order.paymentStatus}</p><p className="mt-3">{formatProductPrice({ price: order.grandTotal, currency: order.currency })}</p><p className="mt-3 text-sm">{order.paymentStatus === "PENDING" ? "Your order is placed. Complete payment from the order page." : "Open the order to view its latest status and access details."}</p><Link className={`${button} mt-5 inline-flex`} href={`/profile/orders/${encodeURIComponent(order.id)}`}>View order and payment</Link></section> : !loading && cart && <>
      <section className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Your items</h2><ul className="mt-4 space-y-3">{cart.items?.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-[#dfe7dd] pb-3"><span>{item.product?.name || "Product"}{item.product?.variant?.name && ` · ${item.product.variant.name}`} × {item.quantity}</span><span>{formatProductPrice({ price: item.lineTotal, currency: cart.currency })}</span></li>)}</ul>{!cart.items?.length && <p>Your cart is empty. <Link href="/shop" className="underline">Explore the shop</Link></p>}</section>
      {cart.requiresShipping && <section className="mt-6 rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Delivery address</h2>{addressError && <p role="alert" className="mt-3">{addressError} <button className="underline" onClick={loadAddresses}>Retry addresses</button></p>}<label className="mt-4 block text-sm">Select a saved address<select aria-label="Delivery address" disabled={Boolean(working)} value={addressId} onChange={event => { setAddressId(event.target.value); setQuote(null); }} className="mt-2 w-full rounded border border-[#cbd8cb] bg-white p-3"><option value="">Select an address</option>{addresses.map(address => <option key={address.id} value={address.id}>{address.label} — {address.fullName}, {address.addressLine1}, {address.city}, {address.postalCode}{address.isDefault ? " (Default)" : ""}</option>)}</select></label><details className="mt-5"><summary className="cursor-pointer text-sm font-semibold underline">Add or manage addresses</summary><AddressBook onChange={async () => { setQuote(null); await loadAddresses(); }} /></details></section>}
      <section className="mt-6 rounded-xl border border-[#dfe7dd] bg-white p-6"><h2 className="font-[Georgia,serif] text-2xl">Review final quote</h2><button className={`${button} mt-4`} disabled={Boolean(working) || !cart.checkoutReady || !cart.items?.length || (cart.requiresShipping && (!addressId || Boolean(addressError)))} onClick={getQuote}>{working === "quote" ? "Calculating…" : "Get final quote"}</button>{!cart.checkoutReady && <p className="mt-3 text-sm">Return to your cart to resolve unavailable items or incomplete pricing.</p>}{quote && <><dl className="mt-5 space-y-2 text-sm">{[["Subtotal", "subtotal"], ["Discount", "discount"], ["Tax", "tax"], ["Shipping", "shipping"], ["Total", "grandTotal"]].map(([label, key]) => <div className="flex justify-between gap-3" key={key}><dt>{label}</dt><dd>{formatProductPrice({ price: quote.data[key], currency: quote.data.currency })}</dd></div>)}</dl><p role="status" className="mt-4 text-sm">{expired ? "This quote has expired. Request a new quote." : "Review these totals before confirming. Payment status is confirmed on the order page."}</p><button className={`${button} mt-4`} disabled={Boolean(working) || expired} onClick={placeOrder}>{working === "order" ? "Placing order…" : "Place order"}</button></>}</section>
    </>}
  </div></main>;
}
