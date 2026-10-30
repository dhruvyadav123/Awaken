import CatalogGrid from "./CatalogGrid";

export default function PublicCatalogPage({ eyebrow, title, description, items = [], basePath, error, emptyMessage, filters, variant = "" }) {
  return <main className="min-h-screen bg-[#f7f8f3] text-[#29473c]">
    <div className="mx-auto w-full max-w-[1400px] px-4 py-7 sm:px-6 sm:py-9">
      <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#66836d]">{eyebrow}</p>
      <h1 className="mt-2 font-[Georgia,serif] text-4xl sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-sm leading-7 text-[#647368]">{description}</p>}
      {filters && <div className="mt-4">{filters}</div>}
      <div className="mt-7">{error ? <p role="alert" className="rounded-lg bg-white p-6 text-[#8a4c3c]">{error}</p> : items.length ? <CatalogGrid items={items} basePath={basePath} variant={variant} /> : <p className="rounded-lg bg-white p-6 text-[#647368]">{emptyMessage}</p>}</div>
    </div>
  </main>;
}
