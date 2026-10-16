import { Suspense } from "react";
import PasswordRecovery from "@/components/common/PasswordRecovery";
export const metadata = { title: "Password recovery | Awaken With Me" };
export default function ForgotPasswordPage() { return <Suspense fallback={<p>Loading account recovery…</p>}><PasswordRecovery /></Suspense>; }
