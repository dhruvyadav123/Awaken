import NewsletterUnsubscribeForm from "@/components/common/NewsletterUnsubscribeForm";

export const metadata = { title: "Unsubscribe from newsletter | Awaken With Me" };

export default async function NewsletterUnsubscribePage({ searchParams }) {
  const query = await searchParams;
  const token = typeof query?.token === "string" ? query.token.trim() : "";
  return <main className="min-h-[60vh] bg-[#f7f8f3] px-5 py-16 text-[#29473c] sm:px-8"><section className="mx-auto max-w-2xl rounded-xl border border-[#dfe7dd] bg-white p-8 sm:p-12">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#66836d]">Newsletter preferences</p>
    <h1 className="mt-4 font-[Georgia,serif] text-4xl">{token ? "Unsubscribe from Awaken emails?" : "Unsubscribe link unavailable"}</h1>
    <p className="mt-5 text-base leading-8 text-[#647368]">{token ? "Confirm below to stop newsletter emails for this address." : "This link is missing its unsubscribe token. Open the complete link from your email."}</p>
    {token && <NewsletterUnsubscribeForm token={token} />}
  </section></main>;
}
