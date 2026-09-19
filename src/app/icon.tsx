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
          background: "#23412e",
          borderRadius: 7,
        }}
      >
        <span style={{ color: "#d4a373", fontSize: 21, fontWeight: 700, fontFamily: "serif" }}>H</span>
      </div>
    ),
    { ...size },
  );
}
