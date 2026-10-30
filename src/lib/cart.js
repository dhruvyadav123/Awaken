import { accountFetch } from "./client-account";
import { requiredVersion } from "./student-flow";

const CART_STORAGE_KEY = "awm-cart";
export const CART_UPDATED_EVENT = "awm-cart-updated";

let cartCache = null;
let cartCheckedAt = 0;
let cartSession = "";
let cartRequest = null;
let mutations = Promise.resolve();
const CART_FRESH_MS = 30000;

function sessionKey() {
  return typeof document === "undefined" ? "" : document.cookie.match(/(?:^|; )awm-csrf-token=([^;]*)/)?.[1] || "";
}

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
  cartCheckedAt = Date.now();
  cartSession = sessionKey();
  try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartCache)); } catch { /* Server cart remains authoritative when local storage is unavailable. */ }
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export async function refreshCart() {
  if (cartRequest) return cartRequest;
  const request = (async () => {
    const result = await accountFetch("me/cart");
    writeCart(result.data);
    return result.data;
  })();
  cartRequest = request;
  try { return await request; }
  finally { if (cartRequest === request) cartRequest = null; }
}

// Only a recently confirmed in-memory snapshot can skip a preliminary GET.
// Serialize writes so rapid clicks use the version returned by the last write.
function mutateCart(send) {
  const request = mutations.then(async () => {
    let cart = cartRequest ? await cartRequest : cartCache && cartSession === sessionKey() && Date.now() - cartCheckedAt < CART_FRESH_MS ? cartCache : await refreshCart();
    try { return await send(cart); }
    catch (error) {
      cartCheckedAt = 0;
      if (!["CART_VERSION_CONFLICT", "VERSION_CONFLICT"].includes(error?.code)) throw error;
      cart = await refreshCart();
      return send(cart);
    }
  });
  mutations = request.catch(() => {});
  return request;
}

export async function addCartItem({
  itemType = "PRODUCT",
  itemId,
  productId,
  variantId,
  availabilityId,
  startsAt,
  quantity = 1,
}) {
  if (!itemId && !productId) throw new Error("The item to add to cart is missing.");
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Quantity must be a positive whole number.");

  const normalizedType = String(itemType || "PRODUCT").toUpperCase();
  const normalizedId = itemId || productId;
  return mutateCart(async (cart) => {
  const body = normalizedType === "PRODUCT"
    ? { version: requiredVersion(cart?.version, "cart"), productId: normalizedId, ...(variantId ? { variantId } : {}), quantity }
    : { version: requiredVersion(cart?.version, "cart"), itemType: normalizedType, itemId: normalizedId, ...(availabilityId ? { availabilityId } : {}), ...(startsAt ? { startsAt } : {}), quantity };
  const result = await accountFetch("me/cart/items", { method: "POST", body });
  writeCart(result.data);
  return result;
  });
}

export async function addProductToCart(productId, variantId, quantity = 1) {
  return addCartItem({ itemType: "PRODUCT", itemId: productId, variantId, quantity });
}

export async function addCourseToCart(courseId, quantity = 1) {
  return addCartItem({ itemType: "COURSE", itemId: courseId, quantity });
}

export async function addSessionToCart(sessionTypeId, availabilityId, startsAt, quantity = 1) {
  return addCartItem({ itemType: "SESSION", itemId: sessionTypeId, availabilityId, startsAt, quantity });
}

export async function addMembershipToCart(planId, quantity = 1) {
  return addCartItem({ itemType: "MEMBERSHIP", itemId: planId, quantity });
}

export async function updateCartItem(item, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Quantity must be a positive whole number.");
  return mutateCart(async (cart) => {
  const result = await accountFetch(`me/cart/items/${encodeURIComponent(item.id || item.cartItemId)}`, { method: "PATCH", body: { version: requiredVersion(cart?.version, "cart"), quantity } });
  writeCart(result.data);
  return result;
  });
}

export async function removeProductFromCart(item) {
  return mutateCart(async (latest) => {
    const result = await accountFetch(`me/cart/items/${encodeURIComponent(item.id || item.cartItemId)}`, { method: "DELETE", body: { version: requiredVersion(latest?.version, "cart") } });
    if (Array.isArray(result.data?.items)) writeCart(result.data);
    else await refreshCart();
    return result;
  });
}

export function getCartItemCount(cart = readCart()) {
  return cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}
