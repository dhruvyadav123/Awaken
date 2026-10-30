import AuthForm from "../../../../components/common/AuthForm";

export const metadata = { title: "Sign In | AwakenWithMeheck", description: "Sign in to your AwakenWithMeheck account." };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}