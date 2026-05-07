import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            color: "#059669",
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: "-1px",
          }}
        >
          LD
        </div>
      </div>
    ),
    size
  );
}
