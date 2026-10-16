import Link from "next/link";

import {
  RecordMedia,
} from "@/components/common/ApiRecordDisplay";

import {
  formatProductPrice,
} from "@/lib/product-format";

import AddToCartButton from "@/components/shop/AddToCartButton";
import ClaimDigitalProduct from "@/components/shop/ClaimDigitalProduct";
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
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e6ebe6] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#cad9cf] hover:shadow-[0_12px_35px_rgba(34,70,49,0.07)] motion-reduce:transform-none">
      <div className="relative overflow-hidden bg-[#f7f8f5]">
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

        {outOfStock && (
          <span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#965344] shadow-sm">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-semibold tracking-[0.13em] text-[#66836d] uppercase">
          {typeof category === "string"
            ? category
            : "Resource"}
        </p>

        <h3 className="mt-2 line-clamp-2 font-[Georgia,serif] text-[21px] leading-[1.35] text-[#20372a]">
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
          <p className="mt-2 text-xs text-[#7b847c]">
            By{" "}
            {product.author ||
              product.authorName}
          </p>
        )}

        {description && (
          <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-[#788179]">
            {description}
          </p>
        )}

        <div className="mt-auto pt-5">
          {price != null && (
            <p className="mb-4 text-xl font-semibold tracking-tight text-[#213b2c]">
              {price}
            </p>
          )}

          {productId && !outOfStock ? (
            <ProductAction
              productId={productId}
                      product={product}
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

          {href && productId && !outOfStock && (
            <Link
              href={href}
              prefetch={false}
              className="mt-3 block text-center text-xs font-medium text-[#547763] transition hover:text-[#28563e] hover:underline"
            >
              View product details →
            </Link>
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
    <main className="min-h-screen bg-white text-[#20352d]">
      {/* COMPACT SHOP INTRO */}
      <section className="border-b border-[#edf0ea]">
        <div className="mx-auto max-w-7xl px-5 pt-8 pb-7 sm:px-8 sm:pt-10 sm:pb-9">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-2 text-xs text-[#809086]"
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

          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#52785d] uppercase">
                Awaken With Meheck
              </p>

              <h1 className="mt-2 font-[Georgia,serif] text-4xl leading-tight tracking-tight text-[#193b29] sm:text-5xl">
                {title}
              </h1>

              {description && (
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#738076] sm:text-base">
                  {description}
                </p>
              )}
            </div>

            <Link
              href="/cart"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dce7df] bg-white px-4 text-sm font-medium text-[#315a48] transition hover:bg-[#f5f8f5]"
            >
              <svg
                className="size-[18px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.5 13h12l2-9H6" />
              </svg>

              My cart
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {filters && (
        <section
          className="border-b border-[#edf0ea] bg-[#fafbf9]"
          aria-label="Product categories"
        >
          <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
        className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="shop-products-heading"
              className="font-[Georgia,serif] text-[27px] leading-tight text-[#203c2b] sm:text-3xl"
            >
              Explore our collection
            </h2>

            {!error && (
              <p className="mt-2 text-sm text-[#7b887e]">
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
          <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="rounded-2xl border border-[#e5ebe5] bg-[#fafbf9] px-6 py-12 text-center">
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
          <div className="mt-9">
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
