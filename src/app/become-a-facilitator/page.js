import { redirect } from "next/navigation";

export const metadata = { title: "Become a Facilitator | Awaken With Me" };

export default function BecomeFacilitatorPage() {
  redirect("/dashboard/user/application");
}
