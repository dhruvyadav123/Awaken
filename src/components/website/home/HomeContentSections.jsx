import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BlogCards } from "@/components/website/blog/BlogCards";
import MeditationLibrary from "@/components/website/meditations/MeditationLibrary";
import { publicApi } from "@/lib/public-api";

function firstItems(result) {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.items)) return result.data.items;
  return [];
}

function EmptyApiSection({ children, href }) {
  return (
    <div className="home-api-empty">
      <p>{children}</p>
      {href ? <Link href={href}>Explore the library <ArrowRight size={15} aria-hidden="true" /></Link> : null}
    </div>
  );
}

export default async function HomeContentSections() {
  const [meditationResult, blogResult] = await Promise.all([
    publicApi("meditations", { page: 1, limit: 6 }),
    publicApi("blogs", { page: 1, limit: 3 }),
  ]);

  const meditations = firstItems(meditationResult).slice(0, 6);
  const blogs = firstItems(blogResult).filter((post) => post?.title).slice(0, 3);

  return (
    <>

      <section className="home-meditation-section renew-section" aria-labelledby="home-meditation-heading">
        <div className="renew-section-heading">
          <div>
            <p className="renew-kicker">MAKE SPACE TO PAUSE</p>
            <h2 id="home-meditation-heading">Meditation for the moment you are in.</h2>
          </div>
          <p>Choose a guided audio, video, or written practice and begin at your own pace.</p>
        </div>

        {meditations.length ? (
          <MeditationLibrary items={meditations} compact circleLayout />
        ) : (
          <EmptyApiSection href="/meditations">No meditations are published right now.</EmptyApiSection>
        )}

        <Link href="/meditations" className="renew-text-link home-section-link">
          View all meditations <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>

      <section className="home-blog-section renew-section" aria-labelledby="home-blog-heading">
        <div className="renew-section-heading">
          <div>
            <p className="renew-kicker">FROM THE JOURNAL</p>
            <h2 id="home-blog-heading">A little space to reflect.</h2>
          </div>
          <p>Read real reflections and ideas from the Awaken journal.</p>
        </div>

        {blogs.length ? (
          <BlogCards posts={blogs} compact />
        ) : (
          <EmptyApiSection href="/blog">No journal posts are published right now.</EmptyApiSection>
        )}

        <Link href="/blog" className="renew-text-link home-section-link">
          Read the journal <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
