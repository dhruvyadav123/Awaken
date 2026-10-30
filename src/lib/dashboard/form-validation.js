const versionFields = new Set(["version", "courseVersion", "registrationVersion"]);
const fieldLabels = { startsAt: "Starts at", endsAt: "Ends at", registrationStartAt: "Registration starts", registrationEndAt: "Registration ends", meetingUrl: "Meeting link" };

export function mutationFieldKeys(fields, changedKeys) {
  return Object.keys(fields).filter(
    key => changedKeys.has(key) || (!fields[key].nullable && !versionFields.has(key))
  );
}

function titleOf(key) {
  return fieldLabels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

function requiredValue(schema, value, key, skipRequired) {
  if (skipRequired) return;
  if (schema.nullable || versionFields.has(key)) return;
  if (value === undefined || value === null || (typeof value === "string" && !value.trim()) || (schema.type === "array" && !value.length)) {
    throw new Error(`${titleOf(key)} is required.`);
  }
}

function validateFields(fields, value = {}, skipRequired = false) {
  for (const [key, schema] of Object.entries(fields)) {
    const current = value?.[key];
    requiredValue(schema, current, key, skipRequired);
    if (current === undefined || current === null || current === "") continue;
    if (schema.type === "object") validateFields(schema.fields, current, skipRequired);
    if (schema.type === "array" && schema.item?.type === "object") current.forEach((item) => validateFields(schema.item.fields, item, skipRequired));
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

function validateClassCreate(body) {
  const required = [
    ["title", "Title"],
    ["description", "Complete description"],
    ["categoryId", "Category"],
    ["startsAt", "Starts at"],
    ["endsAt", "Ends at"],
    ["timezone", "Timezone"],
    ["mode", "Delivery mode"],
    ["currency", "Currency"],
    ["capacity", "Capacity"],
    ["reason", "Reason for this change"],
  ];
  for (const [key, label] of required) {
    if (body[key] === undefined || body[key] === null || (typeof body[key] === "string" && !body[key].trim())) throw new Error(`${label} is required before creating a class.`);
  }
  if (!body.thumbnailMediaId && !body.thumbnail) throw new Error("Thumbnail is required before submitting a class for review.");
  if (body.mode !== "OFFLINE" && (!body.meetingType || !body.meetingUrl)) throw new Error("Complete the delivery details, including the meeting type and link.");
  const hasClassSchedule = body.startsAt || body.endsAt;
  const hasRegistrationWindow = body.registrationStartAt || body.registrationEndAt;
  if (hasClassSchedule && (!body.startsAt || !body.endsAt)) throw new Error("Enter both class start and end date/time values, or leave the class schedule blank.");
  if (hasRegistrationWindow && (!body.registrationStartAt || !body.registrationEndAt)) throw new Error("Enter both registration start and end date/time values, or leave both blank.");
  if (body.mode === "ONLINE" && body.meetingType === "GOOGLE_MEET" && !body.meetingUrl) throw new Error("Google Meet select karne par meeting URL required hai.");
}

export function validateMutationBody(fields, body, options = {}) {
  validateFields(fields, body, options.skipRequired === true);
  if (options.classCreate) validateClassCreate(body);
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
