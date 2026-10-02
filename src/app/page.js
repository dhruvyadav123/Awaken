import Image from "next/image";
import CosmicSenses from "../components/home/CosmicSenses";
import CinematicHero from "../components/home/CinematicHero";
import HomepageMotion from "../components/home/HomepageMotion";
import Link from "next/link";
import { ContactTrigger } from "../components/common/ContactPopup";
import BreathingPractice from "../components/home/BreathingPractice";
import OpeningSplash from "../components/common/OpeningSplash";
import "./home.css";
const offerings = [
  ["01", "/images/pages/meditations-hero.png", "Mindful classes", "MAKE SPACE FOR YOURSELF", "Small moments. Meaningful shifts. Find a guided practice that feels like coming home.", "/classes", "sage"],
  ["02", "/images/pages/start-here-sunrise.png", "Transformative workshops", "GROW THROUGH EXPERIENCE", "Get curious, explore new perspectives, and discover what is possible when we learn together.", "/workshops", "sand"],
  ["03", "/images/pages/infinity-hero.png", "The Infinity community", "BELONG AS YOU ARE", "A space for ongoing discovery, honest connection, and a little encouragement along the way.", "/infinity", "rose"]
];

export default function Home() {
return <>
<OpeningSplash />
<HomepageMotion>
<CinematicHero />
<CosmicSenses />
<div className="renew-values"><span>Rooted in awareness</span><i>?</i><span>Led with intention</span><i>?</i><span>Open to everyone</span><i>?</i><span>At your own pace</span></div>
<section className="renew-section" id="explore"><div className="renew-section-heading"><div><p className="renew-kicker">YOUR JOURNEY, YOUR WAY</p><h2>A place to begin.<br/><em>Room to become.</em></h2></div><p>There is no single way to grow. Follow your curiosity and discover what feels right for you.</p></div><div className="renew-offerings">{offerings.map(([number,image,name,tag,text,href,color])=><Link href={href} className={`renew-offering ${color}`} key={number}><div className="renew-card-top"><span>{number} /</span><span>?</span></div><div className="renew-card-icon"><Image src={image} alt="" width={640} height={360} quality={90} /></div><p className="renew-kicker">{tag}</p><h3>{name}</h3><p>{text}</p><span className="renew-card-link">Explore the possibilities <span>?</span></span></Link>)}</div></section>
<section className="renew-section renew-start" aria-labelledby="start-title">
  <div className="renew-section-heading"><div><p className="renew-kicker">START WHERE YOU ARE</p><h2 id="start-title">What do you need<br/><em>a little more of?</em></h2></div><p>You don�t need a plan for everything. Begin with what feels useful today.</p></div>
  <div className="renew-needs">
    {[
      ["01", "A quieter moment", "Make room for a pause and explore a mindful practice.", "/meditations", "Explore meditations", "/images/pages/meditations-hero.png"],
      ["02", "A fresh perspective", "Follow your curiosity through guided learning and shared experiences.", "/workshops", "Discover workshops", "/images/pages/start-here-sunrise.png"],
      ["03", "A sense of connection", "Get to know a community built around practice and reflection.", "/infinity", "Explore Infinity", "/images/pages/infinity-hero.png"],
    ].map(([number, title, text, href, action, imageUrl]) => <Link key={number} href={href} className="renew-need"><div className="renew-need-art" aria-hidden="true"><Image src={imageUrl} alt="" width={640} height={360} quality={90} /></div><div className="renew-need-copy"><span className="renew-index">{number}</span><h3>{title}</h3><p>{text}</p><span className="renew-card-link">{action}<span aria-hidden="true">?</span></span></div></Link>)}
  </div>
</section>
<section className="renew-pause"><div><p className="renew-kicker">A MOMENT, JUST FOR YOU</p><h2>Before your next step,<br/><em>take a breath.</em></h2><p>You don�t have to do more to begin.<br/>Sometimes, a little stillness is enough.</p><Link className="renew-text-link" href="/meditations">Explore meditations ?</Link></div><BreathingPractice/></section>
<section className="renew-section renew-philosophy"><div className="renew-philosophy-art" aria-hidden="true"><div className="renew-arch"><span>It all begins<br/>with <em>you.</em></span><i>?</i></div><p>LESS RUSHING. MORE BECOMING.</p></div><div><p className="renew-kicker">A NOTE FROM AWAKEN</p><h2>You don�t need to be<br/>someone <em>different.</em></h2><p>Just a little more connected to who you already are. At Awaken, we make room for curiosity, self-discovery, and the everyday practices that bring us back to what matters.</p><p>Come to learn. Come to connect. Or simply come to take a moment for yourself.</p><Link className="renew-button" href="/facilitators">Get to know our guides <span>?</span></Link></div></section>
<section className="renew-how-wrap" aria-labelledby="how-title"><div className="renew-section renew-how">
  <div><p className="renew-kicker">SMALL STEPS, YOUR OWN RHYTHM</p><h2 id="how-title">A simpler way<br/><em>to begin.</em></h2><p className="renew-body">No perfect starting point needed. Just a little curiosity and space for yourself.</p><Link className="renew-text-link" href="/classes">Explore ways to learn <span aria-hidden="true">?</span></Link></div>
  <ol className="renew-steps">{[
    ["Notice what you need", "A moment of quiet, something new to learn, or people to practise with. Let that guide your first step."],
    ["Find a practice that fits", "Explore classes, workshops, or meditations. Read the details and choose what feels right for your day."],
    ["Make space to return", "Start small. Come back when you can, and let your practice find its place in everyday life."]
  ].map(([title,text],index)=><li key={title}><span className="renew-step-number">0{index+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
</div></section>
<section className="renew-section" aria-labelledby="community-title"><div className="renew-community">
  <div className="renew-community-image"><Image src="/images/home/home2.jpeg" alt="Awaken With Me community members sharing a meal in a greenery-filled space" fill quality={90} sizes="(max-width: 650px) 100vw, (max-width: 1180px) 40vw, 470px" /></div>
  <div className="renew-community-copy"><p className="renew-kicker">THE INFINITY COMMUNITY</p><h2 id="community-title">Your own journey.<br/><em>A little good company.</em></h2><p>For the moments when you want to learn, reflect, and connect with others. Discover a space you can keep coming back to.</p><div className="renew-community-topics"><span>Shared practice</span><span>Reflection</span><span>Connection</span></div><Link href="/infinity" className="renew-button">Get to know Infinity <span aria-hidden="true">?</span></Link><Link href="/infinity/membership" className="renew-text-link">Membership information <span aria-hidden="true">?</span></Link></div>
</div></section>
<section className="renew-section renew-faq"><div><p className="renew-kicker">A LITTLE CLARITY</p><h2>New here?<br/><em>You�re welcome.</em></h2><p>A few things to help you find your way.</p></div><div>{[["Where should I begin?","Follow what feels useful today. Explore classes for a guided practice, workshops for shared learning, or meditations for a quiet moment at your own pace."],["Do I need any experience?","You are welcome wherever you are in your journey. Check the details of each class or workshop for any preparation or experience it calls for."],["What is the Infinity community?","Infinity is a space to explore ongoing practice and connection. Visit the Infinity page to learn about the community and membership."],["Can you help me choose a practice?","Use the contact button below to start a conversation about your interests and the kind of support you are looking for."]].map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
<section className="renew-featured" aria-labelledby="featured-title">
  <div className="renew-featured-copy">
    <p className="renew-kicker">A GUIDED MEDITATION</p>
    <h2 id="featured-title">Make room for<br/><em>connection.</em></h2>
    <p>A gentle invitation to reflect on the relationships that shape your life and return to the present moment.</p>
    <Link className="renew-button" href="/meditations">Explore meditations <span aria-hidden="true">→</span></Link>
  </div>
  <Link className="renew-featured-image" href="/meditations" aria-label="Explore guided meditations">
    <Image src="/images/home/home.jpeg" alt="Chi Guided Meditation on relationships with Meheck Mukherjee" width={1280} height={720} quality={90} sizes="(max-width: 760px) 100vw, 58vw" />
  </Link>
</section>
<section className="renew-cta"><span aria-hidden="true">?</span><p className="renew-kicker">LET�S BEGIN, TOGETHER</p><h2>Your next chapter<br/>starts with <em>a little space.</em></h2><p>For questions, possibilities, or a simple hello.</p><ContactTrigger className="renew-button">Let�s connect <span>?</span></ContactTrigger></section>
</HomepageMotion>
</>;
}




