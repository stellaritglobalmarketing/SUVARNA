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
          background: "#3d2b1c",
        }}
      >
        <span style={{ color: "#eab54a", fontSize: 108, fontWeight: 700, fontFamily: "serif" }}>S</span>
      </div>
    ),
    { ...size },
  );
}
