import Image from "next/image";
import CinematicHero from "../components/home/CinematicHero";
import HomepageMotion from "../components/home/HomepageMotion";
import Link from "next/link";
import { ContactTrigger } from "../components/common/ContactPopup";
import OpeningSplash from "../components/common/OpeningSplash";
import HomeCmsSections from "../components/home/HomeCmsSections";
import "./home.css";
const offerings = [
  ["01", "/images/pages/meditations-hero.png", "Meditation library", "MAKE SPACE FOR YOURSELF", "Choose an audio, video, or written practice that feels right for this moment.", "/meditations", "sage", "Explore Meditation"],
  ["02", "/images/pages/start-here-sunrise.png", "Transformative workshops", "GROW THROUGH EXPERIENCE", "Get curious, explore new perspectives, and discover what is possible when we learn together.", "/workshops", "sand", "Explore workshops"],
  ["03", "/images/pages/infinity-hero.png", "The Infinity community", "BELONG AS YOU ARE", "A space for ongoing discovery, honest connection, and a little encouragement along the way.", "/infinity", "rose", "Explore Infinity"]
];

export default function Home() {
return <>
<OpeningSplash />
<HomepageMotion>
<CinematicHero />
<div className="renew-values"><span>Rooted in awareness</span><i>✦</i><span>Led with intention</span><i>✦</i><span>Open to everyone</span><i>✦</i><span>At your own pace</span></div>
<section className="renew-section" id="explore"><div className="renew-section-heading"><div><p className="renew-kicker">YOUR JOURNEY, YOUR WAY</p><h2>A place to begin.<br/><em>Room to become.</em></h2></div><p>There is no single way to grow. Follow your curiosity and discover what feels right for you.</p></div><div className="renew-offerings">{offerings.map(([number,image,name,tag,text,href,color,action])=><Link href={href} className={`renew-offering ${color}`} key={number}><div className="renew-card-top"><span>{number} /</span><span>↗</span></div><div className="renew-card-icon"><Image src={image} alt="" width={640} height={360} quality={90} /></div><p className="renew-kicker">{tag}</p><h3>{name}</h3><p>{text}</p><span className="renew-card-link">{action} <span>→</span></span></Link>)}</div></section>
<section className="renew-section renew-philosophy"><div className="renew-philosophy-art" aria-hidden="true"><div className="renew-arch"><span>It all begins<br/>with <em>you.</em></span><i>✦</i></div><p>LESS RUSHING. MORE BECOMING.</p></div><div><p className="renew-kicker">A NOTE FROM AWAKEN</p><h2>You don’t need to be<br/>someone <em>different.</em></h2><p>Just a little more connected to who you already are. At Awaken, we make room for curiosity, self-discovery, and the everyday practices that bring us back to what matters.</p><p>Come to learn. Come to connect. Or simply come to take a moment for yourself.</p><Link className="renew-button" href="/facilitators">Get to know our guides <span>→</span></Link></div></section>
<section className="renew-section" aria-labelledby="community-title"><div className="renew-community">
  <div className="renew-community-image"><Image src="/images/home/home2.jpeg" alt="Awaken With Me community members sharing a meal in a greenery-filled space" fill quality={90} sizes="(max-width: 650px) 100vw, (max-width: 1180px) 40vw, 470px" /></div>
  <div className="renew-community-copy"><p className="renew-kicker">THE INFINITY COMMUNITY</p><h2 id="community-title">Your own journey.<br/><em>A little good company.</em></h2><p>For the moments when you want to learn, reflect, and connect with others. Discover a space you can keep coming back to.</p><div className="renew-community-topics"><span>Shared practice</span><span>Reflection</span><span>Connection</span></div><Link href="/infinity" className="renew-button">Get to know Infinity <span aria-hidden="true">→</span></Link><Link href="/infinity/membership" className="renew-text-link">Membership information <span aria-hidden="true">→</span></Link></div>
</div></section>
<HomeCmsSections />
<section className="renew-cta"><span aria-hidden="true">✦</span><p className="renew-kicker">LET’S BEGIN, TOGETHER</p><h2>Your next chapter<br/>starts with <em>a little space.</em></h2><p>For questions, possibilities, or a simple hello.</p><ContactTrigger className="renew-button">Let’s connect <span>→</span></ContactTrigger></section>
</HomepageMotion>
</>;
}




