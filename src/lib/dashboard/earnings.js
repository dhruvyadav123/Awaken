export function earningsPaths(currency, page = 1, id) {
  const code = String(currency).trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new Error("Enter a three-letter currency code.");
  if (!Number.isSafeInteger(page) || page < 1) throw new Error("Invalid earnings page.");
  return {
    list: `facilitator/earnings?currency=${code}&page=${page}&limit=20`,
    summary: `facilitator/earnings/summary?currency=${code}`,
    detail: id ? `facilitator/earnings/${encodeURIComponent(id)}` : null,
    currency: code,
  };
}
