import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unsupported wishlist UI and legacy sample dashboard are not shipped", async () => {
  const navigation = await read("src/lib/dashboard/navigation.js");
  const dashboardPage = await read("src/components/dashboard/DashboardPage.jsx");
  const catchAll = await read("src/app/[...segments]/page.js");

  assert.doesNotMatch(navigation, /["']wishlist["']/i);
  assert.doesNotMatch(dashboardPage, /Wishlist is not available/i);
  assert.match(catchAll, /dashboard\/wishlist["']\) redirect\(["']\/dashboard\/user\/explore/);
  await assert.rejects(access(new URL("../src/components/common/UserDashboard.jsx", import.meta.url)));
});

test("dashboard fallbacks do not invent progress, schedule, or catalogue metadata", async () => {
  const progress = await read("src/components/dashboard/UserResources.jsx");
  const snapshot = await read("src/components/account/DashboardSnapshot.jsx");
  const catalogue = await read("src/components/common/CatalogGrid.jsx");

  assert.doesNotMatch(progress, /completedLessons \?\? ["']\?["']/);
  assert.doesNotMatch(snapshot, /: ["']Scheduled["']/);
  assert.doesNotMatch(snapshot, /: ["']Soon["']/);
  assert.doesNotMatch(catalogue, /item\.kind \|\| ["']Awaken["']/);
});

test("email verification uses the real backend contract", async () => {
  const route = await read("src/app/api/auth/recovery/route.js");
  const screen = await read("src/components/common/EmailVerification.jsx");

  assert.match(route, /auth\/verify-email/);
  assert.match(route, /auth\/resend-verification/);
  assert.match(route, /token: body\.token\.trim\(\)/);
  assert.match(screen, /action: ["']verify["']/);
  assert.match(screen, /disabled=\{busy \|\| !token\}/);
});

test("homepage no longer renders broken placeholder glyphs", async () => {
  const home = await read("src/app/page.js");
  const auth = await read("src/components/common/AuthForm.jsx");

  assert.doesNotMatch(home, /�/);
  assert.doesNotMatch(auth, /â|�/);
  assert.doesNotMatch(home, />\?<\/span>|<i>\?<\/i>/);
});
