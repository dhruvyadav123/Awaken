import CatalogGrid from "./CatalogGrid";

export default function PublicCatalogPage({ eyebrow, title, description, items = [], basePath, error, emptyMessage, filters }) {
  return <main className="min-h-screen bg-[#f7f8f3] text-[#29473c]">
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">{eyebrow}</p>
      <h1 className="mt-4 font-[Georgia,serif] text-4xl sm:text-6xl">{title}</h1>
      {description && <p className="mt-5 max-w-2xl text-base leading-8 text-[#647368]">{description}</p>}
      {filters && <div className="mt-6">{filters}</div>}
      <div className="mt-10">{error ? <p role="alert" className="rounded-lg bg-white p-6 text-[#8a4c3c]">{error}</p> : items.length ? <CatalogGrid items={items} basePath={basePath} /> : <p className="rounded-lg bg-white p-6 text-[#647368]">{emptyMessage}</p>}</div>
    </div>
  </main>;
}
