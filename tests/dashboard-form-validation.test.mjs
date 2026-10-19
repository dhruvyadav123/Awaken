import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/lib/dashboard/form-validation.js", import.meta.url), "utf8");
const { validateMutationBody } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

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
