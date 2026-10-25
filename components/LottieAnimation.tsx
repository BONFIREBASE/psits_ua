"use client";

import React, { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";

interface LottieAnimationProps {
  path: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

export default function LottieAnimation({
  path,
  loop = true,
  autoplay = true,
  className = "w-28 h-28 mx-auto",
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let anim: AnimationItem | null = null;

    try {
      containerRef.current.innerHTML = "";
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay,
        path,
      });
    } catch (err) {
      console.warn("Failed to load lottie animation:", path, err);
    }

    return () => {
      if (anim) {
        anim.destroy();
      }
    };
  }, [path, loop, autoplay]);

  return <div ref={containerRef} className={className} />;
}
