import Link from "next/link";
import { publicApi } from "@/lib/public-api";

export const metadata = { title: "Confirm newsletter subscription | Awaken With Me" };

export default async function NewsletterConfirmationPage({ searchParams }) {
  const query = await searchParams;
  const token = typeof query?.token === "string" ? query.token.trim() : "";
  const result = token ? await publicApi("newsletter/confirm", { token }) : null;
  return <main className="min-h-[60vh] bg-[#f7f8f3] px-5 py-16 text-[#29473c] sm:px-8"><section className="mx-auto max-w-2xl rounded-xl border border-[#dfe7dd] bg-white p-8 sm:p-12">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">Newsletter</p>
    <h1 className="mt-4 font-[Georgia,serif] text-4xl">{!token ? "Confirm your email" : result.error ? "Confirmation could not be completed" : "You’re subscribed"}</h1>
    <p className="mt-5 text-base leading-8 text-[#647368]">{!token ? "Open the confirmation link from your email to confirm your subscription." : result.error ? result.error : result.message || "Your email subscription has been confirmed."}</p>
    <Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-md bg-[#315a48] px-5 text-sm font-semibold text-white hover:bg-[#254638]">Return to Awaken</Link>
  </section></main>;
}
