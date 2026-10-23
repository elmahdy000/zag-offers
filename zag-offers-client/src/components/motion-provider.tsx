"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Honour the OS "reduce motion" preference for every framer-motion animation.
 *
 * The CSS-only `prefers-reduced-motion` block in `globals.css` cannot reach
 * JS-driven animations, so most of the site kept sliding/fading for users who
 * explicitly asked for less motion (WCAG 2.3.3).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
