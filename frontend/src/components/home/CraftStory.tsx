"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Decorative band under the hero: a faint, single-tone frieze of village craft that slowly drifts
 * sideways. One scene per product family: milking, boiling and churning for ghee, then honey,
 * saffron and the nut orchards. Each figure has its own small loop (globals.css, `craft-*`).
 * It is purely decorative (no copy, hidden from screen readers), only animates while on screen,
 * and stands still for reduced-motion users.
 */
export function CraftStory() {
  const bandRef = useRef<HTMLDivElement>(null);
  const [isActive, setActive] = useState(false);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    observer.observe(band);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={bandRef} className="craft-band" data-active={isActive || undefined} aria-hidden="true">
      <div className="craft-track">
        <Frieze />
        <Frieze />
      </div>
    </div>
  );
}

const pivot = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });
const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });
const swing = (x: number, y: number, from: number, to: number): CSSProperties =>
  ({ ...pivot(x, y), "--swing-from": `${from}deg`, "--swing-to": `${to}deg` }) as CSSProperties;
const LIMB = { fill: "none", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Standing woman in a saree, feet at (0,0), facing right. `bend` tips the upper body forward at the waist. */
function Woman({ x, flip, bend = 0, children }: { x: number; flip?: boolean; bend?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} 0)${flip ? " scale(-1 1)" : ""}`}>
      <path d="M-9 -35 L9 -35 L17 -1 L-17 -1Z" />
      <g transform={bend ? `rotate(${bend} 0 -34)` : undefined}>
        <circle cx="-6" cy="-66" r="3.5" />
        <circle cx="0" cy="-63" r="7" />
        <path d="M-3 -57 L3 -57 L4 -53 L-4 -53Z M-6 -54 L6 -54 L9 -34 L-9 -34Z" />
        <path d="M-6 -54 L-14 -38 L-9 -34Z" />
        <g stroke="currentColor">{children}</g>
      </g>
    </g>
  );
}

/** Man in a turban and dhoti, feet at (0,0), facing right. */
function Man({ x, flip, children }: { x: number; flip?: boolean; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} 0)${flip ? " scale(-1 1)" : ""}`}>
      <ellipse cx="0" cy="-72" rx="8.5" ry="4.5" />
      <circle cx="0" cy="-66" r="7" />
      <path d="M-7 -58 L7 -58 L8 -30 L-8 -30Z M-8 -31 L8 -31 L11 -14 L-11 -14Z" />
      <path d="M-5 -15 L-6 0 M5 -15 L6 0" stroke="currentColor" {...LIMB} strokeWidth={4} />
      <g stroke="currentColor">{children}</g>
    </g>
  );
}

function Matka({ x, scale = 1 }: { x: number; scale?: number }) {
  return (
    <g transform={`translate(${x} 0) scale(${scale})`}>
      <path d="M-14 -16 C-21 -28 -10 -36 0 -36 C10 -36 21 -28 14 -16 C19 -5 10 1 0 1 C-10 1 -19 -5 -14 -16Z" />
      <path d="M-8 -36 L8 -36 L7 -40 L-7 -40Z" />
    </g>
  );
}

/** Clay hearth: crossed firewood, a flickering flame, a handi on top and steam rising off it. */
function Hearth({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M-16 0 L10 -10 M16 0 L-10 -10" stroke="currentColor" {...LIMB} strokeWidth={3} />
      <rect x="-24" y="-12" width="9" height="12" rx="3" />
      <rect x="15" y="-12" width="9" height="12" rx="3" />
      <path className="craft-flame" d="M-7 -10 C-9 -16 -3 -20 -3 -27 C4 -20 8 -16 4 -10Z" />
      <path d="M-24 -16 C-28 -34 -15 -40 0 -40 C15 -40 28 -34 24 -16 C20 -11 -20 -11 -24 -16Z" />
      <path d="M-15 -40 L15 -40 L13 -45 L-13 -45Z" />
      <g fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path className="craft-steam" d="M-8 -50 C-12 -58 -4 -64 -8 -72 C-12 -80 -4 -86 -8 -94" />
        <path className="craft-steam" style={delay(1.2)} d="M2 -50 C-2 -58 6 -64 2 -72 C-2 -80 6 -86 2 -94" />
        <path className="craft-steam" style={delay(2.4)} d="M12 -50 C8 -58 16 -64 12 -72 C8 -80 16 -86 12 -94" />
      </g>
    </g>
  );
}

function Cow({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <g className="craft-swing" style={swing(1, -40, -6, 12)}>
        <path d="M1 -40 C-6 -30 -6 -16 -4 -8" stroke="currentColor" {...LIMB} strokeWidth={2.5} />
        <ellipse cx="-4" cy="-6" rx="2.5" ry="4" />
      </g>
      <path d="M8 -26 L8 0 M18 -26 L19 0 M64 -26 L63 0 M74 -26 L76 0" stroke="currentColor" {...LIMB} strokeWidth={5} />
      <path d="M0 -40 C0 -52 10 -56 30 -56 L66 -56 C76 -56 80 -48 80 -40 L80 -32 C80 -27 76 -24 72 -24 L6 -24 C2 -24 0 -28 0 -33Z" />
      <path d="M56 -55 C58 -64 70 -64 72 -54Z" />
      <ellipse cx="28" cy="-23" rx="7" ry="3.5" />
      <g className="craft-swing craft-slow" style={swing(78, -46, 0, -5)}>
        <path d="M76 -50 L92 -60 L102 -58 L105 -50 L97 -44 L84 -40Z" />
        <path d="M94 -60 C91 -68 96 -73 101 -72 M89 -58 L82 -52" stroke="currentColor" {...LIMB} strokeWidth={2.5} />
      </g>
    </g>
  );
}

function Hive({ x, levels }: { x: number; levels: number }) {
  const top = -10 - levels * 20;
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M4 0 L4 -10 M36 0 L36 -10" stroke="currentColor" {...LIMB} strokeWidth={3} />
      <rect x="0" y={top} width="40" height={levels * 20} rx="1.5" />
      <path d={`M-4 ${top} L44 ${top} L39 ${top - 8} L1 ${top - 8}Z`} />
      {Array.from({ length: levels - 1 }, (_, i) => (
        <path key={i} d={`M0 ${-30 - i * 20} L40 ${-30 - i * 20}`} stroke="var(--craft-bg)" strokeWidth={1.5} />
      ))}
      <rect x="14" y="-16" width="12" height="3" rx="1.5" fill="var(--craft-bg)" />
    </g>
  );
}

/** A bee circling a point; each one gets its own radius, speed and starting angle. */
function Bee({ cx, cy, r, duration, start }: { cx: number; cy: number; r: number; duration: number; start: number }) {
  return (
    <g className="craft-orbit" style={{ ...pivot(cx, cy), animationDuration: `${duration}s`, animationDelay: `${-start}s` }}>
      <ellipse cx={cx + r} cy={cy} rx="2.6" ry="1.7" />
      <ellipse cx={cx + r} cy={cy - 2.5} rx="2" ry="1.2" opacity="0.6" />
    </g>
  );
}

function Crocus({ x, y = 0, scale = 1, index }: { x: number; y?: number; scale?: number; index: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="craft-sway" style={delay(-((index * 0.43) % 3))}>
        <path d="M0 0 L0 -12 M0 0 C-3 -5 -5 -9 -6 -14 M0 0 C3 -5 5 -9 6 -14" stroke="currentColor" fill="none" strokeWidth={1.4} strokeLinecap="round" />
        <path d="M-4.5 -12 C-6 -18 -3 -23 0 -25 C3 -23 6 -18 4.5 -12Z" />
      </g>
    </g>
  );
}

function Basket({ x }: { x: number }) {
  return <path transform={`translate(${x} 0)`} d="M-13 -18 L13 -18 L9 0 L-9 0Z M-15 -21 L15 -21 L13 -17 L-13 -17Z" />;
}

/** Arm reaching down from a bent figure's shoulder, swinging as it picks. */
function PickingArm({ from = -12, to = 14 }: { from?: number; to?: number }) {
  return (
    <g className="craft-swing craft-quick" style={swing(4, -52, from, to)}>
      <path d="M4 -52 C10 -44 14 -36 16 -26" {...LIMB} />
    </g>
  );
}

const FRIEZE_WIDTH = 1560;
const FALLING_NUTS = [
  { x: 72, y: -78, d: 0 },
  { x: 104, y: -80, d: 0.7 },
  { x: 122, y: -82, d: 1.3 },
  { x: 86, y: -76, d: 1.9 },
];

/** One tile of the drifting frieze. The ground line sits at y = 196; the track shows two tiles back to back. */
function Frieze() {
  return (
    <svg viewBox={`0 0 ${FRIEZE_WIDTH} 220`} className="craft-frieze" fill="currentColor">
      {/* Distant hills, rising into the Kashmir peaks behind the saffron fields, and the ground line */}
      <path
        d="M0 170 C120 150 220 166 330 156 C450 144 560 164 690 152 C820 140 900 128 980 118 L1030 92 L1066 116 L1110 80 L1160 124 C1260 150 1360 146 1460 158 C1500 162 1540 166 1560 170 L1560 196 L0 196Z"
        opacity="0.28"
      />
      <path d={`M0 196.5 L${FRIEZE_WIDTH} 196.5`} stroke="currentColor" strokeWidth={1.5} opacity="0.6" />

      <g transform="translate(0 196)">
        {/* Ghee 1: milking the cow */}
        <g transform="translate(40 0)">
          <Cow x={44} />
          <circle cx="72" cy="-6" r="6" />
          <g transform="translate(26 0)">
            <circle cx="-8" cy="-44" r="3.5" />
            <circle cx="-2" cy="-41" r="7" />
            <path d="M-9 -34 C-17 -22 -16 -6 -6 0 L14 0 C14 -8 10 -12 4 -14 C6 -22 4 -30 3 -34Z" />
            <g className="craft-milk" stroke="currentColor">
              <path d="M2 -30 C14 -30 30 -28 42 -24" {...LIMB} />
            </g>
            <g className="craft-milk" style={delay(-0.4)} stroke="currentColor">
              <path d="M2 -24 C14 -24 30 -22 44 -20" {...LIMB} />
            </g>
          </g>
        </g>

        {/* Ghee 2: bringing the milk to a boil */}
        <g transform="translate(230 0)">
          <Hearth x={76} />
          <Woman x={30} bend={10}>
            <g className="craft-swing" style={swing(4, -52, -8, 8)}>
              <path d="M4 -52 C14 -48 22 -44 30 -42 L44 -30" {...LIMB} />
            </g>
            <path d="M-4 -50 C2 -42 8 -38 14 -36" {...LIMB} />
          </Woman>
        </g>

        {/* Ghee 3: two women churning dahi in a bilona */}
        <g transform="translate(380 0)">
          <Matka x={80} scale={1.5} />
          <rect x="78" y="-124" width="4" height="72" rx="2" />
          <g className="craft-twist" style={pivot(80, -124)}>
            <path d="M66 -124 L94 -124" stroke="currentColor" {...LIMB} strokeWidth={3} />
          </g>
          <circle cx="80" cy="-128" r="3.5" />
          <Woman x={44}>
            <g className="craft-pull">
              <path d="M4 -52 L32 -62" {...LIMB} />
              <path d="M2 -46 L32 -50" {...LIMB} />
            </g>
          </Woman>
          <Woman x={116} flip>
            <g className="craft-pull" style={delay(-0.6)}>
              <path d="M4 -52 L32 -62" {...LIMB} />
              <path d="M2 -46 L32 -50" {...LIMB} />
            </g>
          </Woman>
        </g>

        {/* Ghee 4: slow-cooking the makkhan, then carrying the matkas home */}
        <g transform="translate(560 0)">
          <Hearth x={50} />
          <Woman x={104} flip bend={12}>
            <g className="craft-swing" style={swing(4, -52, -6, 10)}>
              <path d="M4 -52 C14 -48 22 -44 30 -42 L42 -30" {...LIMB} />
            </g>
          </Woman>
          <g className="craft-bob">
            <Woman x={170}>
              <path d="M-4 -54 L-10 -66 L-6 -78" {...LIMB} />
              <path d="M4 -52 L12 -46 L18 -40" {...LIMB} />
            </Woman>
            <g transform="translate(170 -72) scale(0.55)">
              <Matka x={0} />
              <g transform="translate(0 -38)">
                <Matka x={0} scale={0.85} />
              </g>
            </g>
          </g>
          <Matka x={214} scale={0.7} />
          <Matka x={232} scale={0.55} />
        </g>

        {/* Honey: hives, bees and a beekeeper with his smoker */}
        <g transform="translate(830 0)">
          <Hive x={0} levels={2} />
          <Hive x={56} levels={3} />
          <Bee cx={20} cy={-72} r={14} duration={3.2} start={0} />
          <Bee cx={20} cy={-72} r={22} duration={4.6} start={2} />
          <Bee cx={76} cy={-92} r={16} duration={3.8} start={1} />
          <Bee cx={76} cy={-92} r={26} duration={5.4} start={3} />
          <Bee cx={120} cy={-80} r={12} duration={2.8} start={0.5} />
          <Bee cx={46} cy={-110} r={18} duration={4.2} start={1.6} />
          <Man x={156} flip>
            <g className="craft-swing" style={swing(4, -52, -6, 6)}>
              <path d="M4 -52 L18 -44 L26 -48" {...LIMB} />
              <rect x="24" y="-58" width="8" height="12" rx="2" stroke="none" />
            </g>
            <path d="M-4 -52 L-8 -36" {...LIMB} />
            <g fill="none" strokeWidth={1.6} strokeLinecap="round">
              <path className="craft-steam" d="M30 -62 C26 -68 34 -72 30 -78" />
              <path className="craft-steam" style={delay(1.4)} d="M30 -62 C34 -68 26 -72 30 -78" />
            </g>
          </Man>
        </g>

        {/* Saffron: crocus fields below the mountains, a woman picking into her basket */}
        <g transform="translate(1010 0)">
          {[14, 34, 54, 112, 132, 152, 172, 192].map((x, i) => (
            <Crocus key={x} x={x} y={-10} scale={0.75} index={i} />
          ))}
          <Basket x={74} />
          <Woman x={100} bend={38}>
            <PickingArm />
          </Woman>
          {[8, 26, 44, 128, 146, 164, 182, 200].map((x, i) => (
            <Crocus key={x} x={x} index={i + 3} />
          ))}
        </g>

        {/* Almonds and walnuts: shaking the branches with a pole, gathering what falls */}
        <g transform="translate(1250 0)">
          <g className="craft-swing" style={swing(96, 0, -1.2, 1.2)}>
            <path d="M94 0 L96 -50 L80 -82 M96 -52 L112 -88 M96 -62 L100 -100" stroke="currentColor" {...LIMB} strokeWidth={6} />
            <ellipse cx="76" cy="-100" rx="34" ry="24" />
            <ellipse cx="116" cy="-104" rx="32" ry="26" />
            <ellipse cx="96" cy="-126" rx="30" ry="22" />
          </g>
          {FALLING_NUTS.map((nut) => (
            <circle key={nut.x} className="craft-fall" cx={nut.x} cy={nut.y} r="2.8" style={delay(nut.d)} />
          ))}
          <Man x={30}>
            <g className="craft-swing" style={swing(4, -52, -4, 6)}>
              <path d="M4 -52 L14 -60" {...LIMB} />
              <path d="M-4 -40 L62 -112" fill="none" strokeWidth={2.5} strokeLinecap="round" />
            </g>
            <path d="M-4 -52 L6 -48" {...LIMB} />
          </Man>
          <Basket x={150} />
          <Woman x={176} flip bend={34}>
            <PickingArm from={-10} to={12} />
          </Woman>
        </g>
      </g>
    </svg>
  );
}
