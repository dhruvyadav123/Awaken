import AuthForm from "../../../components/common/AuthForm";

export const metadata = { title: "Sign In | Awaken With Me", description: "Sign in to your Awaken With Me account." };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}