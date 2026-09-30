import { notFound } from "next/navigation";
import ContentPage from "../../components/common/ContentPage";

const supportLinks = [{ label: "Contact Awaken With Me", description: "Ask about the service or a next step.", href: "/contact" }];

function routePage(eyebrow, title, description, links = supportLinks, notice) {
  return {
    eyebrow,
    title,
    description,
    notice,
    sections: [{ heading: "Continue from here", links }],
  };
}

const routePages = {
  "auth/forgot-password": routePage("Account access", "Reset your password.", "Password recovery is not connected yet. No account details are collected on this page.", [{ label: "Sign in", description: "Return to account access.", href: "/auth/login" }, { label: "Create an account", description: "Set up an account when registration is available.", href: "/auth/register" }], "Password recovery will be available after secure account services are configured."),
  "auth/reset-password": routePage("Account access", "Choose a new password.", "A secure reset link is required to change an account password.", [{ label: "Request a reset link", description: "Start from account recovery.", href: "/auth/forgot-password" }, { label: "Sign in", description: "Return to account access.", href: "/auth/login" }], "Password changes are not available until account services are connected."),
  "auth/verify-email": routePage("Account access", "Verify your email.", "Email verification depends on the account service used to create your account.", [{ label: "Sign in", description: "Continue to your account.", href: "/auth/login" }, { label: "Contact support", description: "Get help with account access.", href: "/contact" }], "Email verification is not connected yet."),
  "become-a-facilitator/apply": routePage("Facilitator community", "Share your practice with us.", "Applications are not being collected here yet. Read about the community and contact us to ask about future opportunities.", [{ label: "Become a facilitator", description: "Review the program information.", href: "/become-a-facilitator" }, { label: "Contact", description: "Ask about facilitator opportunities.", href: "/contact" }], "An application form will be added when the review process and privacy details are confirmed."),
  "become-a-facilitator/status": routePage("Facilitator community", "Application status.", "Application status is not connected to an account or submission system yet.", [{ label: "Sign in", description: "Account access is not available yet.", href: "/auth/login" }, { label: "Contact", description: "Ask about an existing application.", href: "/contact" }]),
  "cart/empty": routePage("Your cart", "There is nothing here yet.", "When items are available, your selected resources will appear in your cart.", [{ label: "Explore the shop", description: "Browse the current collection.", href: "/shop" }, { label: "Browse classes", description: "Explore guided learning.", href: "/classes" }]),
  checkout: routePage("Checkout", "Checkout is not available yet.", "Secure payment processing and order details have not been connected, so purchases cannot be completed here.", [{ label: "Review your cart", description: "Return to your selected items.", href: "/cart" }, { label: "Explore the shop", description: "Browse available resources.", href: "/shop" }], "No payment information is requested or stored on this page."),
  "checkout/failed": routePage("Checkout", "Payment status unavailable.", "This site is not connected to a payment provider, so it cannot confirm a failed transaction.", [{ label: "View your cart", description: "Review items before checkout is available.", href: "/cart" }, { label: "Contact", description: "Ask about an existing payment.", href: "/contact" }]),
  "checkout/success": routePage("Checkout", "Order confirmation unavailable.", "This site is not connected to a payment provider, so it cannot confirm an order.", [{ label: "Explore the shop", description: "Return to the resource collection.", href: "/shop" }, { label: "Contact", description: "Ask about an existing order.", href: "/contact" }]),
  dashboard: routePage("Your space", "Your practice space.", "Bookings, learning progress, and account settings will appear here when secure accounts are connected.", [{ label: "Sign in", description: "Account access is not available yet.", href: "/auth/login" }, { label: "Explore classes", description: "Browse guided learning.", href: "/classes" }], "Dashboard data is not available on this site yet."),
  "dashboard/bookings": routePage("Your space", "Your bookings.", "Booking history is not connected to an account service yet."),
  "dashboard/reviews": routePage("Your space", "Your reviews.", "Reviews are not connected to an account service yet.", [{ label: "Browse stories", description: "Read community stories.", href: "/testimonials" }, ...supportLinks]),
  "dashboard/sessions/book": routePage("Your space", "Book a session.", "Session availability, facilitator schedules, and booking are not connected yet.", [{ label: "Meet facilitators", description: "Explore the people behind the practice.", href: "/facilitators" }, { label: "Browse workshops", description: "Explore group sessions.", href: "/workshops" }], "No dates or availability have been supplied."),
  "dashboard/sessions": routePage("Your space", "Your sessions.", "Session details will appear here when bookings and secure accounts are connected."),
  "dashboard/settings": routePage("Your space", "Account settings.", "Account preferences are not available until secure account services are configured."),
  "dashboard/wishlist": routePage("Your space", "Your saved items.", "Saved items are not connected to an account service yet.", [{ label: "Explore the shop", description: "Browse wellbeing resources.", href: "/shop" }, { label: "Browse classes", description: "Find guided learning.", href: "/classes" }]),
  "profile/edit": routePage("Your profile", "Edit your profile.", "Profile editing is not available until secure account services are configured.", [{ label: "Your space", description: "Return to your profile overview.", href: "/profile" }, { label: "Sign in", description: "Account access is not available yet.", href: "/auth/login" }]),
  "profile/notifications": routePage("Your profile", "Notification preferences.", "Notification settings are not available until account services are configured.", [{ label: "Your space", description: "Return to your profile overview.", href: "/profile" }, ...supportLinks]),
  "profile/settings": routePage("Your profile", "Account settings.", "Account settings are not available until secure account services are configured.", [{ label: "Your space", description: "Return to your profile overview.", href: "/profile" }, ...supportLinks]),
  "infinity/about": routePage("Infinity", "A closer look at the community.", "Learn about the intention behind Infinity and explore whether ongoing shared practice is right for you.", [{ label: "Infinity overview", description: "Return to the community introduction.", href: "/infinity" }, { label: "Membership", description: "Review the current membership information.", href: "/infinity/membership" }]),
  "infinity/checkout": routePage("Infinity membership", "Membership checkout is not available.", "Membership terms and secure payment processing have not been configured.", [{ label: "Membership information", description: "Review the available details.", href: "/infinity/membership" }, { label: "Contact", description: "Ask about membership.", href: "/contact" }], "No membership payment can be taken here."),
};

const detailPages = {
  blog: ["Journal", "This journal entry is not available yet.", "Published articles have not been added to the journal."],
  classes: ["Classes", "Class details are not available yet.", "Class descriptions, schedules, and enrollment details have not been supplied."],
  facilitators: ["Facilitators", "This facilitator profile is not available yet.", "Facilitator biographies and current session details have not been supplied."],
  shop: ["Shop", "Product details are not available yet.", "Product descriptions, prices, and delivery details have not been supplied."],
  testimonials: ["Community stories", "This story is not available yet.", "Stories will be published when they are available and approved for sharing."],
  workshops: ["Workshops", "Event details are not available yet.", "Workshop dates, locations, and booking details have not been supplied."],
};

function getPage(segments) {
  const path = segments.join("/");
  if (routePages[path]) return routePages[path];

  if (segments[0] === "dashboard") {
    if (segments.length === 3 && segments[1] === "orders") return routePage("Your space", "Order details.", "Order history is not connected to an account service yet.");
    if (segments.length === 3 && segments[1] === "bookings") return routePage("Your space", "Booking details.", "Booking history is not connected to an account service yet.");
    if (segments.length === 3 && segments[1] === "sessions") return routePage("Your space", "Session details.", "Session bookings are not connected to an account service yet.");
    if (segments.length === 3 && segments[1] === "workshops") return routePage("Your space", "Workshop booking details.", "Workshop bookings are not connected to an account service yet.");
    if (segments.length === 4 && segments[1] === "classes" && segments[3] === "learn") return routePage("Your space", "Class learning space.", "Class lessons and progress are not available until course content and accounts are connected.", [{ label: "Browse classes", description: "Return to the class directory.", href: "/classes" }, { label: "Sign in", description: "Account access is not available yet.", href: "/auth/login" }]);
  }

  if (segments[0] === "infinity" && segments[1] === "programs" && segments.length === 3) {
    return routePage("Infinity programs", "Program details are not available yet.", "Program descriptions, schedules, and enrollment details have not been supplied.", [{ label: "Explore Infinity", description: "Return to the community overview.", href: "/infinity" }, { label: "Contact", description: "Ask about programs.", href: "/contact" }]);
  }

  if (segments[0] === "blog" && segments[1] === "category" && segments.length === 3) {
    return routePage("Journal", "No articles in this category yet.", "Journal categories will fill in as articles are published.", [{ label: "Browse the journal", description: "Return to all journal entries.", href: "/blog" }, ...supportLinks]);
  }

  if (segments[0] === "shop" && segments[1] === "category" && segments.length === 3) {
    return routePage("Shop", "No resources in this category yet.", "Product categories will appear as the shop collection is prepared.", [{ label: "Browse the shop", description: "Return to the resource collection.", href: "/shop" }, ...supportLinks]);
  }

  const detail = detailPages[segments[0]];
  if (detail && segments.length === 2) {
    return routePage(detail[0], detail[1], detail[2], [{ label: "Back to " + detail[0].toLowerCase(), description: "Return to the directory.", href: "/" + segments[0] }, ...supportLinks]);
  }

  return null;
}

export default async function MissingRoutePage({ params }) {
  const { segments } = await params;
  const page = getPage(segments);
  if (!page) notFound();
  return <ContentPage {...page} />;
}