import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  cache,
} from "react";

import {
  RecordMedia,
} from "@/components/common/ApiRecordDisplay";

import {
  formatProductPrice,
} from "@/lib/product-format";

import {
  publicApi,
} from "@/lib/public-api";

import AddToCartButton from "@/components/website/shop/AddToCartButton";
import ClaimDigitalProduct from "@/components/website/shop/ClaimDigitalProduct";
import { productUnavailable } from "@/lib/student-flow";
import { isFreeDigitalProduct } from "@/lib/digital-library";

export const dynamic = "force-dynamic";

const getProduct = cache(async (slug) => {
  try {
    return await publicApi(
      `products/${encodeURIComponent(slug)}`,
      {},
      {}
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

const descriptionFactLabels = new Set([
  "author",
  "category",
  "format",
  "book title",
  "language",
  "pages",
  "isbn",
  "access",
  "delivery",
  "included",
]);

function displayProductValue(value) {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map(displayProductValue).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return displayProductValue(value.name || value.title || value.label || value.value);
  return String(value).trim();
}

function parseProductDescription(value, title) {
  const source = typeof value === "string" ? value : "";
  const normalized = source
    .replace(/\r/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\s+(?=(?:Book Title|Author|Category|Format|Language|Pages|ISBN|Access|Delivery|Included):\s)/gi, "\n");
  const facts = [];
  const body = [];
  const titleKey = displayProductValue(title).toLowerCase();

  for (const rawLine of normalized.split(/\n+/)) {
    const line = rawLine.replace(/^\s*[-*]\s*/, "").trim();
    if (!line || /^product details\s*:?\s*$/i.test(line) || line.toLowerCase() === titleKey) continue;

    const match = line.match(/^([^:]{2,32}):\s*(.+)$/);
    const label = match?.[1]?.trim() || "";
    if (match && descriptionFactLabels.has(label.toLowerCase())) {
      facts.push({ label, value: match[2].trim() });
    } else {
      body.push(line);
    }
  }

  return {
    body: body.join(" ").replace(/\s{2,}/g, " ").trim(),
    facts,
  };
}

function productDetailEntries(product, descriptionFacts) {
  const entries = [];
  const seen = new Set();
  const add = (label, value) => {
    const text = displayProductValue(value);
    const key = label.toLowerCase();
    if (!text || seen.has(key)) return;
    seen.add(key);
    entries.push({ label, value: text });
  };
  const digital = String(product.productType || product.kind || "").toUpperCase() === "DIGITAL";

  add("Author", product.author || product.authorName);
  add("Category", product.category?.name || product.categoryName || product.category);
  add("Format", product.format || product.productFormat || product.fileFormat || (digital ? "Digital resource" : "Physical product"));
  add("Language", product.language || product.languageName);
  add("Pages", product.pages || product.pageCount);
  add("Access", product.access || product.accessType || (digital ? (isFreeDigitalProduct(product) ? "Free digital access" : "Digital access after payment") : null));

  descriptionFacts.forEach(({ label, value }) => {
    if (label.toLowerCase() !== "book title") add(label, value);
  });

  return entries;
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
  const parsedDescription = parseProductDescription(description, title);
  const cleanDescription = parsedDescription.body;
  const detailEntries = productDetailEntries(product, parsedDescription.facts);

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
    <main className="min-h-screen bg-[#fbfcfa] text-[#20352d]">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 sm:py-7">
        {/* BREADCRUMB */}
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-[#809087]"
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
            <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
              {/* MEDIA */}
              <div className="min-w-0 overflow-hidden rounded-xl border border-[#e1e9e2] bg-white p-2 shadow-[0_4px_18px_rgba(36,67,47,0.045)] [&_.api-media-asset]:!border-0 [&_.api-media-asset]:!bg-transparent [&_.api-media-asset]:!p-2 [&_.api-media-asset_img]:!max-h-[560px] [&_.api-media-asset_img]:!w-full [&_.api-media-asset_img]:!rounded-lg">
                <RecordMedia
                  record={product}
                />
              </div>

              {/* PRODUCT INFORMATION */}
              <div className="min-w-0 lg:pt-1">
                <p className="text-[10px] font-semibold tracking-[0.17em] text-[#5e8469] uppercase">
                  {typeof type === "string"
                    ? type
                    : "Resource"}
                </p>

                <h1 className="mt-2 font-[Georgia,serif] text-3xl leading-[1.12] tracking-tight text-[#193b29] sm:text-5xl">
                  {title}
                </h1>

                {(product.author ||
                  product.authorName) && (
                  <p className="mt-3 text-sm text-[#78847a]">
                    By{" "}
                    <span className="font-medium text-[#415c48]">
                      {product.author ||
                        product.authorName}
                    </span>
                  </p>
                )}

                {priceAvailable && (
                  <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-[#e3ebe4] py-4">
                    <p className="font-[Georgia,serif] text-2xl font-semibold tracking-tight text-[#203c2b]">
                      {formatProductPrice(product)}
                    </p>

                    <p className="text-[11px] text-[#879288]">
                      {isFreeDigitalProduct(product) ? "Add this free resource to your library to open and download its files." : product.productType === "DIGITAL" ? "Your digital resource will appear in your library after payment is confirmed." : "Final charges, if any, are determined during checkout."}
                    </p>
                  </div>
                )}

                {cleanDescription && (
                  <div className="mt-5">
                    <h2 className="text-[13px] font-semibold text-[#284832]">
                      About this product
                    </h2>

                    <p className="mt-2 whitespace-pre-line text-sm leading-[1.65] text-[#738077] sm:text-[15px]">
                      {cleanDescription}
                    </p>
                  </div>
                )}

                {/* STOCK STATUS */}
                <div className="mt-5 min-h-5">
                  {outOfStock ? (
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#a05a48]">
                      <span className="size-1.5 rounded-full bg-[#c47762]" />
                      Currently out of stock
                    </p>
                  ) : product.inStock === true ? (
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-[#3d7851]">
                      <span className="size-1.5 rounded-full bg-[#4c9a65]" />
                      In stock
                    </p>
                  ) : null}
                </div>

                {/* CART ACTION */}
                <div className="mt-4">
                  {productId ? (
                    <ProductAction
                      productId={productId}
                      product={product}
                      variants={variants}
                      disabled={outOfStock}
                      showIcon={false}
                    />
                  ) : (
                    <p className="rounded-lg bg-[#f7f8f5] p-4 text-sm text-[#68766b]">
                      This product cannot be
                      added to the cart right now.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e9eee8] pt-4">
                  <Link
                    href={isFreeDigitalProduct(product) ? "/profile/digital-library" : "/cart"}
                    className="text-sm font-semibold text-[#315a48] transition hover:underline"
                  >
                    {isFreeDigitalProduct(product) ? "My digital library" : "View shopping cart"}
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
            <section className="mt-10 border-t border-[#e1e9e2] pt-7">
              <div className="max-w-5xl">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-[#66836d] uppercase">
                      Product information
                    </p>
                    <h2 className="mt-1 font-[Georgia,serif] text-2xl text-[#203c2b]">
                      More about this resource
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#eef5ed] px-3 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#477051] uppercase">
                    {typeof type === "string" ? type : "Resource"}
                  </span>
                </div>

                {detailEntries.length > 0 ? (
                  <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {detailEntries.map((detail) => (
                      <div key={detail.label} className="rounded-xl border border-[#e1e9e2] bg-white px-4 py-3.5 shadow-[0_3px_12px_rgba(36,67,47,0.03)]">
                        <dt className="text-[10px] font-semibold tracking-[0.12em] text-[#7a897e] uppercase">{detail.label}</dt>
                        <dd className="mt-1.5 text-sm font-medium leading-6 text-[#29473c]">{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-5 rounded-xl border border-[#e1e9e2] bg-white px-4 py-4 text-sm leading-6 text-[#657568]">
                    Product information will be shown here as it becomes available.
                  </p>
                )}
              </div>
            </section>

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
