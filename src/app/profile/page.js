import AccountCenter from "@/components/account/AccountCenter";

export const metadata = {
  title: "Your Profile | Awaken With Me",
  description: "Manage your practice, sessions, and account details.",
};

export default function ProfilePage() {
  return <AccountCenter section="overview" />;
}
