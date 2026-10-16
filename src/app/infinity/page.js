import ContentPage from "../../components/common/ContentPage";
import { pages } from "../../data/site-pages";

export const metadata = {
  title: "Infinity Community | Awaken With Me",
  description:
    "Explore the Infinity community for ongoing learning, reflection, shared practice, and connection.",
};

export default function InfinityPage() {
  return <ContentPage {...pages.infinity} />;
}
