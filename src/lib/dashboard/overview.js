export const FACILITATOR_DASHBOARD_PATH = "facilitator/dashboard?limit=5";
export function facilitatorOverview(data) {
  const source = data?.dashboard && typeof data.dashboard === "object"
    ? data.dashboard
    : data?.summary
      ? data
      : data?.data && typeof data.data === "object"
        ? data.data
        : data || {};
  const summary = source?.summary || {};
  const count = value => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  return {
    asOf: typeof source?.asOf === "string" ? source.asOf : null,
    metrics: [
      ["Total courses", count(summary.totalCourses), "book"],
      ["Pending courses", count(summary.pendingCourses), "book"],
      ["Total classes & workshops", count(summary.totalClasses), "calendar"],
      ["Upcoming classes & workshops", count(summary.upcomingClasses), "calendar"],
      ["Total students", count(summary.totalStudents), "users"],
      ["Course enrollments", count(summary.courseEnrollments), "users"],
      ["Session bookings", count(summary.sessionBookings), "calendar"],
      ["Product sales", count(summary.productSales?.sales), "bag"],
      ["Product units sold", count(summary.productSales?.units), "bag"],
    ],
    finances: Array.isArray(source?.financesByCurrency) ? source.financesByCurrency : [],
    sales: Array.isArray(source?.recentSales) ? source.recentSales : [],
    questions: Array.isArray(source?.recentQuestions) ? source.recentQuestions : [],
  };
}

// Populated item schemas were not supplied: display returned scalar fields,
// including nested values, without inventing amount totals or date series.
export function overviewFields(record, prefix = "", depth = 0) {
  if (!record || typeof record !== "object" || depth > 3) return [];
  return Object.entries(record).flatMap(([key, value]) => {
    if (value == null || /^(id|_id|version|currency)$/.test(key) || /Id$/.test(key) || /token|password|secret/i.test(key)) return [];
    const name = prefix ? `${prefix} · ${key}` : key;
    if (typeof value === "object") return Array.isArray(value) ? [] : overviewFields(value, name, depth + 1);
    return [ { key: name, label: name.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " "), value } ];
  });
}
