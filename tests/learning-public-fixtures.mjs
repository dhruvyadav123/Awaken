// Test-server responses only. This module is never imported by the application.
if (process.env.AWAKEN_LEARNING_TEST_FIXTURES !== "1") throw Error("Learning fixtures require the isolated test server flag.");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (url.pathname.includes("/api/v1/public/")) {
    const path = url.pathname.split("/api/v1/public/")[1];
    const data = path === "website" ? { general: { siteName: "AwakenWithMeheck" }, components: [] } : path === "products" ? [{ id: "journal", title: "Practice Journal", slug: "practice-journal", description: "A journal for your daily practice.", productType: "PHYSICAL", price: 240, currency: "INR", inStock: true }] : [];
    return Response.json({ success: true, data, pagination: { page: 1, pages: 1, total: Array.isArray(data) ? data.length : 1 } });
  }
  return originalFetch(input, options);
};
