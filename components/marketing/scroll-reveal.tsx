"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

/** Apple-style easing — slow out, crisp settle */
const APPLE_EASE = [0.22, 1, 0.36, 1] as const;

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.965 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.9, ease: APPLE_EASE },
  },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: APPLE_EASE },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.85, ease: APPLE_EASE },
  },
};

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  variant = "apple",
}: {
  children: ReactNode;
  className?: string;
  /** Delay in ms */
  delay?: number;
  variant?: "apple" | "fade";
}) {
  const reduce = useReducedMotion();
  const variants = variant === "fade" ? fadeVariants : revealVariants;

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.14, margin: "0px 0px -6% 0px" }}
      variants={variants}
      transition={{ delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealStagger({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08, margin: "0px 0px -4% 0px" }}
      variants={staggerContainerVariants}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}

/** Continuous scroll-linked scale — Apple product-page feel */
export function ScrollScaleIn({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.35"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.55, 1]);

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  );
}

/** Subtle vertical parallax for images and media blocks */
export function ScrollParallax({
  children,
  className = "",
  speed = 0.12,
}: {
  children: ReactNode;
  className?: string;
  /** 0.08 = subtle, 0.2 = pronounced */
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 80, -speed * 80]);

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Hero copy fades and lifts as you scroll past the fold */
export function HeroScrollFade({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 380], [1, 0]);
  const y = useTransform(scrollY, [0, 380], [0, 64]);
  const scale = useTransform(scrollY, [0, 380], [1, 0.97]);

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <motion.div style={{ opacity, y, scale }} className="will-change-transform">
      {children}
    </motion.div>
  );
}
