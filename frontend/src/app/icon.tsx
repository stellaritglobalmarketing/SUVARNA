import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <span style={{ color: "#eab54a", fontSize: 21, fontWeight: 700, fontFamily: "serif" }}>S</span>
      </div>
    ),
    { ...size },
  );
}
