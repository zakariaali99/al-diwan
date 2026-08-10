import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

import { images } from "@/assets/generated/manifest";
import { useLinkTo, useT } from "@/lib/hooks";
import { ArrowIcon, ShieldCheckIcon } from "./Icons";

/**
 * Full-bleed hero built on the company's own photograph of a container ship.
 *
 * The image is the backdrop rather than a framed element, with three layered
 * motions — a slow Ken-Burns drift, scroll-linked parallax, and a drifting
 * light sweep — plus a heavy scrim so the type stays legible over it. Every
 * animation is suppressed when the visitor prefers reduced motion.
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

  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "38%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[clamp(34rem,88vh,52rem)] items-center overflow-hidden bg-brand-950 text-white"
    >
      {/* Backdrop photograph */}
      <motion.div
        className="absolute inset-0 -z-30"
        style={reduceMotion ? undefined : { y: backdropY, scale: backdropScale }}
      >
        {/* LQIP underneath, so the section is never a flat empty block */}
        <span
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${images.heroBackdrop.lqip}")`, transform: "scale(1.05)" }}
        />
        <img
          src={images.heroBackdrop.src}
          srcSet={images.heroBackdrop.srcSet}
          sizes="100vw"
          alt={t("shipAlt")}
          width={images.heroBackdrop.width}
          height={images.heroBackdrop.height}
          loading="eager"
          fetchPriority="high"
          className={`h-full w-full object-cover ${reduceMotion ? "" : "animate-ken-burns"}`}
        />
      </motion.div>

      {/* Scrim: dark enough for AA contrast on the copy, and heavier on the
          text side so the photo still reads on the other. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-brand-950/92 via-brand-950/75 to-brand-950/92"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-r from-brand-950/85 via-brand-950/35 to-transparent rtl:bg-gradient-to-l"
      />

      {/* Measurement grid — the inspection motif */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 80%)",
        }}
      />

      {/* Slow light sweep, like a scanner passing over the cargo */}
      {!reduceMotion && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -z-10 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
        />
      )}

      <motion.div
        className="container-page relative py-24"
        style={reduceMotion ? undefined : { y: copyY, opacity: copyOpacity }}
      >
        <div className="max-w-2xl">
          <span className="eyebrow text-brand-300">
            <span aria-hidden className="h-0.5 w-7 rounded bg-rust-400" />
            {t("heroEyebrow")}
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>

          {lede && (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200">{lede}</p>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={linkTo("contact-us/")} className="btn-accent group">
              {t("contact")}
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
                className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/[0.09] px-4 py-3 backdrop-blur-md"
                animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: index * 0.8 }}
              >
                <ShieldCheckIcon className="h-5 w-5 shrink-0 text-rust-400" />
                <span>
                  <strong className="block text-sm font-semibold leading-tight text-white">
                    {badge.code}
                  </strong>
                  <span className="text-xs text-slate-300">{badge.label}</span>
                </span>
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Fades the photo into the section below instead of a hard edge */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
