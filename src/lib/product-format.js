export function formatProductPrice(product) {
  const raw = product?.discountPrice ?? product?.price ?? product?.amount ?? product?.regularPrice;
  if ((typeof raw !== "number" && typeof raw !== "string") || (typeof raw === "string" && !raw.trim())) return "";
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return "";
  const currency = typeof product?.currency === "string" && /^[A-Z]{3}$/.test(product.currency) ? product.currency : null;
  if (!currency) return "";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return currency + " " + amount.toLocaleString("en-IN");
  }
}
