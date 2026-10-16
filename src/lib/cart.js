import { accountFetch } from "./client-account";
import { requiredVersion } from "./student-flow";

const CART_STORAGE_KEY = "awm-cart";
export const CART_UPDATED_EVENT = "awm-cart-updated";

let cartCache = null;

export function readCart() {
  if (typeof window === "undefined") return [];
  if (cartCache) return cartCache.items || [];
  try {
    const cart = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "null");
    if (cart && Array.isArray(cart.items)) { cartCache = cart; return cart.items; }
    return [];
  } catch {
    return [];
  }
}

export function readCartSnapshot() {
  if (typeof window === "undefined") return null;
  if (cartCache) return cartCache;
  try { cartCache = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "null"); } catch { cartCache = null; }
  return cartCache;
}

function writeCart(cart) {
  if (!cart || !Array.isArray(cart.items)) throw new Error("The cart response is incomplete. Refresh your cart.");
  requiredVersion(cart.version, "cart");
  cartCache = cart;
  try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartCache)); } catch { /* Server cart remains authoritative when local storage is unavailable. */ }
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export async function refreshCart() {
  const result = await accountFetch("me/cart");
  writeCart(result.data);
  return result.data;
}

export async function addProductToCart(productId, variantId, quantity = 1) {
  const cart = await refreshCart();
  const result = await accountFetch("me/cart/items", { method: "POST", body: { version: requiredVersion(cart?.version, "cart"), productId, ...(variantId ? { variantId } : {}), quantity } });
  writeCart(result.data);
  return result;
}

export async function updateCartItem(item, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Quantity must be a positive whole number.");
  const cart = await refreshCart();
  const result = await accountFetch(`me/cart/items/${encodeURIComponent(item.id || item.cartItemId)}`, { method: "PATCH", body: { version: requiredVersion(cart?.version, "cart"), quantity } });
  writeCart(result.data);
  return result;
}

export async function removeProductFromCart(item) {
  const latest = await refreshCart();
  await accountFetch(`me/cart/items/${encodeURIComponent(item.id || item.cartItemId)}`, { method: "DELETE", body: { version: requiredVersion(latest?.version, "cart") } });
  const cart = await accountFetch("me/cart");
  writeCart(cart.data);
}

export function getCartItemCount(cart = readCart()) {
  return cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}
