"use client";

import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Diwali decorations for the home page (shown while `isDiwaliSeason`, lib/diwali.ts). All purely decorative:
 * hidden from screen readers, no pointer events, and still for reduced-motion users (globals.css, `diwali-*`).
 */

// SVG ids must be unique per instance and safe inside url(#…).
const useSvgId = () => useId().replace(/[^a-zA-Z0-9_-]/g, "");

const delay = (seconds: number): CSSProperties => ({ animationDelay: `-${seconds.toFixed(2)}s` });

// Point on a quadratic curve from (x0, y0) through control (cx, cy) to (x1, y1).
const curve = (t: number, p0: number, c: number, p1: number) => (1 - t) ** 2 * p0 + 2 * t * (1 - t) * c + t ** 2 * p1;

const BULB_COLOURS = ["#ffd25e", "#ff9f43", "#ff6b6b", "#ffe9a8", "#ffb347"];

/** A string of fairy lights in swags of 200 units, 7 bulbs each, twinkling out of step. */
function LightString({ swags, className }: { swags: number; className?: string }) {
  const wire = Array.from({ length: swags }, (_, s) => `M${s * 200} 3 Q${s * 200 + 100} 34 ${s * 200 + 200} 3`).join(" ");
  const bulbs = Array.from({ length: swags * 7 }, (_, n) => {
    const swag = Math.floor(n / 7);
    const t = ((n % 7) + 1) / 8;
    return { x: swag * 200 + 200 * t, y: curve(t, 3, 34, 3), colour: BULB_COLOURS[n % BULB_COLOURS.length], wait: (n * 0.37) % 2.4 };
  });
  return (
    <svg viewBox={`0 0 ${swags * 200} 46`} className={cn("block h-auto w-full", className)}>
      <path d={wire} fill="none" stroke="#4a3220" strokeWidth="1.4" opacity=".75" />
      {bulbs.map((bulb) => (
        <g key={bulb.x} transform={`translate(${bulb.x.toFixed(1)} ${bulb.y.toFixed(1)})`}>
          <circle className="diwali-bulb-glow" cy="7" r="8" fill={bulb.colour} style={delay(bulb.wait)} />
          <rect x="-1.6" width="3.2" height="3" rx=".6" fill="#3d2b1c" />
          <ellipse className="diwali-bulb" cy="7" rx="3" ry="4.4" fill={bulb.colour} style={delay(bulb.wait)} />
        </g>
      ))}
    </svg>
  );
}

/** A paper kandil hanging on a thread of `drop` units, swinging gently. */
function Lantern({ drop, wait, className }: { drop: number; wait: number; className?: string }) {
  const id = useSvgId();
  return (
    <svg viewBox={`0 0 48 ${drop + 80}`} className={className}>
      <defs>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9f43" />
          <stop offset=".5" stopColor="#e2452f" />
          <stop offset="1" stopColor="#8f1d2c" />
        </linearGradient>
      </defs>
      <g className="diwali-lantern" style={{ transformOrigin: "24px 0px", ...delay(wait) }}>
        <line x1="24" y1="0" x2="24" y2={drop} stroke="#7a5230" strokeWidth="1.2" />
        <g transform={`translate(0 ${drop})`}>
          <rect x="17" width="14" height="5" rx="1.5" fill="#d4a24c" />
          <path d="M24 5 L43 27 L24 49 L5 27 Z" fill={`url(#${id}body)`} stroke="#e9b949" strokeWidth="1.5" />
          <path d="M5 27 H43 M24 5 V49" stroke="#e9b949" strokeWidth=".8" opacity=".7" />
          <circle className="diwali-lantern-light" cx="24" cy="27" r="7" fill="#ffe08a" style={delay(wait)} />
          <rect x="19" y="49" width="10" height="4" rx="1" fill="#d4a24c" />
          <path d="M20 53 L17 72 M24 53 V75 M28 53 L31 72" stroke="#e9b949" strokeWidth="1.2" />
          <circle cx="17" cy="73" r="1.8" fill="#e2452f" />
          <circle cx="24" cy="76" r="1.8" fill="#e2452f" />
          <circle cx="31" cy="73" r="1.8" fill="#e2452f" />
        </g>
      </g>
    </svg>
  );
}

/** Fairy lights along the top of the hero, with two lanterns at the sides on large screens. */
export function DiwaliHeroLights() {
  return (
    <div className="diwali-anim pointer-events-none absolute inset-x-0 top-0 z-[2]" aria-hidden="true">
      <LightString swags={3} className="sm:hidden" />
      <LightString swags={6} className="hidden sm:block" />
      <Lantern drop={46} wait={0} className="absolute left-[3%] top-1 hidden w-11 lg:block" />
      <Lantern drop={96} wait={1.3} className="absolute left-[8%] top-1 hidden w-9 lg:block" />
      <Lantern drop={96} wait={0.6} className="absolute right-[8%] top-1 hidden w-9 lg:block" />
      <Lantern drop={46} wait={1.9} className="absolute right-[3%] top-1 hidden w-11 lg:block" />
    </div>
  );
}

/** A clay diya with a flickering flame. */
export function Diya({ wait = 0, className }: { wait?: number; className?: string }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 64 52" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#ffd66b" stopOpacity=".9" />
          <stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset=".55" stopColor="#ffc94a" />
          <stop offset="1" stopColor="#ff7a1a" />
        </linearGradient>
        <linearGradient id={`${id}bowl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9692a" />
          <stop offset="1" stopColor="#7c2d12" />
        </linearGradient>
      </defs>
      <circle className="diwali-glow" cx="32" cy="17" r="17" fill={`url(#${id}glow)`} style={delay(wait)} />
      <path className="diwali-flame" d="M32 4 C38 13 38 21 32 26 C26 21 26 13 32 4 Z" fill={`url(#${id}flame)`} style={delay(wait)} />
      <path d="M8 28 H56 C54 40 44 48 32 48 C20 48 10 40 8 28 Z" fill={`url(#${id}bowl)`} />
      <ellipse cx="32" cy="28" rx="24" ry="3.6" fill="#f0b347" />
      <path d="M14 34 Q32 43 50 34" stroke="#f6c86a" strokeWidth="1.4" fill="none" opacity=".75" />
      {[20, 26, 32, 38, 44].map((cx) => (
        <circle key={cx} cx={cx} cy={curve((cx - 14) / 36, 38, 47, 38)} r="1.2" fill="#f6c86a" />
      ))}
    </svg>
  );
}

// [left %, size px, seconds to rise, head start s]
const EMBERS: [number, number, number, number][] = [
  [6, 4, 7, 0], [14, 3, 9, 3.1], [22, 5, 8, 5.6], [31, 3, 10, 1.4], [39, 4, 7.5, 6.2], [47, 3, 9.5, 2.3], [55, 5, 8.5, 4.4],
  [63, 3, 7, 0.8], [70, 4, 10, 5.1], [78, 3, 8, 2.9], [85, 5, 9, 6.8], [92, 3, 7.5, 1.9], [97, 4, 9, 4.0], [3, 3, 10, 7.3],
];

/** Glowing sparks drifting up from the bottom of the parent. */
export function Embers({ className }: { className?: string }) {
  return (
    <div className={cn("diwali-embers pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {EMBERS.map(([left, size, seconds, wait]) => (
        <span key={left} style={{ left: `${left}%`, width: size, height: size, animationDuration: `${seconds}s`, ...delay(wait) }} />
      ))}
    </div>
  );
}

/** A firework: twelve sparks flying out from one point, every few seconds. */
export function Burst({ colour, wait, className }: { colour: string; wait: number; className?: string }) {
  return (
    <div className={cn("diwali-burst pointer-events-none absolute", className)} style={{ color: colour }} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} style={{ transform: `rotate(${i * 30}deg)` }}>
          <i style={delay(wait)} />
        </span>
      ))}
    </div>
  );
}

/** A slowly turning rangoli mandala, drawn in the current text colour. */
export function Rangoli({ className }: { className?: string }) {
  return (
    <svg viewBox="-100 -100 200 200" className={cn("diwali-rangoli", className)} aria-hidden="true">
      <g fill="none" stroke="currentColor">
        <circle r="94" strokeWidth=".7" strokeDasharray="2 5" />
        <circle r="72" strokeWidth=".8" />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={`p${i}`} d="M0 -90 C15 -72 15 -54 0 -42 C-15 -54 -15 -72 0 -90 Z" strokeWidth="1" transform={`rotate(${i * 30})`} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <path key={`q${i}`} d="M0 -38 C11 -28 11 -18 0 -11 C-11 -18 -11 -28 0 -38 Z" strokeWidth="1" transform={`rotate(${i * 45 + 22.5})`} />
        ))}
        <circle r="8" strokeWidth="1" />
        {Array.from({ length: 24 }, (_, i) => (
          <circle key={`d${i}`} cy="-82" r="1.7" fill="currentColor" stroke="none" transform={`rotate(${i * 15 + 7.5})`} />
        ))}
      </g>
    </svg>
  );
}

// [left %, top %, size px, head start s]
const SPARKLES: [number, number, number, number][] = [
  [2, 6, 12, 0], [44, 0, 9, 1.1], [62, 26, 14, 0.5], [88, 4, 10, 1.7], [96, 48, 13, 0.9], [74, 70, 8, 2.2],
];

/** Gold four-point sparkles twinkling across the parent (which needs `relative`). */
export function Sparkles({ className }: { className?: string }) {
  return (
    <div className={cn("diwali-anim pointer-events-none absolute inset-0", className)} aria-hidden="true">
      {SPARKLES.map(([left, top, size, wait]) => (
        <svg key={`${left}-${top}`} viewBox="-10 -10 20 20" className="diwali-sparkle absolute" style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, ...delay(wait) }}>
          <path d="M0 -10 L2.3 -2.3 L10 0 L2.3 2.3 L0 10 L-2.3 2.3 L-10 0 L-2.3 -2.3 Z" fill="#e9a93a" />
        </svg>
      ))}
    </div>
  );
}
