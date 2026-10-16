export function isFreeDigitalProduct(product) {
  const price = product?.discountPrice ?? product?.price ?? product?.amount ?? product?.regularPrice;
  return product?.productType === "DIGITAL" && price != null && price !== "" && Number(price) === 0;
}

export function digitalFilePath(grant, entitlementId, fileId) {
  if (typeof grant?.path !== "string") throw new Error("File access is unavailable. Please try again.");
  const path = grant.path.replace(/^\/api\/v1\//, "").replace(/^\//, "");
  const expected = `digital-library/files/${encodeURIComponent(entitlementId)}/${encodeURIComponent(fileId)}`;
  if (path.split("?")[0] !== expected || !new URLSearchParams(path.split("?")[1]).get("token")) {
    throw new Error("The service returned an invalid file access link.");
  }
  return path;
}

export function canAccessDigitalItem(item) {
  return item?.hasAccess === true && item?.status === "ACTIVE" && (!item.expiresAt || Date.parse(item.expiresAt) > Date.now());
}

export async function digitalFileBlob(request, entitlementId, fileId) {
  const result = await request(`me/digital-library/${encodeURIComponent(entitlementId)}/access?fileId=${encodeURIComponent(fileId)}`);
  return request(digitalFilePath(result.data, entitlementId, fileId), { responseType: "blob" });
}
