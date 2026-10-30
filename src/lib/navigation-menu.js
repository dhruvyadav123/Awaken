function cleanHref(value) {
  if (typeof value !== "string") return "";

  const href = value.trim();

  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    /[\u0000-\u001f\\]/.test(href)
  ) {
    return "";
  }

  return href;
}

function uniqueLinks(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item?.href || seen.has(item.href)) {
      return false;
    }

    seen.add(item.href);
    return true;
  });
}

/*
|--------------------------------------------------------------------------
| FACILITATOR PROFILE LINK
|--------------------------------------------------------------------------
| Input:
| {
|   id: "...",
|   name: "Meheck",
|   slug: "meheck"
| }
|
| Output:
| {
|   label: "Meheck",
|   href: "/facilitators/meheck"
| }
|--------------------------------------------------------------------------
*/

export function facilitatorProfileLink(facilitator) {
  if (!facilitator) return null;

  if (typeof facilitator === "string") {
    const slug = facilitator.trim();

    if (!slug) return null;

    return {
      label: slug,
      href: `/facilitators/${encodeURIComponent(slug)}`,
    };
  }

  if (
    typeof facilitator !== "object" ||
    Array.isArray(facilitator)
  ) {
    return null;
  }

  const name = String(
    facilitator.displayName ||
    facilitator.name ||
    facilitator.title ||
    "Facilitator"
  ).trim();

  // The detail page resolves profiles using their slug.
  // Do not substitute MongoDB IDs unless the backend
  // explicitly supports lookup by ID.
  const rawSlug =
    typeof facilitator.slug === "string"
      ? facilitator.slug.trim()
      : "";

  if (!rawSlug) return null;

  return {
    label: name,
    href: `/facilitators/${encodeURIComponent(rawSlug)}`,
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZE CMS MENU
|--------------------------------------------------------------------------
*/

function normalizeMenuItem(item) {
  if (Array.isArray(item)) {
    const [label, href] = item;

    const safeHref = cleanHref(href);

    if (!safeHref) return null;

    return {
      label: String(label || safeHref).trim(),
      href: safeHref,
      children: [],
    };
  }

  if (!item || typeof item !== "object") {
    return null;
  }

  const label = String(
    item.label ||
    item.title ||
    item.name ||
    ""
  ).trim();

  const href = cleanHref(
    item.href ||
    item.url ||
    item.path ||
    ""
  );

  const childSource =
    item.children ||
    item.items ||
    item.links ||
    [];

  const children = Array.isArray(childSource)
    ? childSource
        .map(normalizeMenuItem)
        .filter(Boolean)
    : [];

  if (!label && !href && !children.length) {
    return null;
  }

  return {
    label: label || href,
    href,
    children,
  };
}

/*
|--------------------------------------------------------------------------
| ACTIVE ROUTE
|--------------------------------------------------------------------------
*/

export function isNavigationActive(pathname, href) {
  if (!pathname || !href) return false;

  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

/*
|--------------------------------------------------------------------------
| PREPARE NAVIGATION
|--------------------------------------------------------------------------
| - Unique React keys
| - Duplicate routes removed
| - Home direct link
| - Content dropdown flattened
| - Facilitator links dynamically integrated
|--------------------------------------------------------------------------
*/

export function prepareNavigationItems(
  cmsMenus = [],
  facilitatorLinks = []
) {
  const source = Array.isArray(cmsMenus) ? cmsMenus : [];

  const normalized = source
    .map(normalizeMenuItem)
    .filter(Boolean);

  const result = [];
  const seenRoutes = new Set();
  const seenGroups = new Set();

  function addDirect(item) {
    if (!item?.href) return;

    if (seenRoutes.has(item.href)) return;

    seenRoutes.add(item.href);

    result.push({
      id: `link:${item.href}`,
      label: item.label || item.href,
      href: item.href,
      children: [],
    });
  }

  function addGroup(label, href, children) {
    const valid = uniqueLinks(
      children
        .map(normalizeMenuItem)
        .filter(Boolean)
        .filter((child) => child.href)
        .map((child) => ({
          label: child.label,
          href: child.href,
        }))
    );

    if (!valid.length) {
      addDirect({ label, href });
      return;
    }

    const groupName = label
      .toLowerCase()
      .trim();

    const groupId = `group:${groupName}`;

    if (seenGroups.has(groupId)) {
      const existing = result.find(
        (item) => item.id === groupId
      );

      if (existing) {
        existing.children = uniqueLinks([
          ...existing.children,
          ...valid,
        ]);
      }

      return;
    }

    seenGroups.add(groupId);

    result.push({
      id: groupId,
      label,
      href: href || "",
      children: valid,
    });
  }

  for (const item of normalized) {
    const label = item.label || "";
    const lower = label.toLowerCase();

    // Home never needs a dropdown.
    if (lower === "home" || item.href === "/") {
      addDirect({
        label: "Home",
        href: "/",
      });
      continue;
    }

    // Avoid the unnecessary Content dropdown.
    if (lower === "content") {
      for (const child of item.children) {
        addDirect(child);
      }

      continue;
    }

    const isFacilitator =
      lower.includes("facilitator") ||
      item.href === "/facilitators";

    if (isFacilitator) {
      const dynamicLinks = uniqueLinks(
        (Array.isArray(facilitatorLinks)
          ? facilitatorLinks
          : []
        )
          .map(normalizeMenuItem)
          .filter(Boolean)
          .filter((child) => child.href)
      );

      addGroup(
        "Facilitators",
        "/facilitators",
        [
          ...item.children,
          ...dynamicLinks,
        ]
      );

      continue;
    }

    if (item.children.length) {
      addGroup(
        label,
        item.href,
        item.children
      );

      continue;
    }

    addDirect(item);
  }

  const hasMediaLink = result.some(
    (item) => item.href === "/media" || item.children.some((child) => child.href === "/media")
  );

  if (!hasMediaLink) {
    addDirect({ label: "Media", href: "/media" });
  }

  return result;
}
