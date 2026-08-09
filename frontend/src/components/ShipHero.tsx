import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

import ship from "@/assets/ship.webp";
import shipSmall from "@/assets/ship-sm.webp";
import { useLinkTo, useT } from "@/lib/hooks";
import { ArrowIcon, ShieldCheckIcon } from "./Icons";

/**
 * Hero built around the company's own photograph of a container ship at port.
 * Three layered motions, all GPU-friendly transforms:
 *   1. a slow continuous Ken-Burns drift (CSS keyframes)
 *   2. scroll-linked parallax on the image and its frame
 *   3. floating ISO badges
 * All are suppressed when the visitor prefers reduced motion.
 */
export default function ShipHero({ lede }: { lede?: string }) {
  const t = useT();
  const linkTo = useLinkTo();
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const frameY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-brand-950 py-20 text-white lg:py-28"
    >
      {/* Measurement grid — the "inspection" motif, masked so it fades out */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 75% 65% at 70% 35%, #000 20%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 70% 35%, #000 20%, transparent 78%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -end-32 -top-32 -z-10 h-[36rem] w-[36rem] rounded-full bg-brand-500/20 blur-3xl"
      />

      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div style={reduceMotion ? undefined : { opacity: copyOpacity }}>
          <span className="eyebrow text-brand-300">
            <span aria-hidden className="h-0.5 w-7 rounded bg-rust-400" />
            {t("heroEyebrow")}
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>

          {lede && (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">{lede}</p>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={linkTo("contact-us/")} className="btn-accent group">
              {t("requestQuote")}
              <ArrowIcon className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
            <Link to={linkTo("services/")} className="btn-on-dark">
              {t("exploreServices")}
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { code: "ISO 9001:2015", label: t("qualityManagement") },
              { code: "ISO/IEC 17020:2012", label: t("inspectionBodies") },
            ].map((badge, index) => (
              <motion.span
                key={badge.code}
                className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 backdrop-blur"
                animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.8,
                }}
              >
                <ShieldCheckIcon className="h-5 w-5 shrink-0 text-rust-400" />
                <span>
                  <strong className="block text-sm font-semibold leading-tight text-white">
                    {badge.code}
                  </strong>
                  <span className="text-xs text-slate-400">{badge.label}</span>
                </span>
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* The real photograph, in a bold organic frame */}
        <motion.div
          className="relative"
          style={reduceMotion ? undefined : { y: frameY }}
        >
          <div
            className="relative overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10"
            style={{ borderRadius: "48% 52% 44% 56% / 42% 40% 60% 58%" }}
          >
            <motion.img
              src={ship}
              srcSet={`${shipSmall} 800w, ${ship} 1400w`}
              sizes="(max-width: 1024px) 100vw, 45vw"
              alt={t("shipAlt")}
              width={1400}
              height={933}
              className={`h-full w-full object-cover ${reduceMotion ? "" : "animate-ken-burns"}`}
              style={reduceMotion ? undefined : { y: imageY }}
              loading="eager"
              fetchPriority="high"
            />
            {/* Sheen sweep, echoing a scanner passing over the cargo */}
            {!reduceMotion && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -start-1/3 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            )}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/45 via-transparent to-transparent"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
