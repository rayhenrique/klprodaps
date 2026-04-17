"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  className?: string;
  suffix?: string;
  prefix?: string;
};

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function AnimatedCounter({
  value,
  className,
  suffix = "",
  prefix = "",
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(() => Math.round(motionValue.get()));
  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(rounded, "change", (latest) => {
    setDisplayValue(latest);
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.4,
      ease: smoothEase,
    });

    return () => controls.stop();
  }, [motionValue, value]);

  return (
    <motion.span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </motion.span>
  );
}
