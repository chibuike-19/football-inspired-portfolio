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
          background: "linear-gradient(135deg, #0b0f0d 0%, #123a22 60%, #1f7a3e 100%)",
          color: "#f3f5f4",
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
            border: "6px solid rgba(255,255,255,0.18)",
          }}
        />
        <div style={{ fontSize: 28, color: "#f5b544", letterSpacing: 6, textTransform: "uppercase" }}>
          {profile.location}
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1, marginTop: 12 }}>{profile.name}</div>
        <div style={{ fontSize: 40, marginTop: 20, color: "#d8dedb" }}>{profile.headline}</div>
        <div style={{ fontSize: 28, marginTop: 28, color: "#9aa6a0" }}>{profile.strengths.slice(0, 3).join("  ·  ")}</div>
      </div>
    ),
    size,
  );
}
