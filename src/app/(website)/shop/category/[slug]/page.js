import CategoryCatalogPage, {
  categoryMetadata,
} from "@/components/common/CategoryCatalogPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}) {
  return categoryMetadata(
    params,
    "PRODUCT"
  );
}

export default function CategoryPage(props) {
  return (
    <CategoryCatalogPage
      {...props}
      type="PRODUCT"
    />
  );
}
