import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import NavbarServer from "@/components/NavbarServer";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

function matchesDomain(host: string, domain: string | undefined): boolean {
  if (!domain) return false;
  const hostname = host.split(":")[0];
  const prefix = domain.split(".")[0];
  return hostname === domain || hostname.startsWith(prefix + ".");
}

export const metadata: Metadata = {
  title: {
    default: "B2World - India's Growing Online Marketplace",
    template: "%s | B2World",
  },
  description:
    "Shop from lakhs of products across fashion, electronics, mobiles, beauty, grocery & more on B2World. Secure payments, easy returns, and pan-India delivery.",
  keywords: [
    "B2World",
    "online shopping",
    "ecommerce India",
    "buy online",
    "fashion",
    "electronics",
    "mobiles",
    "grocery",
  ],
  openGraph: {
    type: "website",
    siteName: "B2World",
    title: "B2World - India's Growing Online Marketplace",
    description:
      "Shop from lakhs of products. Secure payments, easy returns, and pan-India delivery.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const hideMainUI = matchesDomain(host, process.env.ADMIN_DOMAIN) || matchesDomain(host, process.env.SELLER_DOMAIN);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          {!hideMainUI && <NavbarServer />}
          <main className="flex-1 min-h-screen">{children}</main>
          {!hideMainUI && <Footer />}
        </LanguageProvider>
      </body>
    </html>
  );
}