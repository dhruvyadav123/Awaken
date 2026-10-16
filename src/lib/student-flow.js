export function requiredVersion(value, label = "record") {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`The ${label} version is unavailable. Refresh and try again.`);
  return value;
}

export function checkoutItems(cart) {
  if (!Array.isArray(cart?.items) || !cart.items.length) throw new Error("Your cart is empty.");
  if (cart.checkoutReady !== true || cart.totalsComplete !== true || cart.items.some(item => item.available === false)) throw new Error("Resolve unavailable items or incomplete prices in your cart before checkout.");
  return cart.items.map(item => {
    const itemId = item.productId?.id || item.productId || item.product?.id;
    if (!itemId || !Number.isSafeInteger(item.quantity) || item.quantity < 1) throw new Error("A cart item is incomplete. Refresh your cart.");
    const variantId = item.variantId || item.product?.variant?.id;
    return { itemType: "PRODUCT", itemId, ...(variantId ? { variantId } : {}), quantity: item.quantity };
  });
}

export function checkoutBody(cart, shippingAddressId) {
  if (cart?.requiresShipping && !shippingAddressId) throw new Error("Select a delivery address before requesting a quote.");
  return { items: checkoutItems(cart), ...(cart?.requiresShipping ? { shippingAddressId } : {}) };
}

export async function allAccountPages(request, path, keys = ["items"]) {
  const rows = []; let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const result = await request(`${path}${path.includes("?") ? "&" : "?"}page=${page}&limit=20`);
    const data = result.data;
    const items = Array.isArray(data) ? data : keys.map(key => data?.[key]).find(Array.isArray);
    if (!items) throw new Error("The service returned an incomplete list. Please refresh.");
    rows.push(...items);
    pages = Number(result.pagination?.pages ?? data?.pagination?.pages ?? 1);
    if (!Number.isSafeInteger(pages) || pages < 0 || pages > 1000) throw new Error("The service returned invalid pagination.");
  }
  return rows;
}

export function registrationVersion(item) {
  return requiredVersion(item?.registrationVersion ?? item?.registration?.version, "registration");
}

export function joinMessage(item) {
  if (item?.hasAccess === false) return "Access is unavailable. Check your registration or payment status.";
  if (item?.join?.available) return "Joining is available now.";
  if (item?.join?.opensAt && Date.parse(item.join.opensAt) > Date.now()) return `Joining opens ${formatSchedule(item.join.opensAt, item.timezone)}.`;
  if (item?.join?.closesAt && Date.parse(item.join.closesAt) <= Date.now()) return "The joining window has closed.";
  return "Joining is currently unavailable. Refresh to check the latest availability.";
}

export function formatSchedule(value, timezone = "Asia/Kolkata") {
  if (!value || !Number.isFinite(Date.parse(value))) return "Schedule unavailable";
  try { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(new Date(value)) + ` (${timezone})`; }
  catch { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value)) + " (Asia/Kolkata)"; }
}

export function applicationEditable(application) {
  return application?.canEdit !== false && (!application || ["DRAFT", "REOPENED"].includes(application.status));
}

export function safeBankFields(bank = {}) {
  return Object.fromEntries(Object.entries(bank).filter(([key, value]) => value && !(key === "accountNumber" && /[*•]/.test(value))));
}

export function productUnavailable(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (product?.hasVariants || variants.length) return variants.length > 0 && variants.every(variant => variant.inStock === false || variant.isAvailable === false || (variant.status && variant.status !== "ACTIVE"));
  return product?.inStock === false || product?.stockStatus === "OUT_OF_STOCK";
}
