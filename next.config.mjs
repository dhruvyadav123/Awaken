/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/profile", destination: "/dashboard", permanent: false },
      ...[["digital-library", "digital-library"], ["courses", "courses"], ["classes", "workshops"], ["sessions", "bookings"], ["orders", "orders"], ["certificates", "certificates"], ["questions", "community"], ["notifications", "notifications"], ["details", "profile"], ["payments", "payments"], ["refunds", "refunds"], ["membership", "membership"], ["quizzes", "quizzes"], ["meditations", "meditations"], ["reviews", "reviews"], ["addresses", "addresses"], ["badges", "badges"]].map(([source, target]) => ({ source: `/profile/${source}/:path*`, destination: `/dashboard/user/${target}/:path*`, permanent: false })),
    ];
  },
  images: {
    qualities: [75, 90],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
