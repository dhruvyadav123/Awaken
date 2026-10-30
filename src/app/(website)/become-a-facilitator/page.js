import { redirect } from "next/navigation";

export const metadata = { title: "Become a Facilitator | AwakenWithMeheck" };

export default function BecomeFacilitatorPage() {
  redirect("/dashboard/user/application");
}
