'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import Image from 'next/image';
import type { AnimationItem } from 'lottie-web';

// Target unlock timestamp: Monday, September 28, 2026 at 12:00:00 PHT (UTC+8)
const SUBMISSION_OPENS_STRING = '2026-09-28T12:00:00+08:00';
const SUBMISSION_OPENS_TIMESTAMP = new Date(SUBMISSION_OPENS_STRING).getTime();

function getTimeSnapshot() {
  const now = Date.now();
  const diff = SUBMISSION_OPENS_TIMESTAMP - now;
  if (diff <= 0) {
    return '0:0:0:0:1';
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return `${days}:${hours}:${minutes}:${seconds}:0`;
}

function subscribeSecondTimer(callback: () => void) {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

function getIsBypassed() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('bypass') === 'true';
}

function subscribeBypass(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

export default function SubmissionLockWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const timeSnapshot = useSyncExternalStore(
    subscribeSecondTimer,
    getTimeSnapshot,
    () => '0:0:0:0:0'
  );

  const [days, hours, minutes, seconds, passedFlag] = timeSnapshot.split(':');
  const isPassed = passedFlag === '1';

  const bypassed = useSyncExternalStore(
    subscribeBypass,
    getIsBypassed,
    () => false
  );

  const lottieContainerRef = useRef<HTMLDivElement>(null);

  // Load Minimalist Lottie Animation
  useEffect(() => {
    if (isPassed || bypassed) return;

    let animInstance: AnimationItem | null = null;
    let isCancelled = false;

    async function initLottie() {
      try {
        const lottieModule = await import('lottie-web');
        if (isCancelled || !lottieContainerRef.current) return;

        const res = await fetch('/assets/timer.json');
        if (!res.ok) return;
        const animData = await res.json();

        if (isCancelled || !lottieContainerRef.current) return;

        animInstance = lottieModule.default.loadAnimation({
          container: lottieContainerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animData,
        });
      } catch (err) {
        console.warn('Lottie submission gate note:', err);
      }
    }

    initLottie();

    return () => {
      isCancelled = true;
      if (animInstance) animInstance.destroy();
    };
  }, [isPassed, bypassed]);

  // Once Monday September 28, 2026 at 12:00 PM arrives (or with ?bypass=true), reveal the application
  if (isPassed || bypassed) {
    return <>{children}</>;
  }

  // Covers the entire page body between the top Navbar and bottom Footer
  return (
    <div className="relative w-full min-h-[calc(100dvh-120px)] sm:min-h-[calc(100dvh-140px)] bg-canvas-theme text-foreground-theme flex flex-col items-center justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 select-none overflow-hidden font-body">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gold/[0.04] dark:bg-gold/[0.05] blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-navy/20 dark:bg-navy/30 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl w-full my-auto space-y-4">
        {/* PSITS Logo */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_0_20px_rgba(245,166,35,0.25)] shrink-0">
          <Image
            src="/assets/logo/PSITS logo.png"
            alt="PSITS-UA Logo"
            fill
            sizes="(max-width: 640px) 56px, 64px"
            className="object-contain"
            priority
          />
        </div>

        {/* Perfectly Centered Responsive Lottie Animation */}
        <div className="w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 aspect-square flex items-center justify-center shrink-0 mx-auto">
          <div
            ref={lottieContainerRef}
            className="w-full h-full pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex items-center justify-center"
          />
        </div>

        {/* Pure Minimalist Typography & Plain-text Countdown */}
        <div className="space-y-1.5 shrink-0">
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight uppercase text-foreground-theme leading-tight">
            Polo Shirt <span className="text-gold">Submissions</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground-theme/60 font-mono tracking-[0.25em] uppercase">
            PSITS — University of Antique
          </p>
          <p className="text-xs sm:text-sm text-gold font-mono tracking-[0.25em] pt-2">
            {days}d : {hours}h : {minutes}m : {seconds}s
          </p>
          <p className="text-[11px] text-muted-foreground-theme/50 font-mono tracking-wider pt-1">
            Opens Monday · Sept 28, 2026 at 12:00 PM PHT
          </p>
        </div>
      </div>
    </div>
  );
}
