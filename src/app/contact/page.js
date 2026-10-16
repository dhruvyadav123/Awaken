import ContactForm from "@/components/contact/ContactForm";
export const metadata = { title: "Contact | Awaken With Me" };
export default function ContactPage() {
  return <main className="min-h-[70vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c] sm:px-8 sm:py-16">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
      <header className="pt-2"><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">Awaken With Meheck / Contact</p><h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-6xl">How can we help?</h1><p className="mt-5 max-w-lg text-base leading-8 text-[#647368]">Send a question about sessions, classes, workshops, membership, or products. We’ll get back to you by email.</p><p className="mt-7 text-sm leading-7 text-[#647368]">Share only the details needed to help with your enquiry. Please don’t include sensitive health or payment information.</p></header>
      <section className="rounded-xl border border-[#dfe7dd] bg-white p-6 sm:p-9" aria-label="Contact form"><ContactForm /></section>
    </div>
  </main>;
}
