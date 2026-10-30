export function dataOf(result) {
  return result?.data ?? result?.result?.data ?? result?.result ?? {};
}

export function listOf(value, keys = []) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
}

export function externalUrl(value) {
  const candidate = typeof value === "string" ? value : value?.url || value?.path || value?.href || value?.link || value?.joinUrl || value?.joiningUrl || value?.meetingUrl || value?.recordingUrl || value?.playbackUrl || value?.accessUrl || value?.downloadUrl || value?.paymentUrl || value?.checkoutUrl;
  if (typeof candidate !== "string") return "";
  if (candidate.startsWith("/api/v1/")) {
    const path = candidate.slice(8);
    if (/^(learning\/files\/|digital-library\/files\/|meditation\/files\/|media\/[^/]+\/file(?:\?|$))/.test(path)) return "/api/account/" + path;
    if (/^public\/(media\/[^/]+\/file|courses\/[^/]+\/demo\/file|courses\/[^/]+\/lessons\/[^/]+\/preview\/file)(?:\?|$)/.test(path)) return "/api/public/files/" + path.slice(7);
    return "";
  }
  try {
    const url = new URL(candidate);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

export function titleOf(item, fallback) {
  return item?.title || item?.name || item?.classTitle || item?.courseTitle || item?.quizTitle || item?.titleSnapshot || item?.snapshot?.title || item?.snapshot?.name || fallback;
}

export function lessonsOf(course) {
  return courseSections(course).flatMap((group) => group.lessons);
}

function ordered(items) {
  return items.map((item, index) => ({ item, index })).sort((a, b) => {
    const rank = ({ item, index }) => {
      const value = item.displayOrder ?? item.order ?? item.position ?? index;
      return Number.isFinite(Number(value)) ? Number(value) : index;
    };
    return rank(a) - rank(b) || a.index - b.index;
  }).map(({ item }) => item);
}

export function courseSections(course) {
  const groups = ordered(listOf(course, ["sections", "modules"]).filter(Boolean));
  if (groups.some((group) => listOf(group, ["lessons", "items"]).length)) {
    return groups.map((group, index) => ({
      id: group.id || group.sectionId || `section-${index}`,
      title: group.title || group.name || `Module ${index + 1}`,
      lessons: ordered(listOf(group, ["lessons", "items"]).filter(Boolean)),
    }));
  }
  const sections = new Map();
  for (const lesson of ordered(listOf(course, ["lessons", "items"]).filter(Boolean))) {
    const key = lesson.sectionId || lesson.moduleId || lesson.sectionTitle || lesson.moduleTitle || "course-content";
    if (!sections.has(key)) sections.set(key, { id: key, title: lesson.sectionTitle || lesson.moduleTitle || "Course content", lessons: [] });
    sections.get(key).lessons.push(lesson);
  }
  return [...sections.values()];
}
