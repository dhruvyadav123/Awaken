import { Suspense } from "react";
import PasswordRecovery from "@/components/common/PasswordRecovery";
export const metadata = { title: "Password recovery | AwakenWithMeheck" };
export default function ForgotPasswordPage() { return <Suspense fallback={<p>Loading account recovery…</p>}><PasswordRecovery /></Suspense>; }
