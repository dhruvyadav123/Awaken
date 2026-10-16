import ProductCatalogPage from "@/components/shop/ProductCatalogPage";

import CategoryNavigation from "@/components/common/CategoryNavigation";

import {
  getPublicCategories,
} from "@/lib/category-data";

import {
  allPublicItems,
} from "@/lib/public-api";

export const metadata = {
  title: "Mindful Shop | Awaken With Meheck",
  description:
    "Explore books, wellness resources and thoughtful products published by Awaken With Meheck.",
};

export default async function ShopPage() {
  const [productResult, categoryResult] =
    await Promise.allSettled([
      allPublicItems("products"),
      getPublicCategories(),
    ]);

  const productResponse =
    productResult.status === "fulfilled"
      ? productResult.value
      : {
          data: [],
          error: "Unable to load products.",
        };

  const categoryResponse =
    categoryResult.status === "fulfilled"
      ? categoryResult.value
      : {
          data: [],
          error: "Unable to load categories.",
        };

  const products = Array.isArray(
    productResponse?.data
  )
    ? productResponse.data
    : [];

  const categories = Array.isArray(
    categoryResponse?.data
  )
    ? categoryResponse.data
    : [];

  return (
    <ProductCatalogPage
      products={products}
      error={productResponse?.error}
      title="The mindful shop."
      description="Thoughtfully chosen books, tools and resources to support your personal journey."
      filters={
        <div>
          <CategoryNavigation
            categories={categories}
            type="PRODUCT"
          />

          {categoryResponse?.error && (
            <p
              role="alert"
              className="mt-3 text-xs leading-5 text-[#9a6b54]"
            >
              Categories are temporarily
              unavailable. You can still
              browse all products.
            </p>
          )}
        </div>
      }
    />
  );
}