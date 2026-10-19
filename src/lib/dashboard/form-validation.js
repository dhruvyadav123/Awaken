const versionFields = new Set(["version", "courseVersion", "registrationVersion"]);
const fieldLabels = { startsAt: "Starts at", endsAt: "Ends at", registrationStartAt: "Registration opens", registrationEndAt: "Registration closes", meetingUrl: "Meeting link" };

function titleOf(key) {
  return fieldLabels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

function requiredValue(schema, value, key) {
  if (schema.nullable || versionFields.has(key)) return;
  if (value === undefined || value === null || (typeof value === "string" && !value.trim()) || (schema.type === "array" && !value.length)) {
    throw new Error(`${titleOf(key)} is required.`);
  }
}

function validateFields(fields, value = {}) {
  for (const [key, schema] of Object.entries(fields)) {
    const current = value?.[key];
    requiredValue(schema, current, key);
    if (current === undefined || current === null || current === "") continue;
    if (schema.type === "object") validateFields(schema.fields, current);
    if (schema.type === "array" && schema.item?.type === "object") current.forEach((item) => validateFields(schema.item.fields, item));
    if (schema.type === "number" && !Number.isFinite(current)) throw new Error(`${titleOf(key)} must be a number.`);
    if (/At$/.test(key) && !Number.isFinite(Date.parse(current))) throw new Error(`${titleOf(key)} must be a valid date and time.`);
  }
}

function time(value) {
  return value == null || value === "" ? null : Date.parse(value);
}

function validateOrder(body, startKey, endKey, message) {
  const start = time(body[startKey]);
  const end = time(body[endKey]);
  if (start != null && end != null && end <= start) throw new Error(message);
}

function validateWebUrl(value, label) {
  if (!value) return;
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${label} must be a valid web address.`); }
  if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error(`${label} must use a valid http or https address.`);
}

export function validateMutationBody(fields, body) {
  validateFields(fields, body);
  validateOrder(body, "startsAt", "endsAt", "End time must be after the start time.");
  validateOrder(body, "registrationStartAt", "registrationEndAt", "Registration closing time must be after its opening time.");

  const registrationEnd = time(body.registrationEndAt);
  const classStart = time(body.startsAt);
  if (registrationEnd != null && classStart != null && registrationEnd > classStart) {
    throw new Error("Registration must close before the class starts.");
  }

  validateWebUrl(body.meetingUrl, fieldLabels.meetingUrl);
  return body;
}
