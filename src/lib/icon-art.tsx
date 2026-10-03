import { ImageResponse } from "next/og";

// Literal colors: CSS variables don't exist inside a rasterised data-URI SVG.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<rect width="120" height="120" fill="#ffc61a"/>
<g fill="none" stroke="#141414" stroke-width="2.2" opacity=".18">${Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  return `<path d="M60 60 L${(60 + 90 * Math.cos(a)).toFixed(1)} ${(60 + 90 * Math.sin(a)).toFixed(1)}"/>`;
}).join("")}</g>
<g stroke="#141414" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
<circle cx="60" cy="66" r="36" fill="#ffe2cc"/>
<path d="M24 68 Q21 30 60 28 Q99 30 96 68 Q92 52 81 48 Q79 57 69 55 Q67 48 59 47 Q53 57 44 53 Q42 48 36 51 Q28 56 24 68 Z" fill="#2a2238"/>
<path d="M60 29 Q64 15 77 18 Q67 21 64 30" fill="#2a2238"/>
<path d="M40 72 Q46 63 52 72" fill="none" stroke-width="3.8"/>
<path d="M68 72 Q74 63 80 72" fill="none" stroke-width="3.8"/>
<path d="M52 81 Q60 92 68 81 Z" fill="#c43150" stroke-width="2.6"/>
</g>
<g fill="#ff2e74" opacity=".5"><ellipse cx="38" cy="81" rx="6" ry="3.5"/><ellipse cx="82" cy="81" rx="6" ry="3.5"/></g>
</svg>`;

const SRC = `data:image/svg+xml;base64,${Buffer.from(SVG).toString("base64")}`;

export function iconImage(px: number) {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={SRC} width={px} height={px} alt="" />
    ),
    { width: px, height: px },
  );
}
