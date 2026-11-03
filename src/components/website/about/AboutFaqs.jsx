import { getCmsItems, getCmsPayload, getTextValue } from "@/lib/cms-content";

function faqItems(records) {
  return records
    .map((record, index) => {
      const payload = getCmsPayload(record);
      const question = getTextValue(payload, "question", "title", "label", "prompt");
      const answer = getTextValue(payload, "answer", "content", "description", "body", "response");
      return { id: record?.id || record?.key || `${question}-${index}`, question, answer };
    })
    .filter((item) => item.question && item.answer);
}

export default async function AboutFaqs() {
  const faqs = faqItems(await getCmsItems("faqs"));
  if (!faqs.length) return null;

  return (
    <section className="border-t border-[#e7e0e4] bg-[#fffdfb] px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24 xl:px-20" aria-labelledby="about-faq-title">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 lg:grid-cols-[minmax(250px,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-[#76517d]">A little clarity</p>
          <h2 id="about-faq-title" className="mt-4 max-w-[390px] font-serif text-[42px] leading-[1.04] tracking-[-0.035em] text-[#17152d] sm:text-[52px]">Questions?<br /><em className="font-normal text-[#805c83]">Start here.</em></h2>
          <p className="mt-5 max-w-[330px] text-[14px] leading-7 text-[#6d6b77]">Find clear answers about Awakenwithmeheck, the practices, and how to begin.</p>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a6a94]">{faqs.length} {faqs.length === 1 ? "answer" : "answers"} from Awaken</p>
        </div>

        <div className="divide-y divide-[#e7e0e4]">
          {faqs.map((faq, index) => (
            <details key={faq.id} open={index === 0} className="group py-5 sm:py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[15px] font-semibold leading-7 text-[#29253f] outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-[#a276a4] focus-visible:ring-offset-4 [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f6edf6] text-xl font-normal leading-none text-[#805c83] transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-[680px] pr-10 pt-4 text-[14px] leading-7 text-[#706e7a]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
