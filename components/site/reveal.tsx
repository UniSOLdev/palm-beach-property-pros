"use client";

import { createElement, useEffect, useRef, type ReactNode } from "react";

/** Understated fade-up on first view. No-op for reduced motion (see globals.css). */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return createElement(
    as,
    { ref, className: `reveal ${className}`, style: delay ? { transitionDelay: `${delay}ms` } : undefined },
    children,
  );
}
