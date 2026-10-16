export function identityOf(result) {
  const value = result?.data ?? result;
  return value?.user ?? value;
}

export function roleOf(user) {
  return typeof user?.role === "string" ? user.role.toUpperCase() : "";
}

export function dashboardHome(user) {
  const role = roleOf(user);
  return role === "FACILITATOR" ? "/dashboard/facilitator" : role === "USER" ? "/dashboard/user" : null;
}

export function canUseDashboard(user, workspace) {
  const role = roleOf(user);
  return workspace === "user" ? role === "USER" || role === "FACILITATOR" : workspace === "facilitator" && role === "FACILITATOR";
}

export function facilitatorAction(user) {
  return roleOf(user) === "FACILITATOR"
    ? { label: "Switch to Facilitator Dashboard", href: "/dashboard/facilitator" }
    : { label: "Become a Facilitator", href: "/dashboard/user/application" };
}

export function endpointContract(contracts, path, method) {
  const parts = path.replace(/^\/+|\/+$/g, "").split("/");
  return contracts.find((entry) => entry.method === method && entry.pattern.split("/").length === parts.length && entry.pattern.split("/").every((part, index) => part === ":id" || part === parts[index]));
}
