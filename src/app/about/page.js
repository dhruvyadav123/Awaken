import ContentPage from "../../components/common/ContentPage";
import { pages } from "../../data/site-pages";
export const metadata = { title: "About | Awaken With Me" };
export default function AboutPage() { return <ContentPage {...pages.about} ambientVideo={{ src: "/videos/15935618_3840_2160_24fps.mp4", eyebrow: "A quieter perspective", title: "Space changes what we notice.", description: "Slow down for a moment and reconnect with what is already here.", objectPosition: "center" }} />; }
