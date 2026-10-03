import type { Mood } from "@/lib/finance";
import { cx } from "./ui";

/**
 * Chibi reindeer doctor (fan art, personal use): pink top hat with a white X, antlers, blue nose.
 * happy = under budget, worried = getting close, dramatic = over (waterfall tears).
 */
export function Mascot({ mood, size = 96, className }: { mood: Mood; size?: number; className?: string }) {
  const anim = mood === "happy" ? "anim-bob" : mood === "worried" ? "anim-wobble" : "anim-shake";
  return (
    <svg
      viewBox="0 0 120 130"
      width={size}
      height={size * (130 / 120)}
      className={cx(anim, "overflow-visible", className)}
      role="img"
      aria-label={`Mascot looks ${mood}`}
    >
      <Antlers />
      <Body raised={mood === "dramatic"} />

      <g stroke="var(--outline)" strokeWidth={2.4} strokeLinejoin="round">
        {/* ears */}
        <path d="M34 62 Q18 53 11 59 Q19 69 35 71 Z" fill="var(--fur)" />
        <path d="M86 62 Q102 53 109 59 Q101 69 85 71 Z" fill="var(--fur)" />
        <path d="M31 64 Q21 59 17 61 Q23 66 31 67 Z" fill="var(--muzzle)" strokeWidth={0} />
        <path d="M89 64 Q99 59 103 61 Q97 66 89 67 Z" fill="var(--muzzle)" strokeWidth={0} />
        {/* head */}
        <ellipse cx="60" cy="69" rx="29" ry="27" fill="var(--fur)" />
      </g>

      <Hat />

      {mood === "happy" && <HappyFace />}
      {mood === "worried" && <WorriedFace />}
      {mood === "dramatic" && <DramaticFace />}
    </svg>
  );
}

const ANTLER = [
  "M36 46 C30 37 23 30 15 22",
  "M23 31 C19 30 14 31 9 33",
  "M18 26 C18 20 16 15 12 10",
];

function Antlers() {
  const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${120 - Number(x)} ${y}`);
  const all = [...ANTLER, ...ANTLER.map(mirror)];
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {all.map((d) => (
        <path key={`o${d}`} d={d} stroke="var(--outline)" strokeWidth={7.5} />
      ))}
      {all.map((d) => (
        <path key={`f${d}`} d={d} stroke="var(--antler)" strokeWidth={4.2} />
      ))}
    </g>
  );
}

function Hat() {
  return (
    <g stroke="var(--outline)" strokeWidth={2.4} strokeLinejoin="round">
      <path d="M33 47 C31 29 32 5 60 3 C88 5 89 29 87 47 Z" fill="var(--hat)" />
      <path d="M40 40 C38 26 40 14 48 9" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx="60" cy="47" rx="32" ry="6" fill="var(--hat-dark)" />
      {/* white X */}
      <g fill="#fff" strokeWidth={1.6}>
        <rect x="51" y="22.5" width="18" height="5.5" rx="2.75" transform="rotate(45 60 25.25)" />
        <rect x="51" y="22.5" width="18" height="5.5" rx="2.75" transform="rotate(-45 60 25.25)" />
      </g>
    </g>
  );
}

function Body({ raised }: { raised: boolean }) {
  return (
    <g stroke="var(--outline)" strokeWidth={2.4} strokeLinejoin="round">
      <ellipse cx="50" cy="122" rx="6.5" ry="3.8" fill="var(--fur-dark)" />
      <ellipse cx="70" cy="122" rx="6.5" ry="3.8" fill="var(--fur-dark)" />
      <ellipse cx="60" cy="105" rx="19" ry="15" fill="var(--fur)" />
      <path d="M42 107 Q60 101 78 107 L79 116 Q70 120 62 116 L58 116 Q50 120 41 116 Z" fill="var(--violet)" />
      {raised ? (
        <>
          <path d="M43 98 Q33 90 31 80" fill="none" stroke="var(--fur)" strokeWidth={7} strokeLinecap="round" />
          <path d="M77 98 Q87 90 89 80" fill="none" stroke="var(--fur)" strokeWidth={7} strokeLinecap="round" />
          <circle cx="31" cy="79" r="3.6" fill="var(--fur-dark)" />
          <circle cx="89" cy="79" r="3.6" fill="var(--fur-dark)" />
        </>
      ) : (
        <>
          <ellipse cx="41" cy="104" rx="5" ry="7.5" fill="var(--fur)" transform="rotate(25 41 104)" />
          <ellipse cx="79" cy="104" rx="5" ry="7.5" fill="var(--fur)" transform="rotate(-25 79 104)" />
          <circle cx="38" cy="110" r="3" fill="var(--fur-dark)" />
          <circle cx="82" cy="110" r="3" fill="var(--fur-dark)" />
        </>
      )}
    </g>
  );
}

function Nose() {
  return (
    <g>
      <ellipse cx="60" cy="78" rx="6.6" ry="4.8" fill="var(--nose)" stroke="var(--outline)" strokeWidth={2} />
      <ellipse cx="57.8" cy="76.6" rx="2.1" ry="1.2" fill="#fff" opacity={0.75} />
    </g>
  );
}

function Eyes({ small = false }: { small?: boolean }) {
  return (
    <g>
      {[48, 72].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="66" rx="5.6" ry="7" fill="#1d1620" />
          <circle cx={x + 2} cy="63" r={small ? 1.6 : 2.4} fill="#fff" />
          <circle cx={x - 2} cy="69.5" r={small ? 0.8 : 1.2} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Blush() {
  return (
    <g fill="var(--pink)" opacity={0.5}>
      <ellipse cx="38" cy="77" rx="5.5" ry="3" />
      <ellipse cx="82" cy="77" rx="5.5" ry="3" />
    </g>
  );
}

function HappyFace() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <Blush />
      <Eyes />
      <Nose />
      <path d="M52 84 Q60 94 68 84 Q60 87 52 84 Z" fill="#c2405f" stroke="var(--outline)" strokeWidth={1.8} />
      <g fill="var(--yellow)" stroke="var(--outline)" strokeWidth={1.2}>
        <path className="anim-twinkle" d="M106 34 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 Z" />
        <path
          className="anim-twinkle"
          style={{ animationDelay: "0.7s" }}
          d="M12 44 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 Z"
        />
      </g>
    </g>
  );
}

function WorriedFace() {
  return (
    <g stroke="var(--outline)" strokeLinecap="round" strokeLinejoin="round">
      <Blush />
      <path d="M42 57 L53 54" strokeWidth={2.4} />
      <path d="M78 57 L67 54" strokeWidth={2.4} />
      <Eyes small />
      <Nose />
      <path d="M52 88 q2 -3 4 0 t4 0 t4 0 t4 0" fill="none" strokeWidth={2} />
      <path className="anim-drip" d="M93 52 Q99 61 93 64 Q87 61 93 52 Z" fill="var(--cyan)" strokeWidth={1.6} />
    </g>
  );
}

function DramaticFace() {
  return (
    <g stroke="var(--outline)" strokeLinecap="round" strokeLinejoin="round">
      {/* > < squeezed eyes */}
      <path d="M43 61 L53 66 L43 71" fill="none" strokeWidth={3} />
      <path d="M77 61 L67 66 L77 71" fill="none" strokeWidth={3} />
      {/* waterfall tears */}
      <path d="M45 72 Q41 86 44 104" fill="none" stroke="var(--cyan)" strokeWidth={5.5} opacity={0.9} />
      <path d="M75 72 Q79 86 76 104" fill="none" stroke="var(--cyan)" strokeWidth={5.5} opacity={0.9} />
      <Nose />
      <ellipse cx="60" cy="89" rx="7.5" ry="6.5" fill="#7a1f33" strokeWidth={2} />
      <ellipse cx="60" cy="92.5" rx="4" ry="2.2" fill="#e5788f" stroke="none" />
    </g>
  );
}

export const moodLine: Record<Mood, string> = {
  happy: "Under budget! Doctor's orders: keep it up~",
  worried: "Eek… we're getting close!",
  dramatic: "WAAAH! We're over budget!!",
};
