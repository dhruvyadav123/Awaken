import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/lib/dashboard/form-validation.js", import.meta.url), "utf8");
const { mutationFieldKeys, validateMutationBody } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

test("PATCH payload includes changed fields and required fields, not unchanged optional fields", () => {
  const fields = {
    version: { type: "number", nullable: false },
    displayName: { type: "string", nullable: false },
    shortBio: { type: "string", nullable: true },
    profileImageMediaId: { type: "string", nullable: true },
    coverImageMediaId: { type: "string", nullable: true },
  };
  assert.deepEqual(
    mutationFieldKeys(fields, new Set(["profileImageMediaId"])),
    ["displayName", "profileImageMediaId"]
  );
});

const fields = {
  title: { type: "string", nullable: false },
  startsAt: { type: "string", nullable: false },
  endsAt: { type: "string", nullable: false },
  registrationStartAt: { type: "string", nullable: false },
  registrationEndAt: { type: "string", nullable: false },
  meetingUrl: { type: "string", nullable: false },
};

const valid = {
  title: "Breathing class",
  registrationStartAt: "2026-10-16T09:00:00.000Z",
  registrationEndAt: "2026-10-17T09:00:00.000Z",
  startsAt: "2026-10-18T09:00:00.000Z",
  endsAt: "2026-10-18T10:00:00.000Z",
  meetingUrl: "https://meet.google.com/example",
};

test("Live-class schedules and meeting links accept a valid request", () => {
  assert.equal(validateMutationBody(fields, valid), valid);
});

test("Required values and invalid dates are rejected before a request", () => {
  assert.throws(() => validateMutationBody(fields, { ...valid, title: " " }), /Title is required/);
  assert.throws(() => validateMutationBody(fields, { ...valid, startsAt: "not-a-date" }), /Starts at must be a valid date/);
});

test("Class and registration ranges must move forward", () => {
  assert.throws(() => validateMutationBody(fields, { ...valid, endsAt: valid.startsAt }), /End time must be after/);
  assert.throws(() => validateMutationBody(fields, { ...valid, registrationEndAt: valid.registrationStartAt }), /Registration closing time must be after/);
  assert.throws(() => validateMutationBody(fields, { ...valid, registrationEndAt: valid.endsAt }), /Registration must close before/);
});

test("Meeting links must be safe web URLs", () => {
  assert.throws(() => validateMutationBody(fields, { ...valid, meetingUrl: "javascript:alert(1)" }), /http or https/);
  assert.throws(() => validateMutationBody(fields, { ...valid, meetingUrl: "https://user:secret@example.test/room" }), /http or https/);
});

const classCreateFields = {
  title: { type: "string", nullable: false },
  kind: { type: "string", nullable: false },
  description: { type: "string", nullable: false },
  thumbnailMediaId: { type: "string", nullable: true },
  categoryId: { type: "string", nullable: false },
  startsAt: { type: "string", nullable: false },
  endsAt: { type: "string", nullable: true },
  timezone: { type: "string", nullable: false },
  mode: { type: "string", nullable: false },
  meetingType: { type: "string", nullable: false },
  meetingUrl: { type: "string", nullable: false },
  regularPrice: { type: "number", nullable: false },
  currency: { type: "string", nullable: false },
  capacity: { type: "number", nullable: false },
  reason: { type: "string", nullable: false },
};
const readyClass = {
  title: "Breathing workshop",
  kind: "WORKSHOP",
  description: "A complete guided breathing workshop.",
  thumbnailMediaId: "media_123",
  categoryId: "category_123",
  startsAt: "2026-10-18T09:00:00.000Z",
  endsAt: "2026-10-18T10:00:00.000Z",
  timezone: "Asia/Kolkata",
  mode: "ONLINE",
  meetingType: "GOOGLE_MEET",
  meetingUrl: "https://meet.google.com/example",
  regularPrice: 0,
  currency: "INR",
  capacity: 20,
  reason: "Ready for review",
};

test("Class creation enforces the metadata required by class review", () => {
  assert.equal(validateMutationBody(classCreateFields, readyClass, { skipRequired: true, classCreate: true }), readyClass);
  assert.throws(() => validateMutationBody(classCreateFields, { ...readyClass, description: "" }, { skipRequired: true, classCreate: true }), /Complete description is required/);
  assert.throws(() => validateMutationBody(classCreateFields, { ...readyClass, thumbnailMediaId: "" }, { skipRequired: true, classCreate: true }), /Thumbnail is required/);
  assert.throws(() => validateMutationBody(classCreateFields, { ...readyClass, categoryId: "" }, { skipRequired: true, classCreate: true }), /Category is required/);
  assert.throws(() => validateMutationBody(classCreateFields, { ...readyClass, meetingUrl: "" }, { skipRequired: true, classCreate: true }), /delivery details/);
});
