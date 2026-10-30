import { getCmsItems, getCmsPayload, getTextValue } from "@/lib/cms-content";

function faqItems(records) {
  return records
    .map((record, index) => {
      const payload = getCmsPayload(record);
      const question = getTextValue(payload, "question", "title", "label");
      const answer = getTextValue(
        payload,
        "answer",
        "content",
        "description",
        "body"
      );

      return {
        id: record?.id || record?.key || `${question}-${index}`,
        question,
        answer,
      };
    })
    .filter((item) => item.question && item.answer);
}

export default async function HomeFaqs() {
  const records = await getCmsItems("faqs");
  const faqs = faqItems(records);

  if (!faqs.length) return null;

  return (
    <section className="renew-section home-faq" id="faqs" aria-labelledby="home-faq-title">
      <div className="home-faq-intro">
        <p className="renew-kicker">A LITTLE CLARITY</p>
        <h2 id="home-faq-title">
          Questions?
          <br />
          <em>Start here.</em>
        </h2>
        <p>
          A few thoughtful answers to help you find your way around Awaken.
        </p>
        <span className="home-faq-count">
          {faqs.length} {faqs.length === 1 ? "answer" : "answers"} to help you begin
        </span>
      </div>

      <div className="home-faq-list">
        {faqs.map((faq, index) => (
          <details className="home-faq-item" key={faq.id} open={index === 0}>
            <summary>
              <span>{faq.question}</span>
              <span className="home-faq-toggle" aria-hidden="true">+</span>
            </summary>
            <div className="home-faq-answer">
              <p>{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
