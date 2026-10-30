import AccountCenter from "@/components/user/profile/AccountCenter";

export const metadata = {
  title: "Your Profile | AwakenWithMeheck",
  description: "Manage your practice, sessions, and account details.",
};

export default function ProfilePage() {
  return <AccountCenter section="overview" />;
}
