import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Scroll-triggered fade/rise. Framer Motion already disables transforms when
 *  the OS asks for reduced motion via `useReducedMotion` internally on
 *  `whileInView` variants that only animate opacity/transform. */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
