import { notFound, redirect } from "next/navigation";
import CommerceCenter from "@/components/commerce/CommerceCenter";
import MyMembership from "@/components/membership/MyMembership";
import ProfileDetails from "@/components/account/ProfileDetails";
import EmailVerification from "@/components/common/EmailVerification";
import ContentPage from "../../components/common/ContentPage";
import CmsPublicPage from "@/components/common/CmsPublicPage";
import { publicApi } from "@/lib/public-api";

const supportLinks = [
  { label: "Contact Awaken With Me", description: "Ask about the service or a next step.", href: "/contact" },
];

export default async function MissingRoutePage({ params, searchParams }) {
  const { segments } = await params;
  const route = segments.join("/");
  const query = await searchParams;

  if (route === "cart/empty") redirect("/cart");
  if (route === "auth/verify-email") {
    return <EmailVerification token={typeof query?.token === "string" ? query.token : ""} />;
  }
  if (route === "dashboard/sessions/book") redirect("/sessions");
  if (["checkout/success", "checkout/failed"].includes(route)) {
    return <CommerceCenter section="orders" id={typeof query?.orderId === "string" ? query.orderId : undefined} />;
  }
  if (route === "infinity/checkout") {
    return <MyMembership planId={typeof query?.planId === "string" ? query.planId : ""} />;
  }
  if (route === "profile/edit") return <ProfileDetails />;
  if (route === "profile/settings") redirect("/dashboard/user/settings");
  if (["become-a-facilitator/apply", "become-a-facilitator/status"].includes(route)) {
    redirect("/dashboard/user/application");
  }
  if (route === "dashboard/wishlist") redirect("/dashboard/user/explore");

  const legacyDashboardSections = {
    orders: "orders",
    bookings: "bookings",
    sessions: "bookings",
    workshops: "workshops",
    classes: "workshops",
    reviews: "reviews",
  };
  const legacySection = segments[0] === "dashboard" ? legacyDashboardSections[segments[1]] : undefined;
  if (legacySection) {
    redirect(`/dashboard/user/${legacySection}${segments[2] ? `/${encodeURIComponent(segments[2])}` : ""}`);
  }

  const cmsResult = await publicApi(`pages/${encodeURIComponent(route)}`);
  if (cmsResult.error && cmsResult.status !== 404) {
    return <ContentPage
      title="Page temporarily unavailable"
      description={cmsResult.error}
      sections={[{
        heading: "Continue from here",
        links: [
          { label: "Try again", description: "Reload this page.", href: `/${segments.map(encodeURIComponent).join("/")}` },
          ...supportLinks,
        ],
      }]}
    />;
  }
  if (!cmsResult.data) notFound();
  return <CmsPublicPage record={cmsResult.data} />;
}
