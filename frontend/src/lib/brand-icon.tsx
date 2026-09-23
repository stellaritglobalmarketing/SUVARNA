import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export async function brandIcon(size: number) {
  const logo = await readFile(path.join(process.cwd(), "public/logo-background.png"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f1e3" }}>
      {/* ImageResponse renders plain image elements, not next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${logo.toString("base64")}`} alt="Suvarna7" width={size} height={size / 2} />
    </div>,
    { width: size, height: size },
  );
}
