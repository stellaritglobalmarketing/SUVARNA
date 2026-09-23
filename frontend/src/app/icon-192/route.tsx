import { ImageResponse } from "next/og";

export async function GET() {
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
        <span style={{ color: "#eab54a", fontSize: 116, fontWeight: 700, fontFamily: "serif" }}>S</span>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
