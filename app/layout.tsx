import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import { profile } from "@/content";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s — ${profile.name}` },
  description: SITE_DESCRIPTION,
  authors: [{ name: profile.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: profile.name,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#0b0f0d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        {/* Every page renders a <main id="main">. */}
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-accent px-4 py-2 font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
