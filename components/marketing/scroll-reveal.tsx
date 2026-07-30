"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type RevealState = "pending" | "shown" | "waiting";

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /** Start pending so content is visible until we measure (avoids stuck opacity-0 on first paint). */
  const [state, setState] = useState<RevealState>("pending");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setState("shown");
      return;
    }

    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (inView) {
      setState("shown");
      return;
    }

    setState("waiting");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hidden = state === "waiting";

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        hidden ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{ transitionDelay: hidden ? undefined : `${delay}ms` }}
    >
      {children}
    </div>
  );
}
