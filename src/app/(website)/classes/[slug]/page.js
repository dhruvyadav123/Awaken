import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  Clock3,
  MapPin,
  MonitorPlay,
  Tag,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import AddToCartButton from "@/components/website/shop/AddToCartButton";
import { allPublicItems, publicApi, readableDate } from "@/lib/public-api";

function text(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return text(value.displayName || value.name || value.title || value.label);
  }
  return "";
}

function firstValue(...values) {
  return values.find((value) => {
    if (text(value)) return true;
    return Boolean(value && typeof value === "object" && (value.url || value.src || value.fileUrl || value.publicPath));
  }) || "";
}

function firstText(...values) {
  return text(firstValue(...values));
}

function mediaId(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.mediaId || value.id || value._id || "";
  }
  return "";
}

function mediaRecord(item, source, id) {
  return {
    title: item?.title || item?.name || "Class image",
    imageAlt: item?.imageAlt || item?.altText || item?.title || item?.name || "Class image",
    thumbnail: source || "",
    thumbnailMediaId: id || "",
  };
}

function formatPrice(item) {
  const raw = item?.discountPrice ?? item?.regularPrice ?? item?.price ?? item?.amount;
  if (raw === undefined || raw === null || raw === "") return "Price on request";

  const amount = Number(raw);
  const currency = /^[A-Z]{3}$/.test(item?.currency || "") ? item.currency : "INR";
  if (!Number.isFinite(amount)) return String(raw);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

function dateLabel(value) {
  return readableDate(value) || "To be announced";
}

function classProductId(item) {
  const candidate = [
    item?.productId,
    item?.purchaseProductId,
    item?.commerceProductId,
    item?.catalogProductId,
    item?.product?.id,
    item?.product?.productId,
  ].find(Boolean);

  return typeof candidate === "object" ? candidate.id || candidate._id || "" : candidate || "";
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-t border-[#e7e8f0] py-3.5 first:border-t-0 first:pt-0 sm:py-4">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#eef0ff] text-[#5f55d5]">
        <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#8a8da1]">{label}</dt>
        <dd className="mt-1 break-words text-sm font-medium leading-5 text-[#34384f]">{value}</dd>
      </div>
    </div>
  );
}

function MediaFrame({ record, className = "", banner = false }) {
  const imageFit = banner ? "[&_.api-media-asset_img]:!object-contain [&_.api-media-asset_img]:!object-top" : "[&_.api-media-asset_img]:!object-cover";
  return (
    <div className={`relative overflow-hidden bg-[#e8eaf4] ${className}`}>
      <div className={`absolute inset-0 [&_.api-media-gallery]:!m-0 [&_.api-media-gallery]:!h-full [&_.api-media-gallery]:!w-full [&_.api-media-asset]:!h-full [&_.api-media-asset]:!w-full [&_.api-media-asset]:!border-0 [&_.api-media-asset]:!bg-transparent [&_.api-media-asset]:!p-0 [&_.api-media-asset_img]:!h-full [&_.api-media-asset_img]:!w-full [&_.api-media-asset_img]:!max-h-none [&_.api-media-asset_img]:!aspect-auto [&_.api-media-asset_img]:!rounded-none ${imageFit}`}>
        <RecordMedia record={record} compact imagesOnly priority />
      </div>
      {!record.thumbnail && !record.thumbnailMediaId && (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_25%_20%,#ffffff,#e8eaf4_62%,#dcdff0)] px-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#74789b]">
          {banner ? "Class banner" : "Class image"}
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await publicApi("classes/" + encodeURIComponent(slug));
  return {
    title: (result.data?.seoTitle || result.data?.title || result.data?.name || "Class") + " | AwakenWithMeheck",
    description: result.data?.seoDescription || result.data?.excerpt || result.data?.shortDescription || undefined,
  };
}

export default async function ClassDetailPage({ params }) {
  const { slug } = await params;
  const [result, categoryResult] = await Promise.all([
    publicApi("classes/" + encodeURIComponent(slug)),
    allPublicItems("categories"),
  ]);

  if (result.status === 404 || (!result.error && !result.data)) notFound();

  const item = result.data || {};
  const category = Array.isArray(categoryResult.data)
    ? categoryResult.data.find((entry) => String(entry.id) === String(item.categoryId))
    : null;

  const title = item.title || item.name || "Class";
  const description = item.content || item.description || item.shortDescription || item.excerpt;
  const shortDescription = item.shortDescription || item.excerpt;
  const facilitator = firstText(item.facilitator, item.facilitatorName, item.instructorName) || "To be announced";
  const categoryName = firstText(category?.name, item.categoryName, item.category) || "Class";
  const bannerSource = firstValue(item.banner, item.bannerUrl, item.bannerImage, item.coverImage);
  const bannerId = mediaId(item.bannerMediaId || item.bannerMedia || item.banner);
  const thumbnailSource = firstValue(item.thumbnail, item.thumbnailUrl, item.image, item.imageUrl);
  const thumbnailId = mediaId(item.thumbnailMediaId || item.imageMediaId || item.thumbnail);
  const bannerRecord = mediaRecord(item, bannerSource || thumbnailSource, bannerId || thumbnailId);
  const thumbnailRecord = mediaRecord(item, thumbnailSource || bannerSource, thumbnailId || bannerId);
  const productId = classProductId(item);
  const classId = item.id || item._id;
  const mode = text(item.mode) || text(item.format) || "To be announced";
  const location = firstText(item.location, item.venue, item.city, item.address) || "To be announced";
  const classRegistrationClosed = Boolean(
    item.registrationOpen === false &&
    item.startsAt &&
    item.registrationStartAt &&
    item.registrationEndAt
  );

  return (
    <main className="min-h-screen bg-[#f7f7fb] text-[#2d3046]">
      <section className="relative isolate h-[255px] overflow-hidden bg-[#e7e8f3] sm:h-[325px] lg:h-[390px]">
        <MediaFrame record={bannerRecord} banner className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,32,60,.1)_0%,rgba(31,32,60,.18)_45%,rgba(31,32,60,.7)_100%)]" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-between px-5 py-5 sm:px-8 sm:py-7 lg:px-10">
          <Link href="/classes" className="inline-flex w-fit items-center gap-2 rounded-full bg-white/85 px-3.5 py-2 text-xs font-semibold text-[#4d4c72] shadow-sm backdrop-blur transition hover:bg-white">
            <ArrowLeft size={14} aria-hidden="true" /> Back to classes
          </Link>
          <div className="max-w-xl text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/75">AwakenWithMeheck · {item.kind === "WORKSHOP" ? "Workshop" : "Class"}</p>
            <p className="mt-2 text-sm text-white/85">{categoryName}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        {result.error ? (
          <p role="alert" className="mt-8 rounded-2xl border border-[#f0d9d2] bg-white p-6 text-[#8a4c3c]">{result.error}</p>
        ) : (
          <>
            <section className="relative z-10 -mt-12 grid items-start gap-8 lg:grid-cols-[minmax(280px,350px)_minmax(0,1fr)] lg:gap-12" aria-labelledby="class-title">
              <div className="pt-16">
                <div className="overflow-hidden rounded-[18px] border border-[#e0e1ea] bg-white p-2 shadow-[0_18px_45px_rgba(39,40,75,.16)]">
                  <MediaFrame record={thumbnailRecord} className="aspect-[16/9] rounded-[12px]" />
                </div>
                <div className="mt-3 rounded-xl border border-[#e0e1ea] bg-white p-3 shadow-[0_8px_22px_rgba(39,40,75,.07)]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-[#3d3f58]">{formatPrice(item)}</span>
                    {item.discountPrice != null && item.regularPrice != null && Number(item.discountPrice) < Number(item.regularPrice) && (
                      <span className="text-xs text-[#9899a9] line-through">{formatPrice({ ...item, discountPrice: null, price: item.regularPrice })}</span>
                    )}
                  </div>
                  <div className="mt-3">
                    {classId ? (
                      <AddToCartButton
                        itemType="CLASS"
                        itemId={classId}
                        itemLabel="Class"
                        disabled={classRegistrationClosed}
                        showIcon={false}
                        buttonClassName="!min-h-9 !rounded-full !bg-[#5b52d8] !px-4 !text-[10px] !tracking-[0.02em] hover:!bg-[#4840be]"
                      />
                    ) : productId ? (
                      <AddToCartButton
                        productId={productId}
                        showIcon={false}
                        buttonClassName="!min-h-9 !rounded-full !bg-[#5b52d8] !px-4 !text-[10px] !tracking-[0.02em] hover:!bg-[#4840be]"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="pt-1 lg:pt-12">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7169d1]">{categoryName}</p>
                <h1 id="class-title" className="mt-2 max-w-3xl font-[Georgia,serif] text-4xl leading-[1.06] tracking-[-0.045em] text-[#2e3047] sm:text-5xl lg:text-6xl">{title}</h1>
                {shortDescription && <p className="mt-4 max-w-2xl text-sm leading-7 text-[#74778c] sm:text-base">{shortDescription}</p>}

                <section className="mt-7 rounded-2xl border border-[#e2e3eb] bg-white p-5 shadow-[0_10px_28px_rgba(39,40,75,.05)] sm:p-6" aria-labelledby="class-details-title">
                  <h2 id="class-details-title" className="border-b border-[#e7e8f0] pb-3 text-[13px] font-bold text-[#373a52]">Class Details</h2>
                  <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                    <DetailItem icon={UserRound} label="Primary facilitator" value={facilitator} />
                    <DetailItem icon={Tag} label="Category" value={categoryName} />
                    <DetailItem icon={CalendarDays} label="Start date" value={dateLabel(item.startsAt || item.startDate || item.date)} />
                    <DetailItem icon={CalendarRange} label="End date" value={dateLabel(item.endsAt || item.endDate)} />
                    <DetailItem icon={MonitorPlay} label="Format" value={mode} />
                    <DetailItem icon={MapPin} label="Location" value={location} />
                    {item.duration && <DetailItem icon={Clock3} label="Duration" value={text(item.duration)} />}
                  </dl>
                </section>
              </div>
            </section>

            {(description || item.capacity || item.timezone) && (
              <section className="mt-12 grid gap-8 border-t border-[#e0e1e9] pt-10 lg:grid-cols-[minmax(0,1fr)_300px]" aria-labelledby="about-class-title">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7169d1]">About the class</p>
                  <h2 id="about-class-title" className="mt-2 font-[Georgia,serif] text-3xl leading-tight tracking-[-0.03em] text-[#303248]">A thoughtful space to learn and practice.</h2>
                  {description && <div className="mt-5 whitespace-pre-line text-[15px] leading-8 text-[#62667c]">{description}</div>}
                </div>
                <aside className="h-fit rounded-2xl border border-[#e2e3eb] bg-white p-5 shadow-[0_10px_28px_rgba(39,40,75,.05)]">
                  {item.capacity != null && <p className="flex items-center justify-between gap-4 border-b border-[#ececf2] pb-3 text-sm"><span className="text-[#85889a]">Capacity</span><strong className="text-[#3b3e56]">{item.capacity}</strong></p>}
                  {item.timezone && <p className="flex items-center justify-between gap-4 pt-3 text-sm"><span className="text-[#85889a]">Timezone</span><strong className="text-right text-[#3b3e56]">{item.timezone}</strong></p>}
                  {!item.capacity && !item.timezone && <p className="text-sm leading-6 text-[#74778c]">Class information and registration details will be updated here.</p>}
                </aside>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
