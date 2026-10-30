import Link from "next/link";

import {
  RecordMedia,
} from "@/components/common/ApiRecordDisplay";

import {
  formatProductPrice,
} from "@/lib/product-format";

import AddToCartButton from "@/components/website/shop/AddToCartButton";
import ClaimDigitalProduct from "@/components/website/shop/ClaimDigitalProduct";
import { productUnavailable } from "@/lib/student-flow";
import { isFreeDigitalProduct } from "@/lib/digital-library";

function getProductId(product) {
  return product.id || product._id || null;
}

function getProductPrice(product) {
  if (
    product.discountPrice == null &&
    product.price == null &&
    product.regularPrice == null
  ) {
    return null;
  }

  return formatProductPrice(product);
}

function getProductDescription(product) {
  return (
    product.shortDescription ||
    product.excerpt ||
    product.description ||
    ""
  );
}

function ProductCard({ product }) {
  const productId = getProductId(product);

  const slug =
    typeof product.slug === "string"
      ? product.slug.trim()
      : "";

  const href = slug
    ? `/shop/${encodeURIComponent(slug)}`
    : null;

  const title =
    product.title ||
    product.name ||
    "Awaken resource";

  const description =
    getProductDescription(product);

  const category =
    product.category?.name ||
    product.categoryName ||
    product.productType ||
    product.format ||
    product.kind ||
    "Resource";

  const price = getProductPrice(product);

  const outOfStock =
    productUnavailable(product);

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#e2e9e2] bg-white shadow-[0_3px_14px_rgba(36,67,47,0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#bfd2c1] hover:shadow-[0_12px_28px_rgba(34,70,49,0.1)] motion-reduce:transform-none">
      <div className="relative overflow-hidden border-b border-[#edf1ec] bg-[#f3f7f2] [&_.api-media-asset]:!rounded-none [&_.api-media-asset]:!border-0 [&_.api-media-asset]:!bg-transparent [&_.api-media-asset]:!p-0 [&_.api-media-asset_img]:!rounded-none">
        {href ? (
          <Link
            href={href}
            prefetch={false}
            aria-label={`View ${title}`}
            className="block"
          >
            <RecordMedia
              record={product}
              compact
              imagesOnly
            />
          </Link>
        ) : (
          <RecordMedia
            record={product}
            compact
            imagesOnly
          />
        )}

      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[10px] font-semibold tracking-[0.14em] text-[#66836d] uppercase">
            {typeof category === "string" ? category : "Resource"}
          </p>

          {outOfStock && (
            <span className="shrink-0 rounded-full bg-[#fff3ef] px-2 py-1 text-[10px] font-semibold text-[#965344]">
              Out of stock
            </span>
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 font-[Georgia,serif] text-[19px] leading-[1.3] text-[#20372a]">
          {href ? (
            <Link
              href={href}
              prefetch={false}
              className="transition hover:text-[#2c7652]"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>

        {(product.author ||
          product.authorName) && (
          <p className="mt-2 text-[11px] text-[#7b847c]">
            By{" "}
            {product.author ||
              product.authorName}
          </p>
        )}

        {description && (
          <p className="mt-3 line-clamp-2 text-[12px] leading-[1.55] text-[#788179]">
            {description}
          </p>
        )}

        <div className="mt-auto pt-4">
          {price != null && (
            <p className="mb-3 text-lg font-semibold tracking-tight text-[#213b2c]">
              {price}
            </p>
          )}

          {productId && !outOfStock ? (
            <ProductAction
              productId={productId}
              product={product}
              compact
              variants={
                Array.isArray(product.variants)
                  ? product.variants
                  : []
              }
            />
          ) : href ? (
            <Link
              href={href}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#d6e1d9] px-4 text-sm font-semibold text-[#315a48] transition hover:bg-[#f1f6f1]"
            >
              View details →
            </Link>
          ) : (
            <span className="block text-sm text-[#8a6f68]">
              Currently unavailable
            </span>
          )}

        </div>
      </div>
    </article>
  );
}

export default function ProductCatalogPage({
  products = [],
  error,
  title = "Thoughtful resources.",
  description = "Explore books and resources to support your everyday practice.",
  filters,
  pagination,
}) {
  const items = Array.isArray(products)
    ? products
    : [];

  return (
    <main className="min-h-screen bg-[#fbfcfa] text-[#20352d]">
      <section className="border-b border-[#e7ede7] bg-white">
        <div className="mx-auto max-w-7xl px-5 pt-3 pb-5 sm:px-8 sm:pt-4 sm:pb-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center gap-2 text-[11px] text-[#809086]"
          >
            <Link
              href="/"
              className="hover:text-[#28563e]"
            >
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <span className="font-medium text-[#315a48]">
              Shop
            </span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-[#52785d] uppercase">
                Mindful shop
              </p>

              <h1 className="mt-1.5 font-[Georgia,serif] text-3xl leading-tight tracking-tight text-[#193b29] sm:text-4xl">
                {title}
              </h1>

              {description && (
                <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#738076] sm:text-sm">
                  {description}
                </p>
              )}
            </div>

            <Link
              href="/cart"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d3e1d5] bg-[#f8fbf8] px-3.5 text-xs font-semibold text-[#315a48] transition hover:border-[#aec8b1] hover:bg-[#f1f7f1]"
            >
              My cart
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTERS */}
      {filters && (
        <section
          className="border-b border-[#e7ede7] bg-white"
          aria-label="Product categories"
        >
          <div className="mx-auto max-w-7xl px-5 py-3.5 sm:px-8">
            <div className="hidden">
              <div>
                <h2 className="text-[17px] font-semibold text-[#203c2b]">
                  Shop by category
                </h2>

                <p className="mt-1 text-xs text-[#78867b]">
                  Find resources that match your interests.
                </p>
              </div>

              <Link
                href="/shop"
                className="text-xs font-semibold text-[#38684d] underline-offset-4 hover:underline"
              >
                View all products →
              </Link>
            </div>

            {filters}
          </div>
        </section>
      )}

      {/* PRODUCTS */}
      <section
        aria-labelledby="shop-products-heading"
        className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="shop-products-heading"
              className="font-[Georgia,serif] text-2xl leading-tight text-[#203c2b] sm:text-[28px]"
            >
              All products
            </h2>

            {!error && (
              <p className="mt-1.5 text-xs text-[#7b887e]">
                {items.length}{" "}
                {items.length === 1
                  ? "product"
                  : "products"}{" "}
                currently listed
              </p>
            )}
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-[#f0ddd5] bg-[#fff8f5] px-5 py-6 text-sm text-[#8a4c3c]"
          >
            Products could not be loaded.
            Please try again later.
          </div>
        ) : items.length ? (
          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:gap-5 xl:grid-cols-4">
            {items.map((product, index) => (
              <ProductCard
                key={
                  product.id ||
                  product._id ||
                  product.slug ||
                  `product-${index}`
                }
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#e2e9e2] bg-white px-6 py-12 text-center shadow-[0_3px_14px_rgba(36,67,47,0.035)]">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#edf2ed] text-[#67816c]">
              <svg
                className="size-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 7h16l-1 13H5L4 7ZM8 9V6a4 4 0 0 1 8 0v3" />
              </svg>
            </div>

            <h3 className="mt-4 font-[Georgia,serif] text-2xl text-[#264230]">
              No products available
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#78867b]">
              There are no published products
              to display in this collection.
            </p>

            <Link
              href="/shop"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#28563e] px-5 text-sm font-semibold text-white hover:bg-[#1c412e]"
            >
              Browse all products
            </Link>
          </div>
        )}

        {pagination && (
          <div className="mt-7">
            {pagination}
          </div>
        )}
      </section>
    </main>
  );
}
function ProductAction({ product, ...props }) {
  if (product.hasVariants && !props.variants?.length) return product.slug ? <Link className="text-sm font-semibold underline" href={`/shop/${encodeURIComponent(product.slug)}`}>Choose a product option</Link> : <p className="text-sm">Product options are currently unavailable.</p>;
  return isFreeDigitalProduct(product) ? <ClaimDigitalProduct {...props} /> : <AddToCartButton {...props} />;
}
