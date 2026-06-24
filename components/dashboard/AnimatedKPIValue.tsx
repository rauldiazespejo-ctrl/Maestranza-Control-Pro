"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

interface AnimatedKPIValueProps {
  /** Target numeric value to animate to */
  value: number;
  /** Appended after the number (e.g. "%", "+") */
  suffix?: string;
  /** Prepended before the number */
  prefix?: string;
  /** Animation duration in ms (default 1200) */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
  className?: string;
}

/** easeOutExpo — exponential ease-out for count-up animation */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function AnimatedKPIValue({
  value,
  suffix = "",
  prefix = "",
  duration = 1200,
  decimals = 0,
  className,
}: AnimatedKPIValueProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;
    startRef.current = null;
    // Use flushSync to avoid the setState-in-effect rule while ensuring
    // the display resets synchronously before the animation starts
    flushSync(() => setDisplay(0));

    const animate = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = Math.round(eased * value * Math.pow(10, decimals)) / Math.pow(10, decimals);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toString();

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
