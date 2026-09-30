import Link from "next/link";

const entries = [
  ["Training and classes", "Guided learning and everyday wellbeing practices.", "/classes"],
  ["Events and workshops", "Gather, learn, and practice with others.", "/workshops"],
  ["Infinity community", "Explore ongoing learning and connection.", "/infinity"],
  ["Infinity membership", "Review information about membership.", "/infinity/membership"],
  ["Community stories", "Participant stories are shared only with permission.", "/testimonials"],
  ["Shop and free resources", "Explore the written resources and check shop availability.", "/shop"],
  ["Facilitator opportunities", "Check whether applications are open.", "/become-a-facilitator"],
  ["Meditations", "Try a short, self-guided written practice.", "/meditations"],
  ["Journal", "Read a practical reflection for everyday life.", "/blog"],
  ["Meet the facilitators", "Review what to look for in a session guide.", "/facilitators"],
  ["Contact", "Find the current ways to ask a question.", "/contact"],
  ["About Awaken With Me", "Learn about our intention and approach.", "/about"],
];

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const results = query ? entries.filter(item => item.slice(0, 2).join(" ").toLowerCase().includes(query.toLowerCase())) : [];
  const resultLabel = results.length === 1 ? "1 result found." : results.length + " results found.";
  return <div className="content-page search-page">
    <section className="content-hero"><div className="content-hero-copy">
      <p className="content-eyebrow">Search Awaken With Me</p>
      <h1>{query ? "Search results for " + query : "What are you looking for?"}</h1>
      <p className="content-lede">{query ? resultLabel : "Search classes, events, and community information."}</p>
      <form className="results-search" action="/search"><label className="sr-only" htmlFor="results-query">Search</label><input id="results-query" name="q" defaultValue={query} placeholder="Try classes or events" /><button className="content-button content-button-primary" type="submit">Search</button></form>
    </div></section>
    {query && results.length ? <ul className="content-link-list search-results">{results.map(([title, description, href]) => <li key={href}><Link href={href}><span><strong>{title}</strong><small>{description}</small></span><span className="content-link-arrow" aria-hidden="true">-&gt;</span></Link></li>)}</ul> : null}
    {query && !results.length ? <p className="content-notice">No matching pages found. Try classes, workshops, meditation, Infinity, or facilitators.</p> : null}
  </div>;
}
