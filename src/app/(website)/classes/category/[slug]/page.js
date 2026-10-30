import CategoryCatalogPage, { categoryMetadata } from '@/components/common/CategoryCatalogPage';

export async function generateMetadata({ params }) {
  return categoryMetadata(params, 'CLASS');
}

export default function CategoryPage(props) {
  return <CategoryCatalogPage {...props} type="CLASS" />;
}
