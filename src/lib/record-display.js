
const imageFields = [
  "thumbnail",
  "thumbnailUrl",
  "image",
  "imageUrl",
  "featuredImage",
  "featuredImageUrl",
  "photo",
  "avatar",
  "avatarUrl",
  "coverImage",
  "coverImageUrl",
  "poster",
  "logo",
  "thumbnailMediaId",
  "imageMediaId",
  "featuredImageMediaId",
  "photoMediaId",
  "avatarMediaId",
  "coverMediaId",
  "logoMediaId",
];

const mediaFields = {
  IMAGE: imageFields,
  VIDEO: [
    "video",
    "videoUrl",
    "videoMediaId",
    "recordingUrl",
    "recordingMediaId",
    "demoVideoUrl",
    "introductionVideoUrl",
  ],
  AUDIO: ["audio", "audioUrl", "audioMediaId"],
  DOCUMENT: ["documentUrl", "documentMediaId"],
};

const collectionFields = [
  "images",
  "imageMediaIds",
  "media",
  "attachments",
  "documents",
  "files",
];

const referenceFields = [
  "mediaId",
  "fileMediaId",
  "contentMediaId",
  "fileUrl",
];

const mediaKeys = new Set([
  ...Object.values(mediaFields).flat(),
  ...collectionFields,
  ...referenceFields,
]);

const secretKey =
  /password|secret|token|authorization|csrf|cookie|storageKey|providerKey|objectKey|bucket|internalPath/i;

// Generic detail panels contain customer-facing facts, never raw API metadata.
const internalKey = /^(?:_.*|id|.*Ids?|version|.*Version|slug|.*Slug|createdBy|updatedBy|deletedAt|metadata|pagination|permissions|capabilities|bankDetails|personalDetails|fileAccessPath|publicPath|mimeType|sizeBytes|checksum|etag)$/;
const publicDetailKeys = new Set([
  "title", "name", "description", "shortDescription", "excerpt", "content", "body", "text",
  "regularPrice", "discountPrice", "price", "amount", "currency", "duration", "durationDays", "durationMinutes",
  "startsAt", "endsAt", "startDate", "endDate", "timezone", "mode", "location", "venue", "address",
  "language", "languageName", "languages", "level", "levelName", "category", "categoryName",
  "instructorName", "facilitatorName", "authorName", "learningOutcomes", "requirements", "prerequisites",
  "features", "benefits", "included", "format", "pages", "capacity", "availableSeats", "publishedAt",
  "registrationStartAt", "registrationEndAt", "cancellationPolicy", "refundPolicy", "accessDays",
]);

const mediaIdPattern = /^[a-f\d]{24}$/i;

export function displayLabel(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

export function mediaKind(value, fallback = "DOCUMENT") {
  const type = String(
    value?.kind || value?.contentType || ""
  ).toUpperCase();

  if (
    ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"].includes(type)
  ) {
    return type;
  }

  const mime = String(value?.mimeType || "").toLowerCase();

  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";

  return fallback;
}

function getMediaIdFromPath(value) {
  if (typeof value !== "string") return "";

  try {
    const url = new URL(value, "https://local.invalid");

    const match = url.pathname.match(
      /\/media\/([a-f\d]{24})\/file\/?$/i
    );

    return match?.[1] || "";
  } catch {
    return "";
  }
}

export function displayMediaUrl(value, scope = "public") {
  if (
    typeof value !== "string" ||
    !value ||
    /[\\\u0000-\u0020]/.test(value) ||
    value.startsWith("//")
  ) {
    return "";
  }

  try {
    const url = new URL(
      value,
      "https://local.invalid"
    );

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return "";
    }

    const absolute = /^https?:\/\//i.test(value);

    if (!absolute && !value.startsWith("/")) {
      return "";
    }

    const pathname = url.pathname;

    // Public media API -> Next.js public media proxy
    const publicMatch = pathname.match(
      /^\/(?:api\/v1\/)?public\/(media\/[^/]+\/file|courses\/[^/]+\/demo\/file|courses\/lessons\/[^/]+\/preview\/file)\/?$/
    );

    if (publicMatch) {
      return `/api/public/files/${publicMatch[1]}`;
    }

    // Already using the Next.js public proxy
    if (pathname.startsWith("/api/public/files/")) {
      return pathname;
    }

    const privatePath =
      /^\/(?:api\/v1\/)?(?:media\/[^/]+\/file|learning\/files\/|digital-library\/files\/|meditation\/files\/)/.test(
        pathname
      ) || pathname.startsWith("/api/account/");

    if (privatePath) {
      if (scope === "public") return "";

      if (pathname.startsWith("/api/account/")) {
        return pathname + url.search;
      }

      return (
        "/api/account/" +
        pathname.replace(/^\/(?:api\/v1\/)?/, "") +
        url.search
      );
    }

    if (
      scope === "public" &&
      [...url.searchParams.keys()].some((key) =>
        /token|signature|authorization|expires|x-amz-|x-goog-/i.test(
          key
        )
      )
    ) {
      return "";
    }

    return value;
  } catch {
    return "";
  }
}

export function recordMedia(
  record,
  { scope = "public", imagesOnly = false } = {}
) {
  if (!record || typeof record !== "object") {
    return [];
  }

  const assets = new Map();

  function add(value, fallback, field, isReference = false) {
    if (Array.isArray(value)) {
      value.forEach((item) =>
        add(item, fallback, field, isReference)
      );
      return;
    }

    if (!value) return;

    const object =
      typeof value === "object" ? value : null;

    if (object?.status && object.status !== "ACTIVE") {
      return;
    }

    if (
      scope === "public" &&
      object?.visibility === "PRIVATE"
    ) {
      return;
    }

    const kind = mediaKind(object, fallback);

    if (imagesOnly && kind !== "IMAGE") {
      return;
    }

    const candidate =
      typeof value === "string"
        ? value
        : object?.publicPath ||
          object?.url ||
          object?.src ||
          object?.fileUrl ||
          "";

    const pathId = getMediaIdFromPath(candidate);

    const objectId =
      object?.mimeType && object?.kind
        ? object.id || object._id
        : "";

    const id =
      object?.mediaId ||
      objectId ||
      pathId ||
      (typeof value === "string" &&
      mediaIdPattern.test(value) &&
      (isReference || !candidate.startsWith("/"))
        ? value
        : "");

    let source = displayMediaUrl(candidate, scope);

    // A media reference can use its public proxy.
    if (!source && id && scope === "public") {
      source =
        `/api/public/files/media/${encodeURIComponent(id)}/file`;
    }

    const privateFile =
      typeof candidate === "string" &&
      /\/(?:api\/v1\/)?media\/[^/?]+\/file(?:\?|$)/.test(
        candidate
      ) &&
      !/\/public\//.test(candidate);

    if (scope === "public" && privateFile) {
      return;
    }

    const protectedAsset = Boolean(
      scope === "facilitator" &&
        (object?.visibility === "PRIVATE" ||
          privateFile ||
          (id && !source))
    );

    if (!source && !id) return;

    const asset = {
      id: id ? String(id) : "",
      source: protectedAsset ? "" : source,
      kind,
      protected: protectedAsset,
      title:
        object?.title ||
        object?.originalName ||
        displayLabel(field),
      alt:
        object?.altText ||
        record.imageAlt ||
        record.altText ||
        record.title ||
        record.name ||
        record.displayName ||
        "Resource image",
    };

    const key = asset.id
      ? `id:${asset.id}`
      : `url:${asset.source}`;

    const previous = assets.get(key);

    // Keep the richer record when duplicate fields reference
    // the same media item.
    if (!previous || (!previous.source && asset.source)) {
      assets.set(key, {
        ...asset,
        key,
      });
    }
  }

  if (record.mimeType && record.id && record.kind) {
    add(record, mediaKind(record), "media", true);
  }

  for (const [kind, fields] of Object.entries(mediaFields)) {
    for (const field of fields) {
      add(
        record[field],
        kind,
        field,
        /MediaId$/.test(field)
      );
    }
  }

  for (const field of collectionFields) {
    add(
      record[field],
      field.startsWith("image")
        ? "IMAGE"
        : mediaKind(record),
      field,
      field === "imageMediaIds"
    );
  }

  for (const field of referenceFields) {
    add(
      record[field],
      mediaKind(record),
      field,
      field !== "fileUrl"
    );
  }

  return [...assets.values()];
}

export function recordFields(
  record,
  {
    exclude = [],
    publicView = false,
  } = {}
) {
  const blocked = new Set(exclude);
  const output = [];

  function visit(value, path, depth) {
    if (
      value == null ||
      value === "" ||
      depth > 8
    ) {
      return;
    }

    if (
      typeof value === "string" &&
      /[?&](?:token|access_token|signature|x-amz-signature|x-goog-signature)=/i.test(
        value
      )
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((child, index) => {
        visit(
          child,
          [...path, String(index + 1)],
          depth + 1
        );
      });
      return;
    }

    if (typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (
          secretKey.test(key) ||
          internalKey.test(key) ||
          mediaKeys.has(key) ||
          blocked.has(key)
        ) {
          continue;
        }

        if (publicView && depth === 0 && !publicDetailKeys.has(key)) continue;

        if (
          publicView &&
          /^(?:id|_id|ownerId|version|facilitatorId|createdBy|updatedBy|email|phone|bankDetails|personalDetails|meetingUrl|fileAccessPath)$/i.test(
            key
          )
        ) {
          continue;
        }

        visit(
          child,
          [...path, key],
          depth + 1
        );
      }
      return;
    }

    if (
      ["string", "number", "boolean"].includes(
        typeof value
      ) &&
      path.length
    ) {
      output.push({
        key: path.join("."),
        label: path.map(displayLabel).join(" · "),
        value,
      });
    }
  }

  visit(record, [], 0);

  return output;
}
