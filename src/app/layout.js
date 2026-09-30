import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { ContactPopupProvider } from "../components/common/ContactPopup";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Awaken With Me | Find your space to grow",
  description: "Explore thoughtful workshops, classes, and practices to reconnect with yourself.",
};

export default function RootLayout({ children }) {
  return <html lang="en" className={geistSans.variable + " " + geistMono.variable + " h-full antialiased"}>
    <body className="min-h-full flex flex-col">
      <ContactPopupProvider><a className="awm-skip-link" href="#main-content">Skip to content</a><Navbar /><main id="main-content" className="site-main">{children}</main><Footer /></ContactPopupProvider>
    </body>
  </html>;
}
