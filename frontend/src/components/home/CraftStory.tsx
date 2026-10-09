"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Decorative band under the hero: a faint silhouette frieze of village craft that slowly drifts
 * sideways. One scene per product family: milking, boiling and churning for ghee, then honey,
 * saffron and the nut orchards. Four tones give depth (far hills lightest, near props darkest), and
 * each figure has its own small loop (globals.css, `craft-*`). Purely decorative: no copy, hidden
 * from screen readers, only animates while on screen, and stands still for reduced-motion users.
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

// Tones, lightest (far) to darkest (near). Defined in globals.css on .craft-band.
const FAR = "var(--craft-c1)";
const MID = "var(--craft-c2)";
const BODY = "var(--craft-c3)";
const NEAR = "var(--craft-c4)";
const FOLD = "var(--craft-fold)";

const pivot = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });
const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });
const swing = (x: number, y: number, from: number, to: number, extra?: CSSProperties): CSSProperties =>
  ({ ...pivot(x, y), "--swing-from": `${from}deg`, "--swing-to": `${to}deg`, ...extra }) as CSSProperties;
const LIMB = { fill: "none", stroke: "currentColor", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const FOLD_LINE = { fill: "none", stroke: FOLD, strokeWidth: 1, strokeLinecap: "round" } as const;

/** Arm drawn shoulder → elbow → hand, with a small hand at the end. */
function Arm({ d, hand }: { d: string; hand: [number, number] }) {
  return (
    <>
      <path d={d} {...LIMB} />
      <circle cx={hand[0]} cy={hand[1]} r="2.2" />
    </>
  );
}

type Wear = "pallu" | "scarf" | "pagdi" | "cap" | "veil";

/** Head in profile, facing right, centred on (x, y), with what's worn on it. */
function Head({ x, y, wear }: { x: number; y: number; wear: Wear }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-6 -1 C-6 -7 -1 -10 3 -9 C6 -8 7 -5 7 -3 L9 0 L7 1 L7.5 3.5 C6 6 3 7 0 6 C-4 5 -6 2 -6 -1Z" />
      {wear === "pallu" && <path d="M-7 0 C-7 -8 0 -12 5 -9.5 C1 -8 -3 -4 -4 1 C-6 7 -9 15 -11 27 L-14 27 C-12 15 -9 7 -7 0Z" />}
      {wear === "scarf" && <path d="M-7 0 C-7 -8 0 -12 5 -9.5 C1 -8 -3 -4 -4 1 C-5 5 -7 9 -10 13 L-12 11 C-9 7 -7 4 -7 0Z" />}
      {wear === "pagdi" && <path d="M-7 -3 C-9 -11 -2 -15 4 -13 C8 -12 9 -8 8 -4 C3 -2 -3 -2 -7 -3Z M-6 -5 L-12 2 L-8 2Z" />}
      {wear === "cap" && <path d="M-6 -4 C-6 -11 6 -12 7 -5 C2 -4 -2 -4 -6 -4Z" />}
      {wear === "veil" && (
        <>
          <path d="M-6 -8 C-6 -14 6 -14 6 -8Z M-12 -8.5 L12 -8.5 L12 -6.5 L-12 -6.5Z" />
          <path d="M-9 -6.5 L9 -6.5 L9 10 L-9 10Z" fill={MID} />
        </>
      )}
    </g>
  );
}

type Figure = { x: number; flip?: boolean; bend?: number; tone?: string; children?: ReactNode };

const place = (x: number, flip?: boolean) => `translate(${x} 0)${flip ? " scale(-1 1)" : ""}`;

/** Woman in a saree (pallu over the head) or, for Kashmir, a pheran and headscarf. Feet at (0,0), facing right. */
function Woman({ x, flip, bend = 0, tone = BODY, dress = "saree", children }: Figure & { dress?: "saree" | "pheran" }) {
  return (
    <g transform={place(x, flip)} style={{ color: tone }} fill="currentColor">
      {dress === "saree" ? (
        <>
          <path d="M-8 -38 C-11 -26 -14 -12 -16 -1 C-10 1 8 1 15 -1 C13 -12 10 -26 8 -38Z" />
          <path d="M6 -2 L13 -2 L14 0 L6 0Z" />
          <path d="M3 -30 L5 -2 M6 -28 L9 -2" {...FOLD_LINE} />
        </>
      ) : (
        <>
          <path d="M-7 -9 L-7 0 L-2 0 L-2 -9Z M2 -9 L2 0 L9 0 L7 -9Z" />
          <path d="M-9 -38 C-11 -26 -12 -15 -12 -8 L12 -8 C12 -15 11 -26 9 -38Z" />
          <path d="M-12 -12 L12 -12" {...FOLD_LINE} />
        </>
      )}
      <g transform={bend ? `rotate(${bend} 0 -38)` : undefined}>
        <path d="M-6 -59 C-8 -55 -9 -49 -8 -44 L-8 -37 L8 -37 C9 -42 9 -47 7 -51 C6 -55 5 -58 3 -59Z" />
        <rect x="-2" y="-63" width="4" height="5" />
        <Head x={0} y={-68} wear={dress === "saree" ? "pallu" : "scarf"} />
        {dress === "saree" && <path d="M4 -58 L-8 -40" {...FOLD_LINE} />}
        {children}
      </g>
    </g>
  );
}

/** Man in a kurta and dhoti. Feet at (0,0), facing right. */
function Man({ x, flip, tone = BODY, wear = "pagdi", children }: Figure & { wear?: Wear }) {
  return (
    <g transform={place(x, flip)} style={{ color: tone }} fill="currentColor">
      <path d="M-9 -30 L9 -30 L8 -16 L7 -1 L2 -1 L1 -15 L-1 -15 L-3 -1 L-8 -1 L-9 -16Z" />
      <path d="M2 -2 L10 -2 L10 0 L2 0Z M-8 -2 L-1 -2 L-1 0 L-8 0Z" />
      <path d="M-7 -60 C-9 -54 -10 -44 -10 -28 L10 -28 C10 -44 9 -54 7 -60Z" />
      <path d="M-6 -59 L6 -46" {...FOLD_LINE} />
      <rect x="-2" y="-64" width="4" height="5" />
      <Head x={0} y={-69} wear={wear} />
      {children}
    </g>
  );
}

/** Gir cow facing right: domed forehead, long hanging ears, swept-back horns, hump and dewlap. */
function GirCow({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`} fill="currentColor">
      <g style={{ color: MID }}>
        <path d="M24 -32 L25 -18 L22 -8 L23 0 M98 -30 L99 -14 L100 0" {...LIMB} strokeWidth={5.5} />
      </g>
      <g style={{ color: BODY }}>
        <g className="craft-swing" style={swing(1, -58, -6, 12)}>
          <path d="M1 -58 C-6 -46 -7 -30 -5 -14" {...LIMB} strokeWidth={2.2} />
          <path d="M-5 -16 C-8 -12 -8 -6 -5 -3 C-2 -6 -2 -12 -5 -16Z" />
        </g>
        <path d="M0 -60 C4 -66 14 -68 30 -67 L64 -66 C70 -68 74 -78 82 -79 C90 -79 94 -72 96 -66 C102 -64 108 -66 114 -70 C120 -73 126 -71 128 -66 L134 -50 C135 -46 132 -43 128 -44 L120 -46 C116 -44 112 -40 108 -36 C104 -30 100 -26 96 -28 L94 -32 C80 -30 50 -29 26 -31 C18 -31 10 -34 6 -40 C2 -46 -1 -54 0 -60Z" />
        <path d="M12 -38 L16 -20 L12 -9 L13 0 M88 -32 L88 -12 L89 0" {...LIMB} strokeWidth={6} />
        <ellipse cx="32" cy="-30" rx="7" ry="4" />
      </g>
      <g style={{ color: NEAR }}>
        <path d="M117 -71 C111 -76 108 -81 110 -87 C113 -85 115 -80 120 -74Z" />
        <g className="craft-swing craft-slow" style={swing(115, -65, 0, 10)}>
          <path d="M115 -66 C108 -62 106 -54 110 -48 C112 -53 114 -57 118 -62Z" />
        </g>
        <path d="M60 -64 C66 -60 76 -60 84 -66" {...FOLD_LINE} />
      </g>
      <circle cx="123" cy="-63" r="1.1" fill={FOLD} />
    </g>
  );
}

function Matka({ x, y = 0, scale = 1, tone = NEAR }: { x: number; y?: number; scale?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={tone}>
      <path d="M-14 -16 C-21 -28 -10 -36 0 -36 C10 -36 21 -28 14 -16 C19 -5 10 1 0 1 C-10 1 -19 -5 -14 -16Z" />
      <path d="M-8 -36 L8 -36 L7 -40 L-7 -40Z" />
      <path d="M-15 -22 C-6 -18 6 -18 15 -22" {...FOLD_LINE} />
    </g>
  );
}

/** Mud chulha with the fire glowing in its mouth, a handi on top and steam rising off it. */
function Chulha({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M-26 0 L-24 -18 C-24 -22 24 -22 24 -18 L26 0Z" fill={NEAR} />
      <path d="M-9 0 C-9 -13 9 -13 9 0Z" fill={FOLD} />
      <path className="craft-flame" d="M-5 0 C-7 -6 -2 -8 -2 -13 C3 -8 6 -5 3 0Z" fill={BODY} />
      <path d="M-22 -22 C-26 -40 -14 -46 0 -46 C14 -46 26 -40 22 -22 C18 -19 -18 -19 -22 -22Z" fill={BODY} />
      <path d="M-14 -46 L14 -46 L12 -50 L-12 -50Z" fill={BODY} />
      <g fill="none" stroke={MID} strokeWidth={1.8} strokeLinecap="round">
        <path className="craft-steam" d="M-8 -56 C-12 -64 -4 -70 -8 -78 C-12 -86 -4 -92 -8 -100" />
        <path className="craft-steam" style={delay(1.2)} d="M2 -56 C-2 -64 6 -70 2 -78 C-2 -86 6 -92 2 -100" />
        <path className="craft-steam" style={delay(2.4)} d="M12 -56 C8 -64 16 -70 12 -78 C8 -86 16 -92 12 -100" />
      </g>
    </g>
  );
}

function Hive({ x, levels }: { x: number; levels: number }) {
  const top = -12 - levels * 20;
  return (
    <g transform={`translate(${x} 0)`} fill={NEAR}>
      <path d="M4 0 L4 -12 M38 0 L38 -12" stroke={NEAR} strokeWidth={3} strokeLinecap="round" />
      <rect x="-2" y="-14" width="46" height="3" />
      <rect x="0" y={top} width="42" height={levels * 20} rx="1.5" />
      <path d={`M-4 ${top} L46 ${top} L41 ${top - 8} L1 ${top - 8}Z`} />
      {Array.from({ length: levels - 1 }, (_, i) => (
        <path key={i} d={`M0 ${-32 - i * 20} L42 ${-32 - i * 20}`} {...FOLD_LINE} strokeWidth={1.4} />
      ))}
      <rect x="15" y="-18" width="12" height="2.5" rx="1.2" fill={FOLD} />
    </g>
  );
}

/** A bee circling a point; each gets its own radius, speed and starting angle. */
function Bee({ cx, cy, r, duration, start }: { cx: number; cy: number; r: number; duration: number; start: number }) {
  return (
    <g className="craft-orbit" style={{ ...pivot(cx, cy), animationDuration: `${duration}s`, animationDelay: `${-start}s` }}>
      <ellipse cx={cx + r} cy={cy} rx="2.8" ry="1.8" fill={NEAR} />
      <ellipse cx={cx + r - 1} cy={cy - 2.6} rx="2.2" ry="1.3" fill={MID} />
    </g>
  );
}

function Crocus({ x, y = 0, scale = 1, index, tone = BODY }: { x: number; y?: number; scale?: number; index: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="craft-sway" style={delay(-((index * 0.43) % 3))}>
        <path d="M0 0 C-1 -8 -4 -14 -7 -18 M0 0 C1 -8 4 -14 6 -19 M0 0 L0 -12" fill="none" stroke={MID} strokeWidth={1.3} strokeLinecap="round" />
        <path d="M0 -12 C-5 -14 -6 -20 -3 -25 C-1 -22 0 -18 0 -12Z M0 -12 C5 -14 6 -20 3 -25 C1 -22 0 -18 0 -12Z M0 -12 C-2 -17 -2 -23 0 -27 C2 -23 2 -17 0 -12Z" fill={tone} />
      </g>
    </g>
  );
}

function Basket({ x, tone = NEAR }: { x: number; tone?: string }) {
  return (
    <g transform={`translate(${x} 0)`} fill={tone}>
      <path d="M-14 -20 L14 -20 L10 0 L-10 0Z M-16 -23 L16 -23 L14 -19 L-14 -19Z" />
      <path d="M-12 -14 L12 -14 M-11 -8 L11 -8 M-6 -20 L-5 0 M0 -20 L0 0 M6 -20 L5 0" {...FOLD_LINE} />
    </g>
  );
}

function Hut({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`} fill={MID}>
      <rect x="-26" y="-34" width="52" height="34" />
      <path d="M-36 -32 L0 -62 L36 -32Z" />
      <path d="M-24 -38 L0 -58 M-10 -36 L4 -54 M8 -36 L14 -48" {...FOLD_LINE} />
      <path d="M-6 0 L-6 -20 L6 -20 L6 0Z" fill={FAR} />
    </g>
  );
}

function Poplar({ x, h = 70 }: { x: number; h?: number }) {
  return <path transform={`translate(${x} 0)`} d={`M0 0 C-6 ${-h * 0.3} -7 ${-h * 0.7} 0 ${-h} C7 ${-h * 0.7} 6 ${-h * 0.3} 0 0Z`} fill={MID} />;
}

function Birds({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="craft-flap" fill="none" stroke={MID} strokeWidth={1.4} strokeLinecap="round">
        <path d="M0 0 q5 -5 10 0 q5 -5 10 0" />
        <path d="M26 -10 q4 -4 8 0 q4 -4 8 0" />
        <path d="M16 12 q4 -4 8 0 q4 -4 8 0" />
      </g>
    </g>
  );
}

const FRIEZE_WIDTH = 1680;
const GROUND = 222;
const FALLING_NUTS = [
  { x: 76, y: -86, d: 0 },
  { x: 104, y: -90, d: 0.7 },
  { x: 126, y: -88, d: 1.3 },
  { x: 90, y: -82, d: 1.9 },
];

/** One tile of the drifting frieze; the track shows two tiles back to back so the loop is seamless. */
function Frieze() {
  return (
    <svg viewBox={`0 0 ${FRIEZE_WIDTH} 240`} className="craft-frieze" fill="currentColor">
      {/* Far layer: rolling plains rising into the snow-capped Kashmir range behind the saffron fields */}
      <path
        d={`M0 186 C120 168 230 182 340 174 C470 164 580 182 700 172 C830 160 930 150 1040 130 L1090 92 L1120 114 L1170 70 L1215 104 L1250 84 L1300 128 C1400 150 1500 160 1600 176 C1640 182 1665 184 ${FRIEZE_WIDTH} 186 L${FRIEZE_WIDTH} ${GROUND} L0 ${GROUND}Z`}
        fill={FAR}
      />
      <path d="M1159 80 L1170 70 L1182 82 L1174 79 L1168 86 L1164 79Z M1080 101 L1090 92 L1100 103 L1092 100Z M1242 92 L1250 84 L1258 94 L1251 91Z" fill="var(--craft-bg)" />
      <Birds x={160} y={70} />
      <Birds x={900} y={58} />
      <path d={`M0 ${GROUND + 0.5} L${FRIEZE_WIDTH} ${GROUND + 0.5}`} stroke={MID} strokeWidth={1.5} />

      <g transform={`translate(0 ${GROUND})`}>
        {/* Mid layer: village huts and a neem tree behind the ghee scenes, poplars in Kashmir */}
        <Hut x={292} />
        <Hut x={350} />
        <g fill={MID}>
          <path d="M640 0 L642 -46 L630 -64 M642 -50 L654 -70" stroke={MID} strokeWidth={5} strokeLinecap="round" />
          <ellipse cx="626" cy="-74" rx="30" ry="20" />
          <ellipse cx="660" cy="-78" rx="30" ry="22" />
          <ellipse cx="642" cy="-96" rx="26" ry="18" />
        </g>
        <Poplar x={1288} h={70} />
        <Poplar x={1302} h={84} />

        {/* Ghee 1: milking the Gir cow */}
        <g transform="translate(40 0)">
          <GirCow x={30} />
          <Matka x={72} scale={0.42} />
          <g transform="translate(46 0)" style={{ color: NEAR }} fill="currentColor">
            <path d="M-6 0 L12 0 C12 -4 10 -8 6 -10 L8 -18 C8 -22 4 -24 0 -24 C-8 -24 -12 -18 -12 -10 C-12 -4 -10 0 -6 0Z" />
            <path d="M-10 -20 C-12 -30 -8 -40 -2 -44 L4 -44 C8 -40 8 -30 6 -22Z" />
            <Head x={3} y={-50} wear="pallu" />
            <g className="craft-milk">
              <Arm d="M2 -40 L12 -33 L22 -32" hand={[22, -32]} />
            </g>
            <g className="craft-milk" style={delay(-0.4)}>
              <Arm d="M0 -37 L10 -28 L20 -28" hand={[20, -28]} />
            </g>
          </g>
        </g>

        {/* Ghee 2: bringing the milk to a boil on the chulha */}
        <g transform="translate(250 0)">
          <Chulha x={90} />
          <Woman x={48} bend={8}>
            <Arm d="M0 -55 L8 -45 L20 -44" hand={[20, -44]} />
            <g className="craft-swing" style={swing(1, -56, -8, 8)}>
              <Arm d="M1 -56 L12 -48 L22 -52" hand={[22, -52]} />
              <path d="M22 -52 L40 -40" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </g>
          </Woman>
        </g>

        {/* Ghee 3: two women churning dahi in a tall bilona */}
        <g transform="translate(430 0)">
          <path d="M66 0 L70 -8 L106 -8 L110 0Z" fill={MID} />
          <Matka x={88} y={-6} scale={1.5} />
          <rect x="86" y="-150" width="4" height="96" rx="2" fill={NEAR} />
          <g className="craft-twist" style={pivot(88, -150)}>
            <path d="M74 -150 L102 -150" stroke={NEAR} strokeWidth={3} strokeLinecap="round" />
          </g>
          <circle cx="88" cy="-154" r="3.5" fill={NEAR} />
          <Woman x={52}>
            <g className="craft-pull">
              <Arm d="M1 -56 L12 -48 L32 -62" hand={[32, -62]} />
              <Arm d="M0 -52 L10 -42 L32 -52" hand={[32, -52]} />
            </g>
          </Woman>
          <Woman x={124} flip>
            <g className="craft-pull" style={delay(-0.6)}>
              <Arm d="M1 -56 L12 -48 L32 -62" hand={[32, -62]} />
              <Arm d="M0 -52 L10 -42 L32 -52" hand={[32, -52]} />
            </g>
          </Woman>
        </g>

        {/* Ghee 4: slow-cooking the makkhan, then carrying the ghee home */}
        <g transform="translate(600 0)">
          <Chulha x={70} />
          <Woman x={124} flip bend={10}>
            <Arm d="M0 -55 L8 -45 L20 -44" hand={[20, -44]} />
            <g className="craft-swing" style={swing(1, -56, -6, 10)}>
              <Arm d="M1 -56 L12 -48 L22 -52" hand={[22, -52]} />
              <path d="M22 -52 L40 -40" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </g>
          </Woman>
          <g className="craft-bob">
            <Woman x={190}>
              <Arm d="M-2 -56 L-8 -68 L-4 -80" hand={[-4, -80]} />
              <Arm d="M1 -55 L6 -44 L8 -34" hand={[8, -34]} />
            </Woman>
            <Matka x={190} y={-79} scale={0.55} />
            <Matka x={190} y={-99} scale={0.45} />
          </g>
          <Matka x={236} scale={0.7} />
          <Matka x={256} scale={0.55} />
        </g>

        {/* Honey: hives among flowering bushes, bees, a beekeeper in his veil with a smoker */}
        <g transform="translate(880 0)">
          {/* Flowering shrubs the bees work */}
          <g fill={MID}>
            <path d="M-26 0 C-30 -10 -24 -22 -14 -20 C-10 -30 4 -28 4 -18 C12 -16 12 -4 6 0Z" />
            <path d="M114 0 C110 -8 116 -16 124 -14 C130 -20 140 -14 136 -6 C140 -4 138 0 136 0Z" />
          </g>
          <g fill={NEAR}>
            <circle cx="-16" cy="-18" r="1.8" />
            <circle cx="-6" cy="-24" r="1.8" />
            <circle cx="2" cy="-14" r="1.8" />
            <circle cx="124" cy="-14" r="1.6" />
            <circle cx="132" cy="-10" r="1.6" />
          </g>
          <Hive x={10} levels={2} />
          <Hive x={66} levels={3} />
          <Bee cx={32} cy={-80} r={14} duration={3.2} start={0} />
          <Bee cx={32} cy={-80} r={22} duration={4.6} start={2} />
          <Bee cx={88} cy={-102} r={16} duration={3.8} start={1} />
          <Bee cx={88} cy={-102} r={26} duration={5.4} start={3} />
          <Bee cx={132} cy={-86} r={12} duration={2.8} start={0.5} />
          <Bee cx={58} cy={-118} r={18} duration={4.2} start={1.6} />
          <Man x={160} flip wear="veil">
            <Arm d="M-1 -56 L-6 -44 L-2 -36" hand={[-2, -36]} />
            <g className="craft-swing" style={swing(1, -57, -6, 6)}>
              <Arm d="M1 -57 L12 -50 L22 -54" hand={[22, -54]} />
              <rect x="20" y="-66" width="9" height="13" rx="2" fill={NEAR} />
            </g>
            <g fill="none" stroke={MID} strokeWidth={1.6} strokeLinecap="round">
              <path className="craft-steam" d="M26 -70 C22 -76 30 -80 26 -86" />
              <path className="craft-steam" style={delay(1.4)} d="M26 -70 C30 -76 22 -80 26 -86" />
            </g>
          </Man>
        </g>

        {/* Saffron: crocus fields below the mountains, a Kashmiri woman picking into her basket */}
        <g transform="translate(1080 0)">
          {[10, 30, 50, 120, 140, 160, 180, 200].map((x, i) => (
            <Crocus key={x} x={x} y={-12} scale={0.75} index={i} tone={MID} />
          ))}
          <Basket x={74} />
          <Woman x={104} bend={40} dress="pheran">
            <g className="craft-swing craft-quick" style={swing(1, -56, -14, 14)}>
              <Arm d="M1 -56 L8 -44 L14 -32" hand={[14, -32]} />
            </g>
            <Arm d="M-1 -55 L-2 -44 L4 -36" hand={[4, -36]} />
          </Woman>
          {[4, 24, 44, 132, 152, 172, 192, 212].map((x, i) => (
            <Crocus key={x} x={x} index={i + 3} />
          ))}
        </g>

        {/* Almonds and walnuts: shaking the branches with a pole, gathering what falls */}
        <g transform="translate(1340 0)">
          <g className="craft-swing" style={swing(100, 0, -1.2, 1.2)}>
            <g fill={MID}>
              <ellipse cx="72" cy="-112" rx="34" ry="24" />
              <ellipse cx="132" cy="-110" rx="32" ry="24" />
            </g>
            <path d="M98 0 C96 -20 98 -40 100 -54 M100 -54 L82 -88 M100 -56 L118 -94 M100 -64 L102 -110" fill="none" stroke={BODY} strokeWidth={6} strokeLinecap="round" />
            <g fill={BODY}>
              <ellipse cx="80" cy="-104" rx="30" ry="22" />
              <ellipse cx="120" cy="-106" rx="30" ry="24" />
              <ellipse cx="100" cy="-130" rx="30" ry="22" />
            </g>
          </g>
          {FALLING_NUTS.map((nut) => (
            <circle key={nut.x} className="craft-fall" cx={nut.x} cy={nut.y} r="3" fill={NEAR} style={delay(nut.d)} />
          ))}
          <Man x={34}>
            <Arm d="M-1 -56 L6 -50 L14 -58" hand={[14, -58]} />
            <g className="craft-swing" style={swing(1, -57, -4, 6)}>
              <Arm d="M1 -57 L10 -62 L16 -70" hand={[16, -70]} />
              <path d="M-2 -46 L66 -124" fill="none" stroke={NEAR} strokeWidth={2.5} strokeLinecap="round" />
            </g>
          </Man>
          <Basket x={156} />
          <Woman x={184} flip bend={36}>
            <g className="craft-swing craft-quick" style={swing(1, -56, -12, 12)}>
              <Arm d="M1 -56 L8 -44 L14 -32" hand={[14, -32]} />
            </g>
          </Woman>
        </g>
      </g>
    </svg>
  );
}
