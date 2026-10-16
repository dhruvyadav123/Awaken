
import CategoryCatalogPage, {
  categoryMetadata,
} from "@/components/common/CategoryCatalogPage";

export async function generateMetadata({ params }) {
  return categoryMetadata(params, "SESSION");
}

export default function CategoryPage(props) {
  return <CategoryCatalogPage {...props} type="SESSION" />;
}
