import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0369a1",
          borderRadius: 40,
        }}
      >
        <svg width="132" height="132" viewBox="0 0 32 32">
          <path
            fill="#ffffff"
            d="M16 6c.15 0 6.1 8.2 6.1 12.8a6.1 6.1 0 1 1-12.2 0C9.9 14.2 15.85 6 16 6z"
          />
          <ellipse
            cx="13.7"
            cy="14.4"
            rx="1.3"
            ry="2.1"
            fill="#7dd3fc"
            transform="rotate(-30 13.7 14.4)"
          />
        </svg>
      </div>
    ),
    size,
  );
}
