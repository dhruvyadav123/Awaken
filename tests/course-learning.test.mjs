import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const moduleOf = async (path) => import("data:text/javascript;base64," + Buffer.from(await readFile(new URL(path, import.meta.url), "utf8")).toString("base64"));
const learning = await moduleOf("../src/lib/course-learning.js");
const media = await moduleOf("../src/lib/learning-data.js");
const record = { id: "enrollment-id", courseId: "course-id", title: "Morning Yoga", hasAccess: true, enrollmentStatus: "ACTIVE", progressPercent: 0, completedLessons: 0, totalLessons: 1, completed: false, continueLearningPath: null, certificateEnabled: false };

test("A flat enrollment uses courseId instead of its enrollment id", () => {
  assert.equal(learning.enrolledCourseId(record), "course-id");
  assert.equal(learning.courseLearningHref(record), "/profile/courses/course-id");
  assert.equal(learning.enrolledCourseId({ id: "enrollment-only" }), "");
  assert.equal(learning.enrolledCourseId({ course: { id: "nested-course" }, id: "enrollment" }), "nested-course");
});

test("Resume links map API paths to the correct user page and reject another course", () => {
  const resumed = { ...record, continueLearningPath: "/api/v1/me/courses/course-id/lessons/lesson-id" };
  assert.equal(learning.courseLearningHref(resumed, "/dashboard/user/courses"), "/dashboard/user/courses/course-id/lessons/lesson-id");
  for (const path of ["/api/v1/me/courses/another-course/lessons/lesson-id", "javascript:alert(1)", "https://external.test/lesson"]) {
    assert.equal(learning.courseLearningHref({ ...resumed, continueLearningPath: path }), "/profile/courses/course-id");
  }
  assert.equal(learning.courseLearningHref({ ...resumed, hasAccess: false }), "/profile/courses/course-id");
  assert.equal(learning.courseLearningHref({ ...resumed, completed: true }), "/profile/courses/course-id");
});

test("Zero and completed progress use the supplied percentages and counts", () => {
  assert.deepEqual(learning.courseProgress(record), { percent: 0, completed: 0, total: 1 });
  assert.deepEqual(learning.courseProgress({ progressPercent: 100, completedLessons: 1, totalLessons: 1 }), { percent: 100, completed: 1, total: 1 });
  assert.deepEqual(learning.courseProgress({}), { percent: null, completed: null, total: null });
  assert.equal(learning.completedLesson({ lessons: [{ lessonId: "lesson-id", status: "COMPLETED" }] }, "lesson-id"), true);
  assert.equal(learning.completedLesson({ lessons: [{ lessonId: "other", status: "COMPLETED" }] }, "lesson-id"), false);
});

test("The API access-link path preserves its token through the authenticated streaming route", () => {
  const grant = { path: "/api/v1/learning/files/enrollment-id/lesson-id?token=test-grant", expiresIn: 300 };
  assert.equal(media.externalUrl(grant), "/api/account/learning/files/enrollment-id/lesson-id?token=test-grant");
  assert.equal(media.externalUrl({ path: "/api/v1/admin/users?token=test" }), "");
  assert.equal(media.externalUrl({ path: "javascript:alert(1)" }), "");
});

test("Existing enrollments open without another enrollment request", async () => {
  const calls = [];
  const result = await learning.openEnrolledCourse(async (path, options) => { calls.push([path, options]); return { success: true, data: record }; }, "course-id");
  assert.equal(result.data.courseId, "course-id");
  assert.deepEqual(calls, [["me/courses/course-id", undefined]]);
});

test("Enrollment is requested after a missing enrollment and not after auth or server errors", async () => {
  for (const status of [403, 404]) {
    const calls = [];
    const response = await learning.openEnrolledCourse(async (path, options) => {
      calls.push([path, options]);
      if (!options) { const error = new Error("No enrollment"); error.status = status; throw error; }
      return { success: true, data: record };
    }, "course-id");
    assert.equal(response.data.courseId, "course-id");
    assert.deepEqual(calls[1], ["me/courses/course-id/enroll", { method: "POST", body: {} }]);
  }
  for (const status of [401, 429, 500]) {
    let calls = 0;
    await assert.rejects(learning.openEnrolledCourse(async () => { calls++; const error = new Error("Unavailable"); error.status = status; throw error; }, "course-id"));
    assert.equal(calls, 1);
  }
});

test("Thumbnails accept the supplied URL format and reject executable URLs", () => {
  assert.equal(learning.courseThumbnail("[https://example.com/yoga.jpg](https://example.com/yoga.jpg)"), "https://example.com/yoga.jpg");
  assert.equal(learning.courseThumbnail("javascript:alert(1)"), "");
  assert.equal(learning.courseThumbnail("//external.test/image.jpg"), "");
});
