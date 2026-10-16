"use client";
import Link from "next/link";
import { useWorkspace, Icon } from "./WorkspaceShell";
import { facilitatorAction } from "@/lib/dashboard/identity";
export default function FacilitatorAccess() {
  const { user } = useWorkspace(); const action = facilitatorAction(user);
  return <Link className="ws-secondary" href={action.href}>{action.label} <Icon name="arrow" size={16} /></Link>;
}
