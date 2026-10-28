import { useEffect, useMemo, useRef } from "react";

import logo from "@/assets/logo.png";
import { useLang, useT } from "@/lib/hooks";
import { dirFor } from "@/lib/i18n";
import "./intro.css";

/**
 * First-visit intro: a cartoon detective inspects a shipping container through
 * a magnifying glass, finds the conforming crate, and the glass becomes the
 * company seal before an iris wipe hands over to the page underneath.
 *
 * Everything runs on the Web Animations API with spring curves rendered to
 * CSS `linear()`, so motion stays on the compositor while the page hydrates
 * behind the overlay. The lens and the interior it reveals are two elements
 * moved with identical timing, which is what keeps them registered.
 */

const M = 1.1; // lens magnification
const R = 120; // lens radius, scene px
const LY = 370; // lens centre height, scene px

const rigAt = (x: number) => `translate(${x}px, ${LY}px)`;
const worldAt = (x: number) => `translate(${R - x * M}px, ${R - LY * M}px) scale(${M})`;

type Spring = { easing: string; duration: number };

/** Simulates a damped spring and samples it into a CSS `linear()` easing. */
function spring(stiffness: number, damping: number): Spring {
  const dt = 1 / 240;
  const pts = [0];
  let x = 0;
  let v = 0;
  let t = 0;
  while (t < 2.5) {
    v += (-stiffness * (x - 1) - damping * v) * dt;
    x += v * dt;
    t += dt;
    pts.push(x);
    if (t > 0.1 && Math.abs(x - 1) < 5e-4 && Math.abs(v) < 5e-3) break;
  }
  const n = 72;
  const out: string[] = [];
  for (let i = 0; i <= n; i++) out.push(pts[Math.round((i / n) * (pts.length - 1))].toFixed(4));
  out[n] = "1";
  return { easing: `linear(${out.join(",")})`, duration: Math.round(t * 1000) };
}

const POP = spring(320, 17); // bouncy pop-in
const SOFT = spring(190, 21); // gentle overshoot
const ZIP = spring(280, 25); // fast dash that lands without wobbling
const SINE = "cubic-bezier(0.37, 0, 0.63, 1)"; // easeInOutSine — a walk, not a dash
const OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
const GRAVITY = "cubic-bezier(0.55, 0, 1, 0.45)";

// Static geometry, computed once.
const CORRUGATION = Array.from({ length: 17 }, (_, i) => 214 + i * 41);
const PLANKS = Array.from({ length: 19 }, (_, i) => 204 + i * 44);
// The container's lettering panel runs from the corner post to the door.
const PANEL_START = 214;
const PANEL_END = 872;
const PANEL_MAX = PANEL_END - PANEL_START;

const SPARKS: [number, number][] = [[-200, -60], [-170, 110], [190, -120], [205, 70], [-40, -215], [60, 205]];
const FOCUS_LINES = (() => {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const p = (r: number, a: number) => `${(600 + Math.cos(a) * r).toFixed(1)} ${(370 + Math.sin(a) * r).toFixed(1)}`;
  return Array.from({ length: 52 }, (_, i) => {
    const a = (i / 52) * Math.PI * 2 + rand() * 0.08;
    const rin = 300 + rand() * 90;
    const w = 0.01 + rand() * 0.018;
    return { d: `M${p(rin, a)}L${p(1100, a - w)}L${p(1100, a + w)}Z`, opacity: 0.35 + rand() * 0.4 };
  });
})();

type Refs = Record<string, Element | null>;

export default function SiteIntro({ onDone }: { onDone: () => void }) {
  const t = useT();
  const lang = useLang();
  const rtl = dirFor(lang) === "rtl";
  // Letter-spacing breaks Arabic joining and looks odd in CJK.
  const spaced = lang !== "ar" && lang !== "zh";
  const refs = useRef<Refs>({});
  const ref = (key: string) => (el: Element | null) => {
    refs.current[key] = el;
  };
  const anims = useRef<Animation[]>([]);
  const finished = useRef(false);

  const finish = useMemo(
    () => () => {
      if (finished.current) return;
      finished.current = true;
      onDone();
    },
    [onDone],
  );

  // Keep the page underneath from scrolling while the overlay is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const el = (k: string) => refs.current[k] as Element;
    const overlay = el("overlay") as HTMLElement;
    const stage = el("stage") as HTMLElement;

    const fit = () => {
      const s = Math.min(window.innerWidth / 1200, window.innerHeight / 700) * 0.92;
      stage.style.transform = `translate(-50%, -50%) scale(${s})`;
      return s;
    };
    const s = fit();

    // Squeeze the container lettering if a language runs past the panel.
    (["cName", "cTag"] as const).forEach((k) => {
      const text = refs.current[k] as SVGTextElement | null;
      if (text && text.getComputedTextLength() > PANEL_MAX) {
        text.setAttribute("textLength", String(PANEL_MAX));
        text.setAttribute("lengthAdjust", "spacingAndGlyphs");
      }
    });
    window.addEventListener("resize", fit, { passive: true });

    const A = (target: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => {
      const a = target.animate(kf, { fill: "both", ...o });
      anims.current.push(a);
      return a;
    };
    // A later animation on an element must not back-fill over an earlier one.
    const B = (target: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => A(target, kf, { fill: "forwards", ...o });

    // Lens and the world inside it must share duration + easing to stay locked.
    const move = (from: number, to: number, o: KeyframeAnimationOptions, first = false) => {
      (first ? A : B)(el("rig"), [{ transform: rigAt(from) }, { transform: rigAt(to) }], o);
      (first ? A : B)(el("world"), [{ transform: worldAt(from) }, { transform: worldAt(to) }], o);
    };

    const all = (prefix: string) => Object.keys(refs.current).filter((k) => k.startsWith(prefix)).map(el);
    const away: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];

    let last: Animation;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Same story, told with fades and no travel.
      (el("rig") as HTMLElement).style.transform = rigAt(600);
      (el("world") as HTMLElement).style.transform = worldAt(600);
      const F = (target: Element, delay: number, from = 0, to = 1) =>
        A(target, [{ opacity: from }, { opacity: to }], { delay, duration: 300, easing: OUT });
      F(el("det"), 100);
      F(el("glass"), 100);
      F(el("ex"), 700);
      F(el("bubble"), 800);
      F(el("hiNormal"), 700, 1, 0);
      F(el("hiStar"), 700);
      const SEAL = 2200;
      ["container", "det", "ex", "bubble", "world", "tint", "shine", "ground"].forEach((k) =>
        B(el(k), away, { delay: SEAL, duration: 300, easing: OUT }),
      );
      B(el("rig"), [{ transform: rigAt(600) }, { transform: "translate(600px, 300px)" }], { delay: SEAL, duration: 1 });
      F(el("logo"), SEAL + 100);
      all("word").forEach((w) => F(w, SEAL + 250));
      last = B(overlay, away, { delay: SEAL + 1500, duration: 400, easing: OUT });
    } else {
      // 1 · The container drops in and lands with a squash. The overlay itself
      // starts opaque — fading it in would flash the page underneath.
      A(
        el("container"),
        [
          { transform: "translateY(-620px) scale(.94,1.08)", offset: 0, easing: GRAVITY },
          { transform: "translateY(0) scale(.96,1.05)", offset: 0.55, easing: OUT },
          { transform: "translateY(0) scale(1.06,.88)", offset: 0.7, easing: OUT },
          { transform: "translateY(0) scale(.98,1.03)", offset: 0.85, easing: OUT },
          { transform: "translateY(0) scale(1,1)" },
        ],
        { delay: 120, duration: 820 },
      );
      all("dust").forEach((d, i) =>
        A(
          d,
          [
            // Starts invisible so the puffs can't show before the container lands.
            { opacity: 0, transform: "translate(0,0) scale(.4)" },
            { opacity: 1, offset: 0.08 },
            { opacity: 0, transform: `translate(${i < 2 ? -46 : 46}px,-26px) scale(1.5)` },
          ],
          { delay: 560 + (i % 2) * 40, duration: 620, easing: OUT },
        ),
      );

      // 2 · The detective tiptoes in, glass to the wall, and walks past the find.
      const IN = 1000;
      const WALK = 1750;
      const STOP = IN + WALK;
      A(el("det"), [{ opacity: 0 }, { opacity: 1 }], { delay: IN, duration: 200, easing: OUT });
      A(el("glass"), [{ opacity: 0 }, { opacity: 1 }], { delay: IN, duration: 200, easing: OUT });
      move(1460, 360, { delay: IN, duration: WALK, easing: SINE }, true);
      const step = { delay: IN, direction: "alternate", easing: "ease-in-out", fill: "none" } as const;
      A(el("bob"), [{ transform: "translateY(0)" }, { transform: "translateY(-8px)" }], { ...step, duration: 146, iterations: 12 });
      A(el("legL"), [{ transform: "rotate(20deg)" }, { transform: "rotate(-20deg)" }], { ...step, duration: 292, iterations: 6 });
      A(el("legR"), [{ transform: "rotate(-20deg)" }, { transform: "rotate(20deg)" }], { ...step, duration: 292, iterations: 6 });
      A(el("blink"), [{ transform: "scaleY(1)" }, { transform: "scaleY(.12)" }, { transform: "scaleY(1)" }], {
        delay: IN + 700,
        duration: 160,
        easing: "ease-in-out",
        fill: "none",
      });

      // 3 · Double-take: "?" and a glance back at what it just passed.
      A(el("q"), [{ opacity: 0, transform: "translateY(14px) scale(.5)" }, { opacity: 1, transform: "none" }], { delay: STOP, ...POP });
      B(el("q"), away, { delay: STOP + 380, duration: 160, easing: OUT });
      A(el("eyes"), [{ transform: "translateX(0)" }, { transform: "translateX(7px)" }], { delay: STOP + 60, duration: 140, easing: OUT });
      B(el("eyes"), [{ transform: "translateX(7px)" }, { transform: "translateX(0)" }], { delay: STOP + 560, duration: 140, easing: OUT });

      // 4 · Anticipation, then a dash back with speed lines and a landing squash.
      const DASH = STOP + 480;
      A(el("squash"), [{ transform: "scale(1)" }, { transform: "scale(1.06,.9) translateX(-8px)" }], {
        delay: DASH - 140,
        duration: 140,
        easing: OUT,
      });
      B(el("squash"), [{ transform: "scale(.9,1.1)" }, { transform: "scale(1)" }], { delay: DASH, ...SOFT });
      move(360, 600, { delay: DASH, ...ZIP });
      A(
        el("speed"),
        [{ opacity: 0, transform: "translateX(40px)" }, { opacity: 1, offset: 0.25 }, { opacity: 0, transform: "translateX(-60px)" }],
        { delay: DASH, duration: 420, easing: OUT },
      );

      // 5 · Found it: "!", focus lines, starry eyes, and the verdict bubble.
      const FOUND = DASH + 300;
      A(el("ex"), [{ opacity: 0, transform: "translateY(18px) scale(.4) rotate(-12deg)" }, { opacity: 1, transform: "none" }], {
        delay: FOUND,
        ...POP,
      });
      A(el("focus"), [{ opacity: 0, transform: "scale(1.08)" }, { opacity: 1, transform: "scale(1)" }], {
        delay: FOUND,
        duration: 260,
        easing: OUT,
      });
      A(el("hiNormal"), away, { delay: FOUND, duration: 120 });
      A(el("hiStar"), [{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1)" }], { delay: FOUND, ...POP });
      A(el("mouth"), away, { delay: FOUND, duration: 100 });
      A(el("mouthO"), [{ opacity: 0 }, { opacity: 1 }], { delay: FOUND, duration: 100 });
      A(el("bubble"), [{ opacity: 0, transform: "scale(.5) rotate(-6deg)" }, { opacity: 1, transform: "none" }], {
        delay: FOUND + 160,
        ...POP,
      });

      // 6 · Everything clears; the glass becomes the company seal.
      const SEAL = FOUND + 950;
      B(el("focus"), away, { delay: SEAL, duration: 260, easing: OUT });
      A(el("ground"), away, { delay: SEAL, duration: 360, easing: OUT });
      B(el("ex"), away, { delay: SEAL, duration: 200, easing: OUT });
      B(el("bubble"), [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.8)" }], { delay: SEAL, duration: 220, easing: OUT });
      B(el("container"), [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(20px) scale(.97)" }], {
        delay: SEAL,
        duration: 360,
        easing: OUT,
      });
      B(el("det"), [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translate(70px,50px) rotate(8deg)" }], {
        delay: SEAL,
        duration: 360,
        easing: OUT,
      });
      ["world", "tint", "shine"].forEach((k) => A(el(k), away, { delay: SEAL, duration: 300, easing: OUT }));
      B(el("rig"), [{ transform: rigAt(600) }, { transform: "translate(600px, 300px)" }], { delay: SEAL, ...SOFT });
      B(
        el("glass"),
        [
          { transform: "scale(1)", boxShadow: "0 0 0 7px #3B5470,0 0 0 12px #10202E,0 18px 0 8px rgba(4,16,29,.35)" },
          { transform: "scale(1.3)", boxShadow: "0 0 0 6px #1F9BDC,0 0 0 10px #10202E,0 14px 0 6px rgba(4,16,29,.35)" },
        ],
        { delay: SEAL, ...SOFT },
      );
      A(el("logo"), [{ opacity: 0, transform: "scale(.6) rotate(-20deg)" }, { opacity: 1, transform: "none" }], {
        delay: SEAL + 140,
        ...POP,
      });
      all("spark").forEach((sp, i) =>
        A(
          sp,
          [
            { opacity: 0, transform: "scale(.3) rotate(-90deg)" },
            { opacity: 1, transform: "scale(1) rotate(0)", offset: 0.55 },
            { opacity: 0, transform: "scale(.6) rotate(45deg)" },
          ],
          { delay: SEAL + 260 + i * 55, duration: 900, easing: OUT },
        ),
      );
      all("word").forEach((w, i) =>
        A(w, [{ opacity: 0, transform: "translateY(26px) scale(.9)" }, { opacity: 1, transform: "none" }], {
          delay: SEAL + 320 + i * 80,
          ...POP,
        }),
      );

      // 7 · Iris out onto the page, closing on the seal last.
      const cy = window.innerHeight / 2 + (300 - 350) * s;
      last = B(overlay, [{ clipPath: `circle(150% at 50% ${cy}px)` }, { clipPath: `circle(0% at 50% ${cy}px)` }], {
        delay: SEAL + 1500,
        duration: 700,
        easing: IN_OUT,
      });
    }

    last.finished.then(finish).catch(() => {});

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", onKey);
      anims.current.forEach((a) => a.cancel());
      anims.current = [];
    };
    // The timeline is built once per mount; `finish` is stable for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function skip() {
    const overlay = refs.current.overlay as HTMLElement | null;
    if (!overlay || finished.current) return;
    const out = overlay.animate([{ opacity: getComputedStyle(overlay).opacity }, { opacity: 0 }], {
      duration: 220,
      easing: OUT,
      fill: "forwards",
    });
    anims.current.push(out);
    out.finished.then(finish).catch(() => {});
  }

  return (
    <div ref={ref("overlay")} className="si-overlay">
      <div ref={ref("stage")} className="si-stage" aria-hidden="true">
        {/* Backdrop: manga screentone and a quay to stand on */}
        <svg className="si-layer" viewBox="0 0 1200 700">
          <defs>
            <pattern id="si-tone" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="9" cy="9" r="1.6" fill="#7FCFF5" opacity=".16" />
            </pattern>
            <radialGradient id="si-tone-fade" cx="50%" cy="45%" r="60%">
              <stop offset="35%" stopColor="#fff" stopOpacity="0" />
              <stop offset="100%" stopColor="#fff" stopOpacity="1" />
            </radialGradient>
            <mask id="si-tone-mask">
              <rect width="1200" height="700" fill="url(#si-tone-fade)" />
            </mask>
          </defs>
          <rect x="-400" y="-300" width="2000" height="1300" fill="url(#si-tone)" mask="url(#si-tone-mask)" />
          <g ref={ref("ground")}>
            <rect x="-400" y="548" width="2000" height="500" fill="#0A2238" />
            <path d="M-400 548H1600" stroke="#2C6E9E" strokeWidth="5" />
            <ellipse cx="600" cy="552" rx="470" ry="16" fill="#000" opacity=".35" />
          </g>
        </svg>

        {/* Focus lines for the "found it" beat */}
        <svg ref={ref("focus")} className="si-layer" viewBox="0 0 1200 700" style={{ opacity: 0 }}>
          {FOCUS_LINES.map((l, i) => (
            <path key={i} d={l.d} fill="#fff" opacity={l.opacity.toFixed(2)} />
          ))}
        </svg>

        {/* The container */}
        <svg className="si-layer" viewBox="0 0 1200 700" style={{ direction: "ltr" }}>
          <g ref={ref("container")} className="si-foot">
            <rect x="160" y="220" width="880" height="320" rx="16" fill="#E8834F" />
            <path d="M163 468H1037V524Q1037 537 1024 537H176Q163 537 163 524Z" fill="#C8653A" />
            <rect x="186" y="238" width="690" height="10" rx="5" fill="#F7AA7B" />
            {CORRUGATION.map((x) => (
              <g key={x}>
                <path d={`M${x} 262V500`} stroke="#C2602F" strokeWidth="6" strokeLinecap="round" />
                <path d={`M${x + 7} 266V496`} stroke="#F6A473" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
              </g>
            ))}
            <rect x="892" y="230" width="140" height="300" rx="8" fill="#D2703F" />
            <path d="M962 232V528" stroke="#10202E" strokeWidth="5" />
            <g fill="#24435F" className="si-o" style={{ strokeWidth: 4 }}>
              <rect x="904" y="246" width="12" height="268" rx="6" />
              <rect x="934" y="246" width="12" height="268" rx="6" />
              <rect x="978" y="246" width="12" height="268" rx="6" />
              <rect x="1008" y="246" width="12" height="268" rx="6" />
            </g>
            <g fill="#5E7F9C" className="si-o" style={{ strokeWidth: 4 }}>
              <rect x="898" y="362" width="24" height="18" rx="5" />
              <rect x="928" y="362" width="24" height="18" rx="5" />
              <rect x="972" y="362" width="24" height="18" rx="5" />
              <rect x="1002" y="362" width="24" height="18" rx="5" />
            </g>
            <rect x="944" y="326" width="30" height="18" rx="5" fill="#FFD23F" className="si-o" style={{ strokeWidth: 4 }} />
            <text
              ref={ref("cName")}
              x={rtl ? PANEL_END : PANEL_START}
              y="334"
              direction={rtl ? "rtl" : "ltr"}
              fontSize="66"
              fontWeight="700"
              fill="#FFF3E2"
              stroke="#10202E"
              strokeWidth="7"
              paintOrder="stroke"
              letterSpacing={spaced ? 3 : 0}
            >
              {t("companyName").toLocaleUpperCase(lang)}
            </text>
            <text
              ref={ref("cTag")}
              x={rtl ? PANEL_END - 4 : PANEL_START + 4}
              y="374"
              direction={rtl ? "rtl" : "ltr"}
              fontSize={rtl ? 26 : 21}
              fontWeight="700"
              fill="#FFE6CF"
              letterSpacing={spaced ? 4 : 0}
            >
              {t("companyTagline").toLocaleUpperCase(lang)}
            </text>
            <text x={rtl ? PANEL_END - 4 : PANEL_START + 4} y="470" direction="ltr" textAnchor={rtl ? "end" : "start"} fontSize="26" fontWeight="700" fill="#FFF3E2" letterSpacing="2">
              ALDW 170202 2
            </text>
            <g fill="#3A2216" className="si-o" style={{ strokeWidth: 4 }}>
              <rect x="152" y="212" width="40" height="40" rx="8" />
              <rect x="1008" y="212" width="40" height="40" rx="8" />
              <rect x="152" y="506" width="40" height="40" rx="8" />
              <rect x="1008" y="506" width="40" height="40" rx="8" />
            </g>
            <rect x="160" y="220" width="880" height="320" rx="16" fill="none" className="si-o" style={{ strokeWidth: 7 }} />
          </g>
        </svg>

        {/* Landing dust */}
        <svg className="si-layer" viewBox="0 0 1200 700">
          <g fill="#E6F2FA" className="si-o" style={{ strokeWidth: 4 }}>
            {[
              [150, 530, 26],
              [110, 540, 18],
              [1050, 530, 26],
              [1092, 540, 18],
            ].map(([cx, cy, r], i) => (
              <circle key={i} ref={ref(`dust${i}`)} className="si-self" cx={cx} cy={cy} r={r} opacity="0" />
            ))}
          </g>
        </svg>

        <div ref={ref("bubble")} className="si-bubble">
          <span>{t("introConforms")}</span>
          <span className="si-tick">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#10202E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* Rig: detective, glass, and everything that travels with them */}
        <div ref={ref("rig")} className="si-rig">
          <svg ref={ref("speed")} className="si-speed" viewBox="0 0 220 300">
            <g stroke="#fff" strokeLinecap="round">
              <path d="M20 40H200" strokeWidth="6" />
              <path d="M70 92H210" strokeWidth="4" />
              <path d="M10 150H190" strokeWidth="7" />
              <path d="M60 206H215" strokeWidth="4" />
              <path d="M30 258H180" strokeWidth="5" />
            </g>
          </svg>

          {/* The detective, drawn in lens-centred coordinates */}
          <svg ref={ref("det")} className="si-det" viewBox="-160 -220 460 420">
            <ellipse cx="205" cy="180" rx="58" ry="9" fill="#000" opacity=".35" />
            <g ref={ref("squash")} className="si-foot">
              <g ref={ref("bob")}>
                <path d="M66 66L142 142" stroke="#10202E" strokeWidth="24" strokeLinecap="round" />
                <path d="M66 66L142 142" stroke="#8A5530" strokeWidth="14" strokeLinecap="round" />
                <g ref={ref("legL")} className="si-hip">
                  <rect x="182" y="132" width="18" height="40" rx="8" fill="#2B3F5C" className="si-o" style={{ strokeWidth: 4 }} />
                  <ellipse cx="186" cy="173" rx="16" ry="8.5" fill="#5B3A24" className="si-o" style={{ strokeWidth: 4 }} />
                </g>
                <g ref={ref("legR")} className="si-hip">
                  <rect x="212" y="132" width="18" height="40" rx="8" fill="#2B3F5C" className="si-o" style={{ strokeWidth: 4 }} />
                  <ellipse cx="220" cy="173" rx="16" ry="8.5" fill="#5B3A24" className="si-o" style={{ strokeWidth: 4 }} />
                </g>
                {/* coat */}
                <path d="M176 60Q205 52 234 60L256 150Q205 162 154 150Z" fill="#E7B062" />
                <path d="M222 62L234 60L256 150Q241 154 228 156Z" fill="#CF9446" />
                <rect x="163" y="112" width="84" height="11" fill="#7E4F27" />
                <path d="M190 58L205 82L220 58Z" fill="#F6D193" className="si-o" style={{ strokeWidth: 4 }} />
                {/* company patch on the chest */}
                <clipPath id="si-patch">
                  <circle cx="221" cy="98" r="19" />
                </clipPath>
                <circle cx="221" cy="98" r="19" fill="#fff" />
                <image href={logo} x="202" y="79" width="38" height="38" clipPath="url(#si-patch)" />
                <circle cx="221" cy="98" r="19" fill="none" className="si-o" style={{ strokeWidth: 3.5 }} />
                <circle cx="205" cy="138" r="3.6" fill="#10202E" />
                <path d="M176 60Q205 52 234 60L256 150Q205 162 154 150Z" fill="none" className="si-o" />
                {/* arm + hand */}
                <path d="M182 74Q150 98 128 124" stroke="#10202E" strokeWidth="27" strokeLinecap="round" fill="none" />
                <path d="M182 74Q150 98 128 124" stroke="#E7B062" strokeWidth="17" strokeLinecap="round" fill="none" />
                <circle cx="126" cy="126" r="14" fill="#FFE2C6" className="si-o" style={{ strokeWidth: 4 }} />
                {/* head */}
                <circle cx="205" cy="10" r="52" fill="#FFE2C6" />
                <path d="M232 -30A52 52 0 0 1 238 50Q250 10 232 -30Z" fill="#F7C9A4" />
                <circle cx="205" cy="10" r="52" fill="none" className="si-o" />
                <ellipse cx="168" cy="36" rx="9" ry="5" fill="#FF8FA0" opacity=".6" />
                <ellipse cx="234" cy="36" rx="9" ry="5" fill="#FF8FA0" opacity=".6" />
                <g ref={ref("eyes")}>
                  <g ref={ref("blink")} className="si-self">
                    <ellipse cx="182" cy="18" rx="9.5" ry="13" fill="#10202E" />
                    <ellipse cx="214" cy="18" rx="9.5" ry="13" fill="#10202E" />
                    <g ref={ref("hiNormal")} fill="#fff">
                      <circle cx="178.5" cy="11" r="3.8" />
                      <circle cx="185" cy="24" r="1.9" />
                      <circle cx="210.5" cy="11" r="3.8" />
                      <circle cx="217" cy="24" r="1.9" />
                    </g>
                    <g ref={ref("hiStar")} fill="#FFE27A" opacity="0">
                      <path d="M182 6L185 15L194 18L185 21L182 30L179 21L170 18L179 15Z" />
                      <path d="M214 6L217 15L226 18L217 21L214 30L211 21L202 18L211 15Z" />
                    </g>
                  </g>
                </g>
                <path ref={ref("mouth")} d="M197 42Q203 47 209 42" stroke="#10202E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path ref={ref("mouthO")} d="M195 39Q203 56 211 39Z" fill="#7A2230" className="si-o" style={{ strokeWidth: 3.5 }} opacity="0" />
                {/* hair + deerstalker in brand blue */}
                <path d="M157 -6Q170 14 180 -2Q192 16 204 -2Q216 14 228 -2Q242 14 253 -6Z" fill="#22344D" className="si-o" style={{ strokeWidth: 4 }} />
                <path d="M156 -16Q128 -16 108 -2Q136 7 166 -4Z" fill="#1B86C4" className="si-o" style={{ strokeWidth: 4 }} />
                <path d="M254 -16Q282 -14 298 0Q272 7 244 -4Z" fill="#1B86C4" className="si-o" style={{ strokeWidth: 4 }} />
                <path d="M152 -10Q155 -78 205 -82Q255 -78 258 -10Q205 0 152 -10Z" fill="#2BA6E8" />
                <g stroke="#9EDFFB" strokeWidth="4" fill="none" opacity=".85">
                  <path d="M182 -74Q172 -40 174 -6" />
                  <path d="M228 -74Q238 -40 236 -6" />
                  <path d="M156 -42H254" />
                </g>
                <path d="M152 -10Q155 -78 205 -82Q255 -78 258 -10Q205 0 152 -10Z" fill="none" className="si-o" />
                <ellipse cx="195" cy="-82" rx="10" ry="6.5" fill="#1B86C4" className="si-o" style={{ strokeWidth: 3.5 }} />
                <ellipse cx="215" cy="-82" rx="10" ry="6.5" fill="#1B86C4" className="si-o" style={{ strokeWidth: 3.5 }} />
                <circle cx="205" cy="-82" r="5" fill="#2BA6E8" className="si-o" style={{ strokeWidth: 3.5 }} />
              </g>
            </g>
          </svg>

          <div ref={ref("glass")} className="si-glass">
            <div ref={ref("world")} className="si-world" style={{ transform: worldAt(1460) }}>
              <Interior />
            </div>
            <div ref={ref("tint")} className="si-tint" />
            <svg ref={ref("shine")} className="si-shine" viewBox="-120 -120 240 240">
              <path d="M-86 -30A92 92 0 0 1 -32 -86" stroke="#fff" strokeWidth="12" strokeLinecap="round" fill="none" opacity=".9" />
              <circle cx="-92" cy="2" r="6" fill="#fff" opacity=".9" />
            </svg>
          </div>

          <div ref={ref("logo")} className="si-logo">
            <img src={logo} alt="" width={268} height={268} />
          </div>

          <span ref={ref("q")} className="si-pop si-q">?</span>
          <span ref={ref("ex")} className="si-pop si-ex">!</span>
          {SPARKS.map(([x, y], i) => (
            <span key={i} ref={ref(`spark${i}`)} className="si-spark" style={{ left: x, top: y }}>
              <svg viewBox="-20 -20 40 40" width="40" height="40">
                <path d="M0 -18L5 -5L18 0L5 5L0 18L-5 5L-18 0L-5 -5Z" fill="#FFE27A" stroke="#10202E" strokeWidth="3.5" strokeLinejoin="round" />
              </svg>
            </span>
          ))}
        </div>

        <div className="si-wordmark">
          <p ref={ref("word0")} className="si-name">{t("companyName")}</p>
          <p ref={ref("word1")} className="si-sub">{t("companyTagline")}</p>
          <p ref={ref("word2")} className="si-tag">{t("introTagline")}</p>
        </div>
      </div>

      <button type="button" className="si-skip" onClick={skip}>
        {t("introSkip")}
      </button>
    </div>
  );
}

/** The container's inside, as seen through the glass. Same footprint as the
 *  shell so the edges register as the lens moves. */
function Interior() {
  return (
    <svg viewBox="0 0 1200 700" width="1200" height="700" style={{ direction: "ltr" }}>
      <defs>
        <pattern id="si-tone-in" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#0F3A60" />
          <circle cx="8" cy="8" r="1.8" fill="#5FC6F2" opacity=".35" />
        </pattern>
        <radialGradient id="si-glow">
          <stop offset="0%" stopColor="#FFE27A" stopOpacity=".95" />
          <stop offset="100%" stopColor="#FFE27A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#si-tone-in)" />
      <rect y="548" width="1200" height="152" fill="#0A2238" />

      <rect x="160" y="220" width="880" height="320" rx="16" fill="#1D507D" />
      {PLANKS.map((x) => (
        <path key={x} d={`M${x} 226V500`} stroke="#2A6496" strokeWidth="3" />
      ))}
      <rect x="163" y="500" width="874" height="37" fill="#143D61" />
      <circle cx="600" cy="244" r="40" fill="url(#si-glow)" opacity=".5" />
      <rect x="584" y="230" width="32" height="12" rx="6" fill="#FFE27A" className="si-o" style={{ strokeWidth: 3.5 }} />

      {/* sacks */}
      <g className="si-o" fill="#F2DFB0" style={{ strokeWidth: 4.5 }}>
        <path d="M200 524Q195 452 222 430Q234 420 246 430Q274 452 268 524Z" />
        <path d="M258 524Q252 426 286 400Q298 390 310 400Q342 426 336 524Z" />
        <path d="M225 436Q222 384 246 368Q256 362 266 368Q290 384 285 436Z" />
      </g>
      <g stroke="#C9A867" strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d="M226 446Q234 452 244 446" />
        <path d="M288 410Q298 416 308 410" />
        <path d="M246 376Q256 381 266 376" />
      </g>

      {/* drums */}
      <g className="si-o" style={{ strokeWidth: 4.5 }}>
        <rect x="368" y="372" width="60" height="152" rx="16" fill="#3D8FD6" />
        <rect x="434" y="372" width="60" height="152" rx="16" fill="#2F7CC2" />
      </g>
      <path d="M376 410H420M376 486H420M442 410H486M442 486H486" stroke="#8FD0FA" strokeWidth="5" strokeLinecap="round" />

      {/* the find: a glowing crate on a plain one */}
      <circle cx="600" cy="392" r="120" fill="url(#si-glow)" opacity=".75" />
      <g className="si-o" style={{ strokeWidth: 4.5 }}>
        <rect x="534" y="450" width="132" height="84" rx="6" fill="#DE9C55" />
        <rect x="546" y="336" width="108" height="114" rx="8" fill="#FFC94A" />
        <rect x="546" y="336" width="108" height="20" rx="8" fill="#FFE08A" />
      </g>
      <path d="M534 450L666 534M666 450L534 534" stroke="#B5743A" strokeWidth="5" />
      <path d="M572 398L592 418L628 376" stroke="#10202E" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M572 398L592 418L628 376" stroke="#3FD68A" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <g fill="#FFF6C9" className="si-o" style={{ strokeWidth: 3 }}>
        <path className="si-tw" d="M528 316l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" />
        <path className="si-tw" d="M676 332l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
        <path className="si-tw" d="M660 290l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      </g>

      {/* crates */}
      <g className="si-o" style={{ strokeWidth: 4.5 }}>
        <rect x="704" y="446" width="92" height="88" rx="5" fill="#E0A15A" />
        <rect x="716" y="358" width="92" height="88" rx="5" fill="#EBB46F" />
        <rect x="800" y="494" width="44" height="40" rx="4" fill="#D69250" />
      </g>
      <path d="M704 446L796 534M796 446L704 534M716 358L808 446M808 358L716 446" stroke="#A86B33" strokeWidth="5" />

      {/* boxes by the door */}
      <g className="si-o" style={{ strokeWidth: 4.5 }}>
        <rect x="866" y="452" width="80" height="82" rx="5" fill="#D9A770" />
        <rect x="952" y="470" width="76" height="64" rx="5" fill="#CF9A62" />
        <rect x="880" y="380" width="88" height="72" rx="5" fill="#E3B47F" />
      </g>
      <path d="M906 452V534M990 470V534M924 380V452" stroke="#F4DDB0" strokeWidth="8" />

      <rect x="160" y="220" width="880" height="320" rx="16" fill="none" className="si-o" style={{ strokeWidth: 7 }} />
    </svg>
  );
}
