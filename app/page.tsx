import { contact, profile } from "@/content";
import { SITE_URL } from "@/lib/site";
import { SiteFooter, SiteHeader } from "@/ui/SiteHeader";
import { ContactSection } from "@/ui/sections/ContactSection";
import { ExperienceSection } from "@/ui/sections/ExperienceSection";
import { ProfileSection } from "@/ui/sections/ProfileSection";
import { ProjectsSection } from "@/ui/sections/ProjectsSection";
import { ResumeSection } from "@/ui/sections/ResumeSection";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.headline,
  url: SITE_URL,
  email: `mailto:${contact.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Lagos", addressCountry: "NG" },
  sameAs: [contact.github.href, contact.linkedin.href],
  knowsAbout: profile.strengths,
};

/**
 * Layer 1 (SPEC §3.1): the complete, server-rendered portfolio.
 * The 3D world mounts on top of this in Phase 3; this page stays the
 * SEO, accessibility, no-WebGL and "Classic view" surface.
 */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <ProfileSection />
        <ExperienceSection />
        <ProjectsSection />
        <ResumeSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        // Static, trusted data; escape "<" so the JSON can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
