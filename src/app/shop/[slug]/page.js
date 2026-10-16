import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  cache,
} from "react";

import {
  RecordMedia,
  RecordDetails,
} from "@/components/common/ApiRecordDisplay";

import {
  formatProductPrice,
} from "@/lib/product-format";

import {
  publicApi,
} from "@/lib/public-api";

import AddToCartButton from "@/components/shop/AddToCartButton";
import ClaimDigitalProduct from "@/components/shop/ClaimDigitalProduct";
import { productUnavailable } from "@/lib/student-flow";
import { isFreeDigitalProduct } from "@/lib/digital-library";

const getProduct = cache(async (slug) => {
  try {
    return await publicApi(
      `products/${encodeURIComponent(slug)}`
    );
  } catch (error) {
    console.error(
      "[Shop Product Detail]",
      error
    );

    return {
      status: 503,
      error: "Product temporarily unavailable.",
      data: null,
    };
  }
});

function productName(product) {
  return (
    product.title ||
    product.name ||
    "Awaken resource"
  );
}

function hasPrice(product) {
  return (
    product.price != null ||
    product.regularPrice != null ||
    product.discountPrice != null
  );
}

export async function generateMetadata({
  params,
}) {
  const { slug } = await params;

  const result = await getProduct(slug);

  const product = result?.data || {};

  return {
    title: `${
      product.seoTitle ||
      productName(product)
    } | Awaken Shop`,

    description:
      product.seoDescription ||
      product.shortDescription ||
      product.excerpt ||
      product.description ||
      undefined,

    robots:
      result?.error || !result?.data
        ? {
            index: false,
            follow: false,
          }
        : undefined,
  };
}

export default async function ProductDetailPage({
  params,
}) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string") {
    notFound();
  }

  const result = await getProduct(slug);

  if (
    result?.status === 404 ||
    (!result?.error && !result?.data)
  ) {
    notFound();
  }

  const product = result?.data || {};

  const title = productName(product);

  const productId =
    product.id || product._id || null;

  const priceAvailable =
    hasPrice(product);

  const outOfStock =
    productUnavailable(product);

  const description =
    product.description ||
    product.shortDescription ||
    product.excerpt ||
    product.content ||
    "";

  const type =
    product.category?.name ||
    product.categoryName ||
    product.productType ||
    product.format ||
    product.kind ||
    "Resource";

  const variants = Array.isArray(
    product.variants
  )
    ? product.variants
    : [];

  return (
    <main className="min-h-screen bg-white text-[#20352d]">
      <div className="mx-auto max-w-7xl px-5 pt-6 pb-14 sm:px-8 sm:pt-8 sm:pb-20">
        {/* BREADCRUMB */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 text-xs text-[#809087]"
        >
          <Link
            href="/"
            className="transition hover:text-[#28563e]"
          >
            Home
          </Link>

          <span aria-hidden="true">/</span>

          <Link
            href="/shop"
            className="transition hover:text-[#28563e]"
          >
            Shop
          </Link>

          <span aria-hidden="true">/</span>

          <span className="max-w-xs truncate font-medium text-[#315a48]">
            {title}
          </span>
        </nav>

        {result?.error ? (
          <div
            role="alert"
            className="rounded-xl border border-[#efddd5] bg-[#fff8f5] p-6"
          >
            <p className="text-sm text-[#8a4c3c]">
              This product is temporarily
              unavailable.
            </p>

            <Link
              href="/shop"
              className="mt-4 inline-block text-sm font-semibold text-[#315a48] underline"
            >
              Return to shop
            </Link>
          </div>
        ) : (
          <>
            {/* PRODUCT MAIN SECTION */}
            <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
              {/* MEDIA */}
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[#e7ece6] bg-[#fafbf8]">
                <RecordMedia
                  record={product}
                />
              </div>

              {/* PRODUCT INFORMATION */}
              <div className="min-w-0 lg:pt-2">
                <p className="text-[11px] font-semibold tracking-[0.17em] text-[#5e8469] uppercase">
                  {typeof type === "string"
                    ? type
                    : "Resource"}
                </p>

                <h1 className="mt-3 font-[Georgia,serif] text-4xl leading-[1.15] tracking-tight text-[#193b29] sm:text-5xl">
                  {title}
                </h1>

                {(product.author ||
                  product.authorName) && (
                  <p className="mt-4 text-sm text-[#78847a]">
                    By{" "}
                    <span className="font-medium text-[#415c48]">
                      {product.author ||
                        product.authorName}
                    </span>
                  </p>
                )}

                {priceAvailable && (
                  <div className="mt-7 border-y border-[#e9eee8] py-5">
                    <p className="font-[Georgia,serif] text-3xl font-semibold tracking-tight text-[#203c2b]">
                      {formatProductPrice(product)}
                    </p>

                    <p className="mt-2 text-xs text-[#879288]">
                      {isFreeDigitalProduct(product) ? "Add this free resource to your library to open and download its files." : product.productType === "DIGITAL" ? "Your digital resource will appear in your library after payment is confirmed." : "Final charges, if any, are determined during checkout."}
                    </p>
                  </div>
                )}

                {description && (
                  <div className="mt-6">
                    <h2 className="text-sm font-semibold text-[#284832]">
                      About this product
                    </h2>

                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#738077] sm:text-[15px]">
                      {description}
                    </p>
                  </div>
                )}

                {/* STOCK STATUS */}
                <div className="mt-7">
                  {outOfStock ? (
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#a05a48]">
                      <span className="size-2 rounded-full bg-[#c47762]" />
                      Currently out of stock
                    </p>
                  ) : product.inStock === true ? (
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-[#3d7851]">
                      <span className="size-2 rounded-full bg-[#4c9a65]" />
                      In stock
                    </p>
                  ) : null}
                </div>

                {/* CART ACTION */}
                <div className="mt-5">
                  {productId ? (
                    <ProductAction
                      productId={productId}
                      product={product}
                      variants={variants}
                      disabled={outOfStock}
                    />
                  ) : (
                    <p className="rounded-lg bg-[#f7f8f5] p-4 text-sm text-[#68766b]">
                      This product cannot be
                      added to the cart right now.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#e9eee8] pt-5">
                  <Link
                    href={isFreeDigitalProduct(product) ? "/profile/digital-library" : "/cart"}
                    className="text-sm font-semibold text-[#315a48] transition hover:underline"
                  >
                    {isFreeDigitalProduct(product) ? "My digital library ?" : "View shopping cart ?"}
                  </Link>

                  <Link
                    href="/shop"
                    className="text-sm text-[#78867a] transition hover:text-[#315a48]"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            </div>

            {/* ADDITIONAL PRODUCT DETAILS */}
            <section className="mt-14 border-t border-[#e7ece7] pt-9">
              <div className="max-w-5xl">
                <h2 className="font-[Georgia,serif] text-2xl text-[#203c2b] sm:text-3xl">
                  Product information
                </h2>

                <div className="mt-6 text-sm leading-7 text-[#657568]">
                  <RecordDetails
                    record={product}
                    publicView
                    exclude={[
                      "title",
                      "name",
                      "description",
                      "shortDescription",
                      "content",
                      "excerpt",
                      "seoTitle",
                      "seoDescription",
                      "variants",
                    ]}
                  />
                </div>
              </div>
            </section>

            {/* BACK TO COLLECTION */}
            <div className="mt-12 border-t border-[#e7ece7] pt-7">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#315a48] transition hover:text-[#1e4930]"
              >
                ← Explore more resources
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
function ProductAction({ product, ...props }) {
  if (product.hasVariants && !props.variants?.length) return <p role="status" className="text-sm">Product options are currently unavailable. <Link className="underline" href="/contact">Ask Awaken about this product</Link>.</p>;
  return isFreeDigitalProduct(product) ? <ClaimDigitalProduct {...props} /> : <AddToCartButton {...props} />;
}
