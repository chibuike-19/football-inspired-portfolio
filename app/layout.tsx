import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Iceland } from "next/font/google";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import { profile } from "@/content";
import "./globals.css";

/** Display face: names, headings, nav and labels. Single weight (400). */
const iceland = Iceland({ variable: "--font-iceland", subsets: ["latin"], weight: "400" });
/** Body text: Iceland is too condensed for paragraphs. */
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
/** Terminal-style tags, status lines and code-ish labels. */
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
  themeColor: "#0b0f19",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${iceland.variable} ${geist.variable} ${geistMono.variable} antialiased`}>
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
