import { ImageResponse } from "next/og";

// Literal colors: CSS variables don't exist inside a rasterised data-URI SVG.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde4ee"/><stop offset="1" stop-color="#e2eefe"/></linearGradient></defs>
<rect width="120" height="120" fill="url(#bg)"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<g stroke="#3d2f3a" stroke-width="7"><path d="M38 52 C32 44 26 38 19 31"/><path d="M26 39 C22 38 17 39 13 41"/><path d="M22 35 C22 29 20 24 17 20"/><path d="M82 52 C88 44 94 38 101 31"/><path d="M94 39 C98 38 103 39 107 41"/><path d="M98 35 C98 29 100 24 103 20"/></g>
<g stroke="#b98a5c" stroke-width="4"><path d="M38 52 C32 44 26 38 19 31"/><path d="M26 39 C22 38 17 39 13 41"/><path d="M22 35 C22 29 20 24 17 20"/><path d="M82 52 C88 44 94 38 101 31"/><path d="M94 39 C98 38 103 39 107 41"/><path d="M98 35 C98 29 100 24 103 20"/></g>
</g>
<g stroke="#3d2f3a" stroke-width="2.4" stroke-linejoin="round">
<path d="M36 70 Q21 62 14 68 Q22 77 37 78 Z" fill="#9b6542"/><path d="M84 70 Q99 62 106 68 Q98 77 83 78 Z" fill="#9b6542"/>
<ellipse cx="60" cy="78" rx="28" ry="26" fill="#9b6542"/>
<path d="M32 57 C29 41 34 22 60 20 C86 22 91 41 88 57 Z" fill="#f48fb5"/>
<ellipse cx="60" cy="57" rx="33" ry="6.5" fill="#d9628f"/>
<g fill="#fff" stroke-width="1.6"><rect x="51" y="35.5" width="18" height="5.5" rx="2.75" transform="rotate(45 60 38.25)"/><rect x="51" y="35.5" width="18" height="5.5" rx="2.75" transform="rotate(-45 60 38.25)"/></g>
</g>
<g fill="#1d1620"><ellipse cx="49" cy="76" rx="5.4" ry="6.8"/><ellipse cx="71" cy="76" rx="5.4" ry="6.8"/></g>
<g fill="#fff"><circle cx="51" cy="73" r="2.3"/><circle cx="73" cy="73" r="2.3"/></g>
<ellipse cx="60" cy="87" rx="6.4" ry="4.6" fill="#4a8de0" stroke="#3d2f3a" stroke-width="2"/>
<path d="M53 93 Q60 101 67 93 Q60 96 53 93 Z" fill="#c2405f" stroke="#3d2f3a" stroke-width="1.6"/>
<g fill="#ef7aa6" opacity=".5"><ellipse cx="39" cy="86" rx="5" ry="2.8"/><ellipse cx="81" cy="86" rx="5" ry="2.8"/></g>
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
