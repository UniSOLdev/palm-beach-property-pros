import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — Palm Beach County property cleaning and care`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
          background: "linear-gradient(145deg, #0c2340 0%, #081a2e 55%, #0a3d5c 100%)",
          color: "#f8f6f1",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#7ec8e3",
            marginBottom: 16,
          }}
        >
          Palm Beach County
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 28, marginTop: 20, color: "rgba(248,246,241,0.88)", maxWidth: 820 }}>
          Cleaning, property care, recurring maintenance &amp; mobile detailing
        </div>
      </div>
    ),
    { ...size },
  );
}
