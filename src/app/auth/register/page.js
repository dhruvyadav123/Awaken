import AuthForm from "../../../components/common/AuthForm";

export const metadata = { title: "Create an Account | Awaken With Me", description: "Create an Awaken With Me account." };

export default function RegisterPage() {
  return <AuthForm mode="signup" />;
}