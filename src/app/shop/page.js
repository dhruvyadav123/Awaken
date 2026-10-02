import Image from "next/image";

import AddToCartButton from "../../components/shop/AddToCartButton";
import { formatPrice, products } from "../../data/products";

export const metadata = {
  title: "Shop | Awaken With Me",
  description: "Digital books by Meheck for thoughtful and mindful moments.",
};

function LeafIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M19.5 3.5C13.8 4.1 8.9 6.7 6.3 11.2C4.8 13.7 4.5 16.3 5.1 19.2C7.9 19.2 10.3 18.4 12.3 16.7C15.8 13.8 17.8 9.3 19.5 3.5Z"
        fill="currentColor"
      />

      <path
        d="M5 21C7.1 15.5 10.2 11.5 15.8 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeaderLeaves() {
  return (
    <svg
      className="absolute right-0 top-[-18px] h-[190px] w-[150px] opacity-50 max-[700px]:hidden"
      viewBox="0 0 150 190"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M126 3C120 54 109 95 82 132C66 153 45 169 18 184"
        stroke="#819176"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M111 58C92 46 77 31 69 13C91 14 108 26 118 44C121 49 118 55 111 58Z"
        fill="#A8B39A"
      />

      <path
        d="M105 83C83 78 67 67 56 49C77 47 95 54 108 68C113 74 111 80 105 83Z"
        fill="#92A187"
      />

      <path
        d="M94 113C73 111 56 102 44 87C65 83 83 89 97 101C102 106 100 111 94 113Z"
        fill="#AEB8A1"
      />

      <path
        d="M78 140C59 140 43 134 30 122C47 115 65 119 80 128C85 132 84 138 78 140Z"
        fill="#8FA083"
      />

      <path
        d="M120 39C119 18 124 6 136 0C141 18 138 32 128 44C124 48 120 45 120 39Z"
        fill="#9BAA90"
      />

      <path
        d="M112 72C119 52 131 39 148 34C147 54 138 69 121 79C116 82 110 78 112 72Z"
        fill="#AAB5A0"
      />

      <path
        d="M100 103C111 85 125 75 143 73C138 92 126 105 108 111C102 113 97 109 100 103Z"
        fill="#899B80"
      />

      <path
        d="M84 134C99 118 114 111 131 112C124 130 111 141 93 145C87 146 81 140 84 134Z"
        fill="#ADB8A1"
      />
    </svg>
  );
}

export default function ShopPage() {
  const [book] = products;

  if (!book) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#fffefb] text-[#20352d]">
      {/* page intro */}
      <header className="relative overflow-hidden border-b border-[#e9ece5] bg-[#f4f5ef]">
        <HeaderLeaves />

        <div className="relative mx-auto w-[min(100%-48px,1370px)] py-10 max-[760px]:w-[min(100%-36px,560px)] max-[760px]:py-8 max-[380px]:w-[min(100%-28px,560px)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#315c4c] max-[600px]:text-[10px]">
            Awaken With Meheck
            <span className="px-3 text-[#97a297]">/</span>
            Shop
          </p>

          <div className="mt-5 flex items-end justify-between gap-10 max-[700px]:block">
            <div>
              <h1 className="font-[Georgia,serif] text-[58px] font-normal leading-[1.05] tracking-[-0.025em] text-[#16362c] max-[900px]:text-[50px] max-[700px]:text-[42px] max-[420px]:text-[36px]">
                Books by Meheck
              </h1>

              <p className="mt-3 font-[Georgia,serif] text-[20px] leading-8 text-[#626963] max-[700px]:text-[17px]">
                Digital reading for thoughtful moments.
              </p>
            </div>

            <p className="pb-2 font-[Georgia,serif] text-[15px] text-[#39453f] max-[700px]:mt-5 max-[700px]:pb-0">
              One digital title is currently listed.
            </p>
          </div>
        </div>
      </header>

      {/* product */}
      <section
        aria-labelledby="product-title"
        className="mx-auto w-[min(100%-48px,1370px)] py-[70px] max-[900px]:py-12 max-[760px]:w-[min(100%-36px,560px)] max-[380px]:w-[min(100%-28px,560px)]"
      >
        <article className="grid grid-cols-[minmax(340px,560px)_minmax(0,1fr)] items-center gap-[clamp(55px,8vw,120px)] max-[950px]:grid-cols-[minmax(300px,430px)_minmax(0,1fr)] max-[760px]:grid-cols-1 max-[760px]:gap-12">
          {/* book image */}
          <div className="relative mx-auto w-full max-w-[520px]">
            <div
              className="absolute left-[-10%] top-[-7%] h-[112%] w-[112%] rounded-[45%] bg-[#eef1e5] blur-[1px]"
              aria-hidden="true"
            />

            <div
              className="absolute bottom-[8%] left-[-4%] h-[230px] w-[180px] rotate-[-18deg] opacity-75"
              aria-hidden="true"
            >
              <svg viewBox="0 0 180 230" fill="none">
                <path
                  d="M94 222C91 168 88 116 103 38"
                  stroke="#4F6647"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M98 167C64 153 43 131 36 102C67 102 91 118 105 143"
                  fill="#647A57"
                />

                <path
                  d="M101 123C69 112 49 93 41 68C70 67 94 82 108 104"
                  fill="#879875"
                />

                <path
                  d="M103 82C80 66 68 47 68 25C91 34 106 50 111 71"
                  fill="#5E7552"
                />

                <path
                  d="M97 182C123 164 143 160 162 168C146 187 125 196 101 194"
                  fill="#879B76"
                />

                <path
                  d="M102 137C129 120 150 118 168 127C151 145 130 153 106 149"
                  fill="#526B49"
                />
              </svg>
            </div>

            <Image
              src={book.cover}
              alt={`Cover of ${book.title} by ${book.author}`}
              width={700}
              height={920}
              quality={90}
              priority
              className="relative z-10 mx-auto block h-auto w-[74%] rounded-[2px] object-cover shadow-[0_22px_55px_rgba(37,56,43,0.20)] max-[760px]:w-[78%]"
            />
          </div>

          {/* information */}
          <div className="max-w-[650px]">
            <p className="inline-flex items-center gap-3 rounded-full bg-[#f0f2ec] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.20em] text-[#294b3d]">
              <span className="h-[8px] w-[8px] rounded-full bg-[#33725b]" />
              {book.format}
            </p>

            <h2
              id="product-title"
              className="mt-6 text-balance font-[Georgia,serif] text-[58px] font-normal leading-[1.08] tracking-[-0.025em] text-[#15362c] max-[1000px]:text-[48px] max-[760px]:text-[42px] max-[420px]:text-[35px]"
            >
              {book.title}
            </h2>

            <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#44574d]">
              By {book.author}
            </p>

            <p className="mt-7 max-w-[620px] font-[Georgia,serif] text-[18px] leading-[1.75] text-[#4d5651] max-[700px]:text-[16px]">
              {book.description}
            </p>

            {/* price */}
            <div className="mt-9 grid grid-cols-2 border-y border-[#dfe4dd] py-6 max-[460px]:grid-cols-1">
              <div className="pr-8 max-[460px]:border-b max-[460px]:border-[#dfe4dd] max-[460px]:pb-5">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.20em] text-[#5e6a63]">
                  Price
                </span>

                <strong className="mt-2 block font-[Georgia,serif] text-[42px] font-normal leading-none text-[#13372c]">
                  {formatPrice(book)}
                </strong>
              </div>

              <div className="border-l border-[#dfe4dd] pl-10 max-[460px]:border-l-0 max-[460px]:pl-0 max-[460px]:pt-5">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.20em] text-[#5e6a63]">
                  Format
                </span>

                <span className="mt-4 block font-[Georgia,serif] text-[20px] text-[#263b32]">
                  Digital eBook
                </span>
              </div>
            </div>

            {/* cart */}
            <div className="mt-6 flex items-center gap-10 max-[560px]:items-start max-[560px]:gap-5">
              <AddToCartButton productId={book.id} />

              <div className="flex items-center gap-3 whitespace-nowrap text-[13px] text-[#727b75] max-[460px]:whitespace-normal">
                <span className="text-[#2f7558]">
                  <LeafIcon />
                </span>
                No shipping required
              </div>
            </div>

            <p className="mt-5 max-w-[620px] font-[Georgia,serif] text-[14px] leading-6 text-[#777f79]">
              Online checkout and digital delivery are not available yet. You
              can save this title in your cart.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}