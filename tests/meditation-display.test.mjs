import assert from "node:assert/strict";
import test from "node:test";
import { meditationCategory, meditationDuration, meditationFormat, meditationRequiresMembership, publicMeditationPlayback } from "../src/lib/meditation-display.js";

test("meditation cards normalize API display fields", () => {
  assert.equal(meditationDuration({ duration: 600 }), "10 min");
  assert.equal(meditationDuration({ durationMinutes: 22 }), "22 min");
  assert.equal(meditationCategory({ catalogs: { category: { name: "Breathwork" } } }), "Breathwork");
  assert.equal(meditationFormat({ contentType: "AUDIO" }), "Audio");
});

test("membership records never expose public playback", () => {
  const meditation = { membershipRequired: true, audioUrl: "https://cdn.example.test/practice.mp3" };
  assert.equal(meditationRequiresMembership(meditation), true);
  assert.equal(publicMeditationPlayback(meditation), null);
});

test("public API media can provide supported audio playback", () => {
  const asset = publicMeditationPlayback({ membershipRequired: false, audioUrl: "https://cdn.example.test/practice.mp3" });
  assert.equal(asset.kind, "AUDIO");
  assert.equal(asset.source, "https://cdn.example.test/practice.mp3");
});
