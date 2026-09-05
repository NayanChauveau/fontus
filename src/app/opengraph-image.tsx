import { ImageResponse } from "next/og";

export const alt = "Fontus — qualité de l’eau du robinet en France";
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
          justifyContent: "center",
          padding: 80,
          background: "#0369a1",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>
          Fontus
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 56,
            fontWeight: 600,
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          Qualité de l’eau du robinet en France
        </div>
      </div>
    ),
    size,
  );
}
