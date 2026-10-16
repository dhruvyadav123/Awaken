import Image from "next/image";
import { publicApi } from "@/lib/public-api";

export default async function PublicMediaImage({ mediaId, alt = "", className = "", sizes = "100vw", width, height, fill = false, priority = false }) {
  if (!mediaId) return null;
  const result = await publicApi("media/" + encodeURIComponent(mediaId));
  if (result.error || !result.data) return null;
  const media = result.data;
  const resolvedAlt = alt || media.altText || media.title || media.name || "Awaken resource";
  const src = "/api/public/files/media/" + encodeURIComponent(mediaId) + "/file";
  return fill
    ? <Image src={src} alt={resolvedAlt} fill sizes={sizes} className={className} priority={priority} />
    : <Image src={src} alt={resolvedAlt} width={width || media.width || 640} height={height || media.height || 360} sizes={sizes} className={className} priority={priority} />;
}
