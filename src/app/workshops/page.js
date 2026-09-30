import ContentPage from "../../components/common/ContentPage";
import { pages } from "../../data/site-pages";
export const metadata = { title: "Events and Workshops | Awaken With Me" };
export default function WorkshopsPage() { return <ContentPage {...pages.workshops} ambientVideo={{ src: "/videos/5415978-uhd_2160_4096_25fps.mp4", eyebrow: "Learn through experience", title: "Curiosity becomes connection.", description: "Step into thoughtful spaces designed for reflection, discovery, and shared growth.", objectPosition: "center" }} />; }
