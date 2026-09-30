import { products } from "../data/products";

const CART_STORAGE_KEY = "awm-cart";
export const CART_UPDATED_EVENT = "awm-cart-updated";

export function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const cart = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(cart)) return [];
    return cart.filter(item => products.some(product => product.id === item.id));
  } catch {
    return [];
  }
}

function writeCart(cart) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addProductToCart(productId) {
  if (!products.some(product => product.id === productId)) return;
  const cart = readCart();
  if (!cart.some(item => item.id === productId)) {
    writeCart([...cart, { id: productId, quantity: 1 }]);
  }
}

export function removeProductFromCart(productId) {
  writeCart(readCart().filter(item => item.id !== productId));
}

export function getCartItemCount(cart = readCart()) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}