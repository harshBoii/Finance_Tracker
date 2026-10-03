import type { Mood } from "@/lib/finance";
import { cx } from "./ui";

/**
 * "Kobi", an original chibi coin-keeper in a pink hoodie.
 * happy = under budget, worried = getting close, dramatic = over.
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
      <g stroke="var(--line)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        {/* feet */}
        <ellipse cx="47" cy="122" rx="9" ry="5" fill="var(--hair)" />
        <ellipse cx="73" cy="122" rx="9" ry="5" fill="var(--hair)" />
        {/* hoodie body */}
        <path d="M33 98 Q35 84 60 84 Q85 84 87 98 L90 118 Q60 125 30 118 Z" fill="var(--pink)" />
        {/* coin emblem */}
        <circle cx="60" cy="104" r="9" fill="var(--yellow)" strokeWidth={2.5} />
        <text
          x="60"
          y="108.5"
          textAnchor="middle"
          fontSize="12"
          fontWeight="900"
          fill="var(--on-accent)"
          stroke="none"
          fontFamily="system-ui"
        >
          ₹
        </text>
        {/* arms */}
        {mood === "dramatic" ? (
          <>
            <path d="M34 96 Q20 86 22 72" fill="none" />
            <path d="M86 96 Q100 86 98 72" fill="none" />
          </>
        ) : (
          <>
            <path d="M35 98 Q26 104 28 112" fill="none" />
            <path d="M85 98 Q94 104 92 112" fill="none" />
          </>
        )}
        {/* head */}
        <circle cx="60" cy="55" r="38" fill="var(--skin)" />
        {/* hair */}
        <path
          d="M22 58 Q19 18 60 16 Q101 18 98 58 Q94 42 82 37 Q80 47 69 45 Q67 37 59 36 Q53 47 43 43 Q41 37 35 40 Q26 46 22 58 Z"
          fill="var(--hair)"
        />
        {/* ahoge */}
        <path d="M60 17 Q64 3 77 6 Q67 9 64 18" fill="var(--hair)" strokeWidth={2.5} />
      </g>

      {mood === "happy" && <HappyFace />}
      {mood === "worried" && <WorriedFace />}
      {mood === "dramatic" && <DramaticFace />}
    </svg>
  );
}

function Blush() {
  return (
    <g fill="var(--pink)" opacity={0.45}>
      <ellipse cx="37" cy="71" rx="6" ry="3.5" />
      <ellipse cx="83" cy="71" rx="6" ry="3.5" />
    </g>
  );
}

function HappyFace() {
  return (
    <g stroke="var(--line)" strokeLinecap="round" strokeLinejoin="round">
      <Blush />
      <path d="M38 62 Q45 52 52 62" fill="none" strokeWidth={3.5} />
      <path d="M68 62 Q75 52 82 62" fill="none" strokeWidth={3.5} />
      <path d="M51 72 Q60 84 69 72 Z" fill="#c43150" strokeWidth={2.5} />
      <g fill="var(--yellow)" strokeWidth={1.8}>
        <path className="anim-twinkle" d="M104 26 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" />
        <path
          className="anim-twinkle"
          style={{ animationDelay: "0.6s" }}
          d="M14 30 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2 Z"
        />
      </g>
    </g>
  );
}

function WorriedFace() {
  return (
    <g stroke="var(--line)" strokeLinecap="round" strokeLinejoin="round">
      <Blush />
      {/* brows, inner ends raised */}
      <path d="M37 50 L50 46" strokeWidth={3} />
      <path d="M83 50 L70 46" strokeWidth={3} />
      <ellipse cx="45" cy="61" rx="6.5" ry="8" fill="#fff" strokeWidth={2.5} />
      <ellipse cx="75" cy="61" rx="6.5" ry="8" fill="#fff" strokeWidth={2.5} />
      <circle cx="47" cy="63" r="3.6" fill="var(--hair)" stroke="none" />
      <circle cx="77" cy="63" r="3.6" fill="var(--hair)" stroke="none" />
      <circle cx="48.2" cy="61.6" r="1.2" fill="#fff" stroke="none" />
      <circle cx="78.2" cy="61.6" r="1.2" fill="#fff" stroke="none" />
      <path d="M51 78 q3 -4 6 0 t6 0 t6 0" fill="none" strokeWidth={2.5} />
      {/* sweat drop */}
      <path className="anim-drip" d="M95 38 Q101 47 95 50 Q89 47 95 38 Z" fill="var(--cyan)" strokeWidth={2} />
    </g>
  );
}

function DramaticFace() {
  return (
    <g stroke="var(--line)" strokeLinecap="round" strokeLinejoin="round">
      {/* gloom lines */}
      <g stroke="var(--violet)" strokeWidth={2} opacity={0.75}>
        <path d="M40 30 V44" />
        <path d="M48 27 V42" />
        <path d="M56 26 V40" />
        <path d="M64 26 V40" />
        <path d="M72 27 V42" />
        <path d="M80 30 V44" />
      </g>
      <path d="M36 47 L50 52" strokeWidth={3} />
      <path d="M84 47 L70 52" strokeWidth={3} />
      <circle cx="45" cy="61" r="8.5" fill="#fff" strokeWidth={2.5} />
      <circle cx="75" cy="61" r="8.5" fill="#fff" strokeWidth={2.5} />
      <circle cx="45" cy="61" r="1.8" fill="var(--hair)" stroke="none" />
      <circle cx="75" cy="61" r="1.8" fill="var(--hair)" stroke="none" />
      {/* waterfall tears */}
      <path d="M40 69 Q37 82 40 96" fill="none" stroke="var(--cyan)" strokeWidth={4.5} />
      <path d="M80 69 Q83 82 80 96" fill="none" stroke="var(--cyan)" strokeWidth={4.5} />
      <ellipse cx="60" cy="80" rx="7" ry="9" fill="#7a1f33" strokeWidth={2.5} />
      <text
        x="104"
        y="22"
        fontSize="20"
        fontWeight="900"
        fill="var(--red)"
        stroke="var(--line)"
        strokeWidth={1}
        fontFamily="system-ui"
      >
        !!
      </text>
    </g>
  );
}

export const moodLine: Record<Mood, string> = {
  happy: "Under budget! Keep it up~",
  worried: "Eek… we're getting close.",
  dramatic: "NOOO! We're over budget!!",
};
