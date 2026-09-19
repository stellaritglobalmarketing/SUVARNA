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
          background: "#23412e",
        }}
      >
        <span style={{ color: "#d4a373", fontSize: 310, fontWeight: 700, fontFamily: "serif" }}>H</span>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
