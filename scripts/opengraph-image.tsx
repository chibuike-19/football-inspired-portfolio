/**
 * Source for public/og-image.png, the social preview thumbnail (1200 × 630).
 * Regenerate after changing the name, headline or photo:
 *   1. copy this file to app/opengraph-image.tsx
 *   2. npm run build   (needs network: it fetches the Iceland font)
 *   3. cp out/opengraph-image public/og-image.png
 *   4. delete app/opengraph-image.tsx
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function iceland(): Promise<ArrayBuffer> {
  // Without a browser user agent, Google Fonts serves TTF, which the image renderer needs.
  const css = await (await fetch("https://fonts.googleapis.com/css2?family=Iceland")).text();
  const url = css.match(/src: url\((.+?)\)/)?.[1];
  if (!url) throw new Error("Iceland font URL not found");
  return (await fetch(url)).arrayBuffer();
}

export default async function OpengraphImage() {
  const [font, photo] = await Promise.all([iceland(), readFile(join(process.cwd(), "public/avatar.jpg"))]);
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const grid = "rgba(148,163,184,0.08)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 80px",
          gap: 64,
          color: "#f1f5f9",
          background: "#0b0f19",
          backgroundImage: [
            "radial-gradient(55% 75% at 22% 40%, rgba(99,102,241,0.35), rgba(11,15,25,0) 70%)",
            "radial-gradient(40% 50% at 85% 80%, rgba(56,189,248,0.12), rgba(11,15,25,0) 70%)",
            `linear-gradient(to right, ${grid} 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${grid} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: "100% 100%, 100% 100%, 64px 64px, 64px 64px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: "#94a3b8", fontFamily: "Iceland", letterSpacing: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#34d399" }} />
            {`${profile.location.toUpperCase()}  ·  PORTFOLIO`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 22, fontFamily: "Iceland", fontSize: 104, lineHeight: 0.9, letterSpacing: 4 }}>
            {profile.name
              .toUpperCase()
              .split(" ")
              .map((part) => (
                <span key={part}>{part}</span>
              ))}
          </div>
          <div style={{ display: "flex", marginTop: 26, fontFamily: "Iceland", fontSize: 44, letterSpacing: 6, color: "#818cf8" }}>
            {profile.headline.toUpperCase()}
          </div>
          <div style={{ display: "flex", marginTop: 30, gap: 12 }}>
            {["Next.js", "React", "TypeScript", "Node.js"].map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  border: "1px solid rgba(148,163,184,0.3)",
                  fontSize: 22,
                  color: "#cbd5e1",
                  letterSpacing: 2,
                }}
              >
                {tag.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* ImageResponse renders plain <img>; next/image does not apply here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={photoSrc}
            width={300}
            height={300}
            style={{ border: "4px solid #6366f1", boxShadow: "0 0 80px rgba(99,102,241,0.6)", objectFit: "cover" }}
          />
          <div style={{ display: "flex", marginTop: 18, fontSize: 22, color: "#818cf8", letterSpacing: 3, border: "1px solid rgba(99,102,241,0.5)", padding: "4px 12px" }}>
            [SENIOR_FSE]
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Iceland", data: font, weight: 400, style: "normal" }] },
  );
}
