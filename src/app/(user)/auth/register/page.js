import AuthForm from "../../../../components/common/AuthForm";

export const metadata = { title: "Create an Account | AwakenWithMeheck", description: "Create an AwakenWithMeheck account." };

export default function RegisterPage() {
  return <AuthForm mode="signup" />;
}