
import { accountFetch } from "@/lib/client-account";
import { operationFor } from "@/lib/dashboard/operations";
import { permanentMediaHref } from "@/lib/dashboard/media";

export const pathForCourse = (id) =>
  `facilitator/courses/${encodeURIComponent(id)}`;

export const recordId = (value) => value?.id || value?._id || "";

export const mediaPreviewHref = (value) => {
  const raw = String(value || "").trim();
  const markdown = raw.match(/^\[[^\]]*\]\((https?:\/\/[^)]+)\)$/)?.[1] || raw;
  return permanentMediaHref(markdown);
};

export const unpack = (response) =>
  response?.data?.course || response?.data || null;

export const listOf = (response) => {
  const data = response?.data;
  return Array.isArray(data)
    ? data
    : data?.items ||
        data?.courses ||
        data?.quizzes ||
        data?.students ||
        data?.questions ||
        data?.attempts ||
        data?.registrations ||
        [];
};

export const asDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export const money = (value, currency = "INR") =>
  Number(value || 0) === 0
    ? "Free"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
      }).format(Number(value));

export const titleFromStatus = (status) =>
  String(status || "DRAFT").replaceAll("_", " ");

export const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const CREATE_COURSE =
  "title shortDescription description thumbnail thumbnailMediaId banner bannerMediaId demoVideoSource demoVideoUrl demoVideoMediaId categoryId languageId levelId learningOutcomes regularPrice discountPrice currency certificateEnabled completionPolicy";

const EDIT_COURSE =
  "version title seoDescription shortDescription description thumbnail thumbnailMediaId banner bannerMediaId demoVideoSource demoVideoUrl demoVideoMediaId categoryId languageId levelId regularPrice discountPrice currency requirements learningOutcomes certificateEnabled completionPolicy";

const LESSON =
  "courseVersion title description sectionId contentType duration displayOrder isPreview status videoSource videoUrl videoMediaId audioUrl audioMediaId documentUrl documentMediaId imageUrl imageMediaId textContent liveUrl reason";

const QUIZ =
  "courseVersion version title description scope sectionId lessonId status isRequired passingPercent maxAttempts showCorrectAnswers questions reason";

const accepted = {
  "POST facilitator/courses": CREATE_COURSE,
  "PATCH facilitator/courses/{{courseId}}": EDIT_COURSE,
  "DELETE facilitator/courses/{{courseId}}": "version reason",
  "POST facilitator/courses/{{courseId}}/submit": "version reason",
  "POST facilitator/courses/{{courseId}}/unpublish": "version reason",
  "POST facilitator/courses/{{courseId}}/sections":
    "courseVersion title description",
  "PATCH facilitator/courses/{{courseId}}/sections/{{sectionId}}":
    "courseVersion title description displayOrder status",
  "DELETE facilitator/courses/{{courseId}}/sections/{{sectionId}}":
    "courseVersion reason",
  "PATCH facilitator/courses/{{courseId}}/sections/order":
    "courseVersion ids",
  "POST facilitator/courses/{{courseId}}/lessons": LESSON,
  "PATCH facilitator/courses/{{courseId}}/lessons/{{lessonId}}": LESSON,
  "DELETE facilitator/courses/{{courseId}}/lessons/{{lessonId}}":
    "courseVersion reason",
  "PATCH facilitator/courses/{{courseId}}/sections/{{sectionId}}/lessons/order":
    "courseVersion ids",
  "POST facilitator/courses/{{courseId}}/quizzes": QUIZ,
  "PATCH facilitator/courses/{{courseId}}/quizzes/{{quizId}}": QUIZ,
  "POST facilitator/courses/{{courseId}}/questions/{{questionId}}/replies":
    "version body",
  "PATCH facilitator/classes/{{classId}}/registrations/{{registrationId}}/attendance":
    "registrationVersion status notes reason",
};

function operationFields(method, template) {
  try {
    const registered = operationFor(method, template);
    if (registered?.fields) return registered.fields;
  } catch {
    // Use local endpoint contract if registry entry is missing.
  }

  const keys = accepted[`${method} ${template}`];

  if (!keys) {
    throw new Error(
      `No mutation contract for ${method} ${template}.`
    );
  }

  return Object.fromEntries(
    keys.split(" ").map((key) => [key, true])
  );
}

export async function courseWrite({
  method,
  path,
  template,
  values = {},
  courseId,
  versionPath,
  onConflict,
}) {
  const fields = operationFields(method, template);

  const body = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => key in fields && value !== undefined
    )
  );

  if ("courseVersion" in fields) {
    if (!courseId) {
      throw new Error(
        "Missing course ID for curriculum update."
      );
    }

    const course = unpack(
      await accountFetch(pathForCourse(courseId))
    );

    if (!Number.isInteger(course?.version)) {
      throw new Error(
        "Cannot read the current course version."
      );
    }

    body.courseVersion = course.version;
  }

  if ("version" in fields) {
    const detail = unpack(
      await accountFetch(
        versionPath ||
          (courseId ? pathForCourse(courseId) : path)
      )
    );

    if (!Number.isInteger(detail?.version)) {
      throw new Error(
        "Cannot read the current record version."
      );
    }

    body.version = detail.version;
  }

  if ("registrationVersion" in fields) {
    const detail = unpack(
      await accountFetch(versionPath || path)
    );

    if (!Number.isInteger(detail?.version)) {
      throw new Error(
        "Cannot read the current registration version."
      );
    }

    body.registrationVersion = detail.version;
  }

  if (
    method === "PATCH" &&
    template.endsWith("/quizzes/{{quizId}}") &&
    "version" in fields
  ) {
    const quiz = unpack(
      await accountFetch(versionPath || path)
    );

    body.version = quiz.version;
  }

  try {
    return await accountFetch(path, {
      method,
      body,
    });
  } catch (error) {
    if (error?.status === 409 && error?.code === "COURSE_VERSION_CONFLICT") {
      await onConflict?.();

      throw new Error(
        "The course changed on the server. Latest data refreshed; review and retry."
      );
    }

    throw error;
  }
}

export const schemas = {
  createCourse: "facilitator/courses",
  editCourse: "facilitator/courses/{{courseId}}",
  deleteCourse: "facilitator/courses/{{courseId}}",
  submit: "facilitator/courses/{{courseId}}/submit",
  unpublish: "facilitator/courses/{{courseId}}/unpublish",
  section: "facilitator/courses/{{courseId}}/sections",
  sectionItem:
    "facilitator/courses/{{courseId}}/sections/{{sectionId}}",
  sectionOrder: "facilitator/courses/{{courseId}}/sections/order",
  lesson: "facilitator/courses/{{courseId}}/lessons",
  lessonItem:
    "facilitator/courses/{{courseId}}/lessons/{{lessonId}}",
  lessonOrder:
    "facilitator/courses/{{courseId}}/sections/{{sectionId}}/lessons/order",
  quiz: "facilitator/courses/{{courseId}}/quizzes",
  quizItem:
    "facilitator/courses/{{courseId}}/quizzes/{{quizId}}",
  reply:
    "facilitator/courses/{{courseId}}/questions/{{questionId}}/replies",
  attendance:
    "facilitator/classes/{{classId}}/registrations/{{registrationId}}/attendance",
};
