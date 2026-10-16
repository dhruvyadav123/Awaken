import operations from "./operations.json";
const normalize = path => path.replace(/\{\{[^}]+\}\}/g, ":id");
export function operationFor(method, template) { return operations.find(item => item.method === method && normalize(item.path) === normalize(template)); }
