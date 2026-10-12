import { ImageResponse } from "next/og";
import { profile } from "@/content";

export const dynamic = "force-static";
export const alt = `${profile.name}, ${profile.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Source for app/opengraph-image.png (committed as a real PNG so static hosts serve it as image/png).
// To regenerate: move this file to app/, run `npm run build`, copy out/opengraph-image to
// app/opengraph-image.png, then move this file back here. Uses the default font (no network fetch).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: "radial-gradient(60% 70% at 30% 40%, rgba(99,102,241,0.35), rgba(11,15,25,0) 70%), #0b0f19",
          color: "#f1f5f9",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 115,
            left: 800,
            width: 400,
            height: 400,
            borderRadius: 400,
            border: "6px solid rgba(129,140,248,0.35)",
          }}
        />
        <div style={{ fontSize: 28, color: "#818cf8", letterSpacing: 6, textTransform: "uppercase" }}>
          {profile.location}
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1, marginTop: 12 }}>{profile.name}</div>
        <div style={{ fontSize: 40, marginTop: 20, color: "#c7d2fe" }}>{profile.headline}</div>
        <div style={{ fontSize: 28, marginTop: 28, color: "#94a3b8" }}>{profile.strengths.slice(0, 3).join("  ·  ")}</div>
      </div>
    ),
    size,
  );
}
