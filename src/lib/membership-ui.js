const unavailableStatuses = new Set([
  "DRAFT",
  "INACTIVE",
  "ARCHIVED",
  "DELETED",
  "DISABLED",
  "SUSPENDED",
]);

export function plansFrom(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  for (const key of ["plans", "membershipPlans", "items", "results"]) {
    if (Array.isArray(value[key])) return value[key];
  }

  return [];
}

export function availablePlan(plan) {
  if (!plan || typeof plan !== "object") return false;
  if (plan.archivedAt || plan.isActive === false || plan.isPublished === false) return false;

  return !unavailableStatuses.has(String(plan.status || "").toUpperCase());
}

function amountOf(value) {
  const raw = value?.discountPrice ?? value?.regularPrice ?? value?.price ?? value?.amount;
  if (raw === null || raw === undefined || raw === "" || !Number.isFinite(Number(raw))) return null;
  return Number(raw);
}

export function planAmount(plan) {
  return amountOf(plan);
}

export function planRequiresPayment(plan) {
  const amount = amountOf(plan);
  return amount === null || amount > 0;
}

export function money(value, currency = "INR") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: /^[A-Z]{3}$/.test(String(currency)) ? currency : "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

export function planPrice(plan) {
  const amount = amountOf(plan);
  const current = amount === null ? "" : amount === 0 ? "Free" : money(amount, plan?.currency);
  const regular = Number(plan?.regularPrice);
  const discounted = plan?.discountPrice != null && Number.isFinite(regular) && regular > amount;

  return {
    current,
    original: discounted ? money(regular, plan?.currency) : "",
  };
}

export function planPeriod(plan) {
  const billing = String(plan?.billingType || plan?.billingPeriod || "").toUpperCase();
  const labels = {
    MONTHLY: "/ month",
    MONTH: "/ month",
    YEARLY: "/ year",
    ANNUAL: "/ year",
    WEEKLY: "/ week",
    WEEK: "/ week",
    DAILY: "/ day",
    ONE_TIME: "one-time",
  };

  return labels[billing] || (Number(plan?.durationDays) > 0 ? `/ ${plan.durationDays} days` : "");
}

export function planBenefits(plan) {
  const benefits = Array.isArray(plan?.benefits)
    ? plan.benefits
        .map((benefit) => typeof benefit === "string" ? benefit : benefit?.title || benefit?.name || benefit?.text || benefit?.description || "")
        .filter((benefit) => typeof benefit === "string" && benefit.trim())
        .map((benefit) => benefit.trim())
    : [];

  if (plan?.premiumMeditationAccess === true) benefits.push("Premium meditation access");

  for (const [field, title] of [
    ["courseDiscountPercent", "courses"],
    ["classDiscountPercent", "classes"],
    ["sessionDiscountPercent", "sessions"],
    ["productDiscountPercent", "products"],
  ]) {
    const percent = Number(plan?.[field]);
    if (Number.isFinite(percent) && percent > 0) benefits.push(`${percent}% off ${title}`);
  }

  return [...new Set(benefits)].slice(0, 8);
}

export function readableStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}
