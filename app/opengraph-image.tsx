import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "The Library, a private collection";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const font = await readFile(join(process.cwd(), "public/fonts/CormorantGaramond-Medium.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#14211c",
          color: "#f3e6cc",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 8, color: "#b08d57" }}>A PRIVATE COLLECTION</div>
        <div style={{ display: "flex", fontSize: 108, lineHeight: 0.9, marginTop: 16 }}>The Library</div>
        <div style={{ display: "flex", fontSize: 32, color: "#d9cbb4", marginTop: 18 }}>
          Dark wood, green walls, and the books I return to.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Cormorant Garamond", data: font, weight: 500, style: "normal" }],
    },
  );
}
