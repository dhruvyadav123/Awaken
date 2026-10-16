import { Suspense } from "react";
import PasswordRecovery from "@/components/common/PasswordRecovery";
export const metadata = { title: "Reset password | Awaken With Me" };
export default function ResetPasswordPage() { return <Suspense fallback={<p>Loading account recovery…</p>}><PasswordRecovery reset /></Suspense>; }
