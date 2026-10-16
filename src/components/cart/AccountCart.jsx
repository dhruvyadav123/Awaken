"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import { recordMedia } from "@/lib/record-display";
import { CART_UPDATED_EVENT, readCartSnapshot, refreshCart, removeProductFromCart, updateCartItem } from "@/lib/cart";
import { formatProductPrice } from "@/lib/product-format";

export default function AccountCart({ products = [] }) {
  const [cart, setCart] = useState(null);
  const lock = useRef(false);
  const [busyId, setBusyId] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const sync = () => { if (active) setCart(readCartSnapshot()); };
    refreshCart().catch((caught) => { if (active) setError(caught.message); }).finally(() => { if (active) setLoading(false); });
    window.addEventListener(CART_UPDATED_EVENT, sync);
    return () => { active = false; window.removeEventListener(CART_UPDATED_EVENT, sync); };
  }, []);

  async function reload() {
    if (lock.current) return;
    lock.current = true; setLoading(true); setError(""); setNotice("");
    try { await refreshCart(); }
    catch (caught) { setError(caught.message); }
    finally { lock.current = false; setLoading(false); }
  }

  async function change(item, action) {
    if (lock.current || loading) return;
    lock.current = true;
    setBusyId(item.id || item.cartItemId); setBusyAction(action); setError(""); setNotice("");
    try {
      if (action === "remove") await removeProductFromCart(item);
      else await updateCartItem(item, action);
      setNotice(action === "remove" ? "Item removed from your cart." : "Quantity and totals updated.");
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setBusyId(""); setBusyAction(""); }
  }

  const items = cart?.items || [];
  const currency = cart?.currency || "INR";
  const amount = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
    ? formatProductPrice({ price: Number(value), currency }) : "Unavailable";
  const disabled = loading || Boolean(busyId);
  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c] sm:px-8"><div className="mx-auto max-w-5xl">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">Awaken / Cart</p>
    <h1 className="mt-3 font-[Georgia,serif] text-4xl sm:text-5xl">Your cart</h1>
    {error && <div role="alert" className="mt-6 rounded bg-[#fff4f0] p-4 text-sm text-[#8a4c3c]">{error}{error.toLowerCase().includes("sign in") ? <> <Link className="underline" href="/auth/login?next=%2Fcart">Sign in</Link></> : <button type="button" disabled={disabled} onClick={reload} className="ml-3 underline">Refresh cart</button>}</div>}
    {notice && <p role="status" className="mt-4 text-sm">{notice}</p>}
    {loading && <p role="status" className="mt-8">Loading your cart...</p>}
    {cart && !loading && !items.length && <div className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-8"><h2 className="font-[Georgia,serif] text-2xl">Your cart is empty.</h2><p className="mt-3 text-sm text-[#647368]">Products you add from the shop will appear here.</p><Link className="mt-5 inline-block font-semibold text-[#315a48] underline" href="/shop">Continue shopping</Link></div>}
    {items.length > 0 && <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]"><section className="grid content-start gap-4" aria-label="Cart items">{items.map((item, index) => {
      const productId = item.productId?.id || item.productId || item.product?.id;
      const product = item.product || (typeof item.productId === "object" ? item.productId : null) || products.find((entry) => String(entry.id) === String(productId));
      const title = item.title || item.productName || product?.title || product?.name || "Product";
      const itemKey = item.id || item.cartItemId || `${productId}-${index}`;
      const price = item.finalUnitPrice ?? item.unitPrice;
      const variant = item.variantName || item.variant?.name || product?.variant?.name;
      const imageRecord = recordMedia(product, { imagesOnly: true }).length ? product : item;
      return <article key={itemKey} aria-busy={busyId === itemKey} className="flex flex-wrap items-start gap-4 rounded-xl border border-[#dfe7dd] bg-white p-5">
        <div className="w-24 shrink-0 overflow-hidden rounded-lg bg-[#eef1e9] sm:w-28">{recordMedia(imageRecord, { imagesOnly: true }).length ? <RecordMedia record={imageRecord} imagesOnly compact /> : <span className="flex min-h-24 items-center justify-center p-3 text-center text-xs text-[#647368]">No product image</span>}</div>
        <div className="min-w-0 flex-1"><h2 className="font-[Georgia,serif] text-xl">{product?.slug ? <Link href={`/shop/${encodeURIComponent(product.slug)}`} className="hover:underline">{title}</Link> : title}</h2>
          {variant && <p className="mt-1 text-sm text-[#647368]">{variant}</p>}
          <p className="mt-2 text-sm text-[#647368]">{amount(price)} each · quantity {item.quantity}</p>
          <p className="mt-2 text-sm font-semibold">Item total: {amount(item.lineTotal)}</p>
          {item.membershipDiscountPercent > 0 && <p className="mt-1 text-xs text-[#647368]">Membership discount: {item.membershipDiscountPercent}% included in this price</p>}
          {item.available === false && <p role="status" className="mt-2 text-sm text-[#8a4c3c]">{item.reason || "This item is currently unavailable."}</p>}
          {item.priceChanged && <p className="mt-2 text-sm">The price has changed. Review the current price before checkout.</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3"><div className="flex items-center gap-2" role="group" aria-label={`${title} quantity`}>
            <button type="button" aria-label={`Decrease ${title} quantity`} disabled={disabled || Number(item.quantity) <= 1} onClick={() => change(item, Number(item.quantity) - 1)} className="h-9 w-9 rounded border border-[#cbd8cb] disabled:opacity-40">−</button>
            <span className="min-w-7 text-center">{item.quantity}</span>
            <button type="button" aria-label={`Increase ${title} quantity`} disabled={disabled || item.available === false} onClick={() => change(item, Number(item.quantity) + 1)} className="h-9 w-9 rounded border border-[#cbd8cb] disabled:opacity-40">+</button>
          </div><button type="button" disabled={disabled} aria-label={`Remove ${title} from cart`} onClick={() => change(item, "remove")} className="px-2 py-2 text-sm text-[#8a4c3c] underline disabled:opacity-50">{busyId === itemKey && busyAction === "remove" ? "Removing..." : "Remove from cart"}</button></div>
        </div>
      </article>;
    })}</section><aside className="h-fit rounded-xl border border-[#dfe7dd] bg-white p-6" aria-label="Order summary"><h2 className="font-[Georgia,serif] text-2xl">Order summary</h2>
      <p className="mt-5 flex justify-between border-t border-[#e5e9e8] pt-4 text-sm"><span>Subtotal</span><strong>{amount(cart.subtotal)}</strong></p>
      <p className="mt-3 flex justify-between text-sm"><span>Discount</span><strong>{amount(cart.discount)}</strong></p>
      <p className="mt-3 flex justify-between text-sm"><span>Total</span><strong>{cart.totalsComplete === true ? amount(cart.total) : "Pricing incomplete"}</strong></p>
      <p className="mt-4 text-sm leading-6 text-[#647368]">{cart.checkoutReady ? "Review the final quote, including any shipping and tax, at checkout." : "Resolve unavailable items or incomplete prices before checkout."}</p>
      {cart.checkoutReady === true && cart.totalsComplete === true && !disabled && !error && <Link href="/checkout" className="mt-5 inline-flex rounded-lg bg-[#315a48] px-5 py-3 text-sm font-semibold text-white">Proceed to checkout</Link>}
      <Link href="/shop" className="mt-5 block text-sm font-semibold text-[#315a48] underline">Continue shopping</Link>
    </aside></div>}
  </div></main>;
}
