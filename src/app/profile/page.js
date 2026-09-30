```jsx
import Link from "next/link";

export const metadata = {
  title: "Your Profile | Awaken With Me",
  description:
    "Sign in to manage your profile, classes, bookings, and preferences.",
};

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoticeIcon() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d5ad4f] text-[16px] font-semibold text-white"
      aria-hidden="true"
    >
      !
    </span>
  );
}

function BookIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7.5C7.8 6.2 12.1 7 16 10V26C12.1 23 7.8 22.2 4 23.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M28 7.5C24.2 6.2 19.9 7 16 10V26C19.9 23 24.2 22.2 28 23.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileArtwork() {
  return (
    <div
      className="relative mx-auto flex h-[455px] w-full max-w-[590px] items-center justify-center max-[900px]:h-[390px] max-[600px]:h-[320px]"
      aria-hidden="true"
    >
      {/* soft watercolor background */}
      <div className="absolute left-[11%] top-[12%] h-[330px] w-[330px] rounded-full bg-[#f1f3e8] opacity-90 blur-[1px] max-[600px]:h-[250px] max-[600px]:w-[250px]" />

      <div className="absolute right-[8%] top-[22%] h-[290px] w-[310px] rounded-[48%] bg-[#edf1e5] opacity-85 max-[600px]:h-[220px] max-[600px]:w-[230px]" />

      {/* left botanical branch */}
      <svg
        className="absolute left-[5%] top-[5%] h-[390px] w-[220px] max-[600px]:h-[300px] max-[600px]:w-[165px]"
        viewBox="0 0 220 390"
        fill="none"
      >
        <path
          d="M118 353C104 284 92 222 93 151C94 102 102 61 116 22"
          stroke="#536c48"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M101 292C67 276 48 249 42 216C72 218 97 235 110 263"
          fill="#94a47b"
        />

        <path
          d="M96 239C66 222 49 198 48 169C76 174 96 192 107 216"
          fill="#778c64"
        />

        <path
          d="M96 180C66 166 49 145 45 118C72 119 95 135 107 158"
          fill="#a6b38b"
        />

        <path
          d="M98 127C79 103 73 76 79 50C101 66 113 90 111 116"
          fill="#71865d"
        />

        <path
          d="M113 82C109 57 116 35 131 18C142 41 138 64 122 85"
          fill="#9aaa80"
        />

        <path
          d="M108 307C132 285 156 279 181 282C167 307 145 320 116 321"
          fill="#81956e"
        />

        <path
          d="M104 251C133 233 157 232 180 242C161 261 137 270 110 266"
          fill="#9fae8b"
        />

        <path
          d="M102 196C129 178 151 177 173 185C156 207 133 214 107 210"
          fill="#748a62"
        />

        <path
          d="M101 144C125 125 146 123 166 130C151 151 130 160 105 157"
          fill="#a2b08d"
        />
      </svg>

      {/* right botanical branch */}
      <svg
        className="absolute right-[1%] bottom-[3%] h-[330px] w-[220px] max-[600px]:h-[245px] max-[600px]:w-[160px]"
        viewBox="0 0 220 330"
        fill="none"
      >
        <path
          d="M35 304C71 262 94 220 110 173C125 130 137 87 154 37"
          stroke="#49633e"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M68 263C51 233 50 209 58 187C80 204 89 228 82 255"
          fill="#7b9068"
        />

        <path
          d="M94 218C77 187 79 163 90 143C110 161 117 185 108 211"
          fill="#9aaa83"
        />

        <path
          d="M116 166C105 138 110 114 123 96C142 116 146 139 134 162"
          fill="#6d835c"
        />

        <path
          d="M144 101C138 76 144 56 158 40C173 60 173 82 160 102"
          fill="#a6b690"
        />

        <path
          d="M78 274C111 269 134 277 151 294C122 305 96 300 75 284"
          fill="#9ead89"
        />

        <path
          d="M103 230C133 225 156 233 171 250C143 260 120 255 100 241"
          fill="#748b63"
        />

        <path
          d="M126 181C154 176 174 184 188 200C163 209 141 204 123 191"
          fill="#9aaa83"
        />

        <path
          d="M145 130C168 124 189 130 202 143C181 155 161 151 143 140"
          fill="#70865e"
        />
      </svg>

      {/* small sparkles */}
      <svg
        className="absolute right-[12%] top-[8%] h-16 w-16"
        viewBox="0 0 64 64"
        fill="none"
      >
        <path
          d="M20 3L24 15L36 20L24 24L20 37L16 24L4 20L16 15L20 3Z"
          fill="#d7b45e"
        />

        <path
          d="M50 28L53 37L62 40L53 43L50 52L47 43L38 40L47 37L50 28Z"
          fill="#e0c675"
        />
      </svg>

      {/* profile card */}
      <div className="relative z-10 mt-6 flex h-[305px] w-[225px] flex-col items-center rounded-[17px] border border-[#e4e8df] bg-[#fffefb]/95 px-7 py-11 shadow-[0_18px_50px_rgba(58,76,60,0.10)] max-[600px]:h-[240px] max-[600px]:w-[180px] max-[600px]:py-8">
        <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#8da27f] max-[600px]:h-[68px] max-[600px]:w-[68px]">
          <div className="absolute top-[18px] h-[28px] w-[28px] rounded-full bg-white max-[600px]:top-[14px] max-[600px]:h-[22px] max-[600px]:w-[22px]" />

          <div className="absolute bottom-[15px] h-[26px] w-[52px] rounded-t-[30px] bg-white max-[600px]:bottom-[11px] max-[600px]:h-[22px] max-[600px]:w-[42px]" />
        </div>

        <div className="mt-8 h-[8px] w-[145px] rounded-full bg-[#c8d0bd] max-[600px]:mt-6 max-[600px]:w-[115px]" />

        <div className="mt-5 h-[8px] w-[145px] rounded-full bg-[#c8d0bd] max-[600px]:mt-4 max-[600px]:w-[115px]" />

        <div className="mt-5 h-[8px] w-[110px] rounded-full bg-[#c8d0bd] max-[600px]:mt-4 max-[600px]:w-[85px]" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#fffefb] text-[#25352e]">
      <section className="border-b border-[#edf0eb]">
        <div className="mx-auto grid w-[min(100%-48px,1360px)] grid-cols-[minmax(0,1fr)_minmax(430px,0.9fr)] items-center gap-10 py-16 max-[1050px]:grid-cols-[minmax(0,1fr)_420px] max-[900px]:grid-cols-1 max-[900px]:gap-4 max-[900px]:py-12 max-[600px]:w-[min(100%-32px,1360px)]">
          {/* left content */}
          <div className="max-w-[680px]">
            <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#315c4c]">
              Your space
            </p>

            <h1 className="font-[Georgia,serif] text-[64px] font-normal leading-[1.08] tracking-[-0.03em] text-[#17372d] max-[1100px]:text-[56px] max-[700px]:text-[46px] max-[480px]:text-[40px]">
              Your learning space.
            </h1>

            <p className="mt-6 max-w-[650px] font-[Georgia,serif] text-[22px] leading-[1.55] text-[#3e4943] max-[700px]:text-[18px]">
              Sign in to manage your profile, classes, bookings, and preferences.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/auth/login"
                className="inline-flex min-h-[58px] min-w-[235px] items-center justify-between gap-8 rounded-[5px] bg-[#245640] px-7 font-[Georgia,serif] text-[18px] text-white transition duration-200 hover:bg-[#1b4533] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315c4c]"
              >
                Sign in
                <ArrowIcon />
              </Link>

              <Link
                href="/auth/register"
                className="inline-flex min-h-[58px] min-w-[270px] items-center justify-between gap-8 rounded-[5px] border border-[#244c3b] bg-white px-7 font-[Georgia,serif] text-[18px] text-[#213c32] transition duration-200 hover:bg-[#f5f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315c4c]"
              >
                Create an account
                <ArrowIcon />
              </Link>
            </div>

            <div className="mt-8 flex max-w-[665px] items-start gap-5 rounded-[6px] bg-[#fff8e7] px-6 py-5">
              <NoticeIcon />

              <p className="pt-[2px] font-[Georgia,serif] text-[16px] leading-[1.55] text-[#343b36]">
                Account services are not connected yet. No profile data is being
                collected.
              </p>
            </div>
          </div>

          {/* right image */}
          <ProfileArtwork />
        </div>
      </section>

      {/* bottom information card */}
      <section className="mx-auto w-[min(100%-48px,1360px)] py-14 max-[600px]:w-[min(100%-32px,1360px)] max-[600px]:py-9">
        <div className="flex items-start gap-7 rounded-[8px] border border-[#e2e7e1] bg-white px-10 py-10 shadow-[0_6px_24px_rgba(41,63,48,0.03)] max-[700px]:px-6 max-[700px]:py-7 max-[560px]:flex-col max-[560px]:gap-5">
          <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-full bg-[#f0f3e8] text-[#285a47]">
            <BookIcon />
          </div>

          <div className="pt-1">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#315c4c]">
              What belongs here
            </p>

            <h2 className="font-[Georgia,serif] text-[31px] font-normal leading-[1.25] text-[#17372d] max-[700px]:text-[26px]">
              Once account services are connected,
            </h2>

            <p className="mt-2 font-[Georgia,serif] text-[20px] leading-[1.6] text-[#48524d] max-[700px]:text-[17px]">
              this space can bring your learning and bookings together in one
              place.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
```