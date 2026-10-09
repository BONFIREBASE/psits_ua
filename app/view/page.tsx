"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Palette,
  Vote,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Trophy,
  ImageOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface ApprovedEntry {
  id: string;
  student_name: string;
  student_course_year?: string | null;
  title?: string | null;
  description?: string | null;
  file_url: string;
  vote_count?: number;
  created_at: string;
}

interface VoteStatus {
  hasVoted: boolean;
  vote: { id: string; submission_id: string; voted_at: string } | null;
  votingEnabled: boolean;
  votingMessage?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

const VOTING_OPENS = new Date("2026-10-09T12:00:00+08:00");
const VOTING_CLOSES = new Date("2026-10-09T23:59:59+08:00");
const ALLOWED_DOMAIN = "@antiquespride.edu.ph";

function getTimeRemaining() {
  const now = new Date();
  const diff = VOTING_OPENS.getTime() - now.getTime();
  if (diff <= 0) return null; // Voting is open

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total: diff };
}

// ────────────────────────────────────────────────────────────────────────────
// Winner Banner Component (Awards Centerpiece Showcase)
// ────────────────────────────────────────────────────────────────────────────

function WinnerBanner({
  winner,
  totalVotes,
  onOpenLightbox,
}: {
  winner: ApprovedEntry;
  totalVotes: number;
  onOpenLightbox?: (entry: ApprovedEntry) => void;
}) {
  const votePercent = totalVotes > 0 ? Math.round(((winner.vote_count || 0) / totalVotes) * 100) : 0;
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [winnerImgLoaded, setWinnerImgLoaded] = useState(false);
  const [winnerImgFailed, setWinnerImgFailed] = useState(false);
  const [winnerFallbackAttempted, setWinnerFallbackAttempted] = useState(false);

  const winnerImgSrc = winnerFallbackAttempted
    ? `/api/submissions/polo/image?url=${encodeURIComponent(winner.file_url)}`
    : winner.file_url;

  const handleWinnerError = () => {
    if (!winnerFallbackAttempted && winner.file_url) {
      setWinnerFallbackAttempted(true);
    } else {
      setWinnerImgFailed(true);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
    setWinnerImgLoaded(true);
  };

  return (
    <div className="relative mb-14 max-w-5xl mx-auto">
      {/* Theatrical ambient back-glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[420px] bg-gradient-to-r from-gold/15 via-navy/35 to-gold/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Main Glass Stage */}
      <div className="relative rounded-3xl bg-surface-theme/85 backdrop-blur-2xl border border-gold/30 shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden">
        {/* Top Gold Accent Bar */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-90" />

        {/* Header Kicker */}
        <div className="pt-8 pb-3 px-6 sm:px-10 text-center">
          <h2 className="font-display font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-foreground-theme uppercase tracking-tight leading-[1.1]">
            {winner.title || "The Winning Design"}
          </h2>
        </div>

        {/* Centerpiece Apparel Plinth — Auto-adapts to any photo ratio */}
        <div className="px-4 sm:px-8 py-3">
          <div
            onClick={() => onOpenLightbox?.(winner)}
            className={`group relative w-full ${
              aspectRatio === null
                ? "min-h-[380px] sm:min-h-[460px] md:min-h-[520px]"
                : aspectRatio < 0.85
                ? "h-[460px] sm:h-[540px] md:h-[600px]"
                : aspectRatio < 1.3
                ? "h-[400px] sm:h-[480px] md:h-[540px]"
                : "aspect-[16/10] sm:aspect-[16/9] min-h-[340px] max-h-[520px]"
            } rounded-2xl overflow-hidden bg-[#0A0E17] shadow-2xl border border-gold/25 cursor-pointer transition-all duration-300`}
          >
            {/* Ambient dynamic backdrop matching the winner photo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
              <Image
                key={`winner-glow-${winnerImgSrc}`}
                src={winnerImgSrc}
                alt=""
                fill
                className="object-cover scale-125 blur-3xl opacity-30 dark:opacity-35 brightness-75 saturate-150 transform-gpu"
                sizes="(max-width: 1024px) 100vw, 1024px"
                aria-hidden
              />
              {/* Theatrical dark vignettes for deep contrast & theme blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-[#0A0E17]/60 to-[#0A0E17]/80" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_60%,rgba(10,14,23,0.85)_100%)]" />
            </div>

            {/* Foreground image: uncropped, centered, floating with depth shadow */}
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8 z-10">
              {/* Skeleton Preloader Layer */}
              {!winnerImgFailed && (
                <div
                  className={`absolute inset-4 sm:inset-8 pointer-events-none rounded-xl overflow-hidden transition-opacity duration-700 ease-out z-10 ${
                    winnerImgLoaded ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/[0.04] animate-pulse rounded-xl" />
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-banner-shimmer" />
                  </div>
                </div>
              )}

              {!winnerImgFailed ? (
                <Image
                  key={`winner-fg-${winnerImgSrc}`}
                  src={winnerImgSrc}
                  alt={winner.title || "Winning Polo Shirt Design"}
                  fill
                  className={`object-contain p-2 sm:p-6 drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] transition-all duration-700 ease-out group-hover:scale-[1.015] ${
                    winnerImgLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.02] blur-sm"
                  }`}
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  priority
                  onLoad={handleImageLoad}
                  onError={handleWinnerError}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/50">
                  <ImageOff size={32} />
                  <span className="text-xs font-mono uppercase tracking-wider">Preview Unavailable</span>
                </div>
              )}
            </div>

            {/* Corner Badge: 1st Place */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#0D1117]/90 backdrop-blur-md border border-gold/40 text-gold text-xs font-mono font-bold uppercase tracking-wider shadow-lg">
              <Trophy className="w-3.5 h-3.5 text-gold" />
              <span>1st Place Winner</span>
            </div>
          </div>
        </div>

        {/* Story, Designer & Metric Section */}
        <div className="px-6 sm:px-10 py-6 sm:py-8 grid md:grid-cols-12 gap-6 items-center border-t border-border-theme/60 bg-canvas-theme/20">
          {/* Designer & Concept */}
          <div className="md:col-span-7 space-y-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gold font-bold">
                Design Submission
              </p>
              <h3 className="font-display font-black text-xl sm:text-2xl text-foreground-theme tracking-tight mt-0.5">
                Designed by {winner.student_name}
                {winner.student_course_year && (
                  <span className="text-muted-foreground-theme font-normal text-base"> · {winner.student_course_year}</span>
                )}
              </h3>
            </div>

            {winner.description && (
              <p className="text-xs sm:text-sm text-muted-foreground-theme leading-relaxed border-l-2 border-gold/40 pl-4 italic">
                &ldquo;{winner.description}&rdquo;
              </p>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-canvas-theme/70 border border-border-theme backdrop-blur-md">
              <p className="text-[10px] font-mono text-muted-foreground-theme uppercase tracking-wider">
                Student Votes
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display font-black text-2xl sm:text-3xl text-gold">
                  {winner.vote_count || 0}
                </span>
                {totalVotes > 0 && (
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    {votePercent}% share
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-canvas-theme/70 border border-border-theme backdrop-blur-md">
              <p className="text-[10px] font-mono text-muted-foreground-theme uppercase tracking-wider">
                Status
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-display font-bold text-sm sm:text-base text-foreground-theme">
                  Official Attire
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground-theme/70 mt-0.5 font-mono">
                A.Y. 2026–2027
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Lightbox Component
// ────────────────────────────────────────────────────────────────────────────

function LightboxImageViewer({ entry }: { entry: ApprovedEntry }) {
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const currentSrc = fallbackAttempted
    ? `/api/submissions/polo/image?url=${encodeURIComponent(entry.file_url)}`
    : entry.file_url;

  const handleImageError = () => {
    if (!fallbackAttempted && entry.file_url) {
      setFallbackAttempted(true);
    } else {
      setImgFailed(true);
    }
  };

  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[75vh] rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl flex items-center justify-center">
      {/* Skeleton Preloader Layer */}
      {!imgFailed && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out z-10 ${
            imgLoaded ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-banner-shimmer" />
          </div>
        </div>
      )}

      {!imgFailed ? (
        <Image
          src={currentSrc}
          alt={entry.title || "Design entry"}
          fill
          className={`object-contain transition-all duration-500 ${
            imgLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.02] blur-sm"
          }`}
          sizes="(max-width: 1024px) 95vw, 1024px"
          onLoad={() => setImgLoaded(true)}
          onError={handleImageError}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-white/50 p-8">
          <ImageOff size={36} />
          <span className="text-xs font-mono uppercase tracking-wider">Preview Unavailable</span>
        </div>
      )}
    </div>
  );
}

function Lightbox({
  entries,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  customEntry,
}: {
  entries: ApprovedEntry[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  customEntry?: ApprovedEntry | null;
}) {
  const entry = customEntry || entries[currentIndex];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!customEntry) {
        if (e.key === "ArrowLeft") onPrev();
        if (e.key === "ArrowRight") onNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext, customEntry]);

  if (!entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev */}
      {!customEntry && entries.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-3 sm:left-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image + Info */}
      <div
        className="relative max-w-5xl w-full mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <LightboxImageViewer key={entry.id || entry.file_url} entry={entry} />

        <div className="mt-4 text-center max-w-xl">
          {entry.title && (
            <h3 className="text-lg sm:text-xl font-bold text-white font-display">
              {entry.title}
            </h3>
          )}
          <p className="text-sm text-white/70 mt-1">
            {entry.student_name}
            {entry.student_course_year && (
              <span className="text-white/40">
                {" "}
                · {entry.student_course_year}
              </span>
            )}
          </p>
          {entry.description && (
            <p className="text-xs sm:text-sm text-white/60 mt-2 leading-relaxed max-w-md mx-auto">
              {entry.description}
            </p>
          )}
          {!customEntry && entries.length > 0 && (
            <p className="text-xs text-white/30 mt-2 font-mono">
              {currentIndex + 1} / {entries.length}
            </p>
          )}
        </div>
      </div>

      {/* Next */}
      {!customEntry && entries.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-3 sm:right-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Countdown Pill
// ────────────────────────────────────────────────────────────────────────────

function AnimatedDigitPair({ value }: { value: string }) {
  return (
    <span className="relative inline-flex h-4.5 w-[18px] items-center justify-center overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm font-semibold text-foreground-theme tabular-nums font-display leading-none select-none inline-block text-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const emptySubscribe = () => () => {};

function CountdownPill(): React.JSX.Element | null {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show identical pill container with skeleton preloader for digits during SSR & hydration
  if (!isClient) {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-theme/90 border border-border-theme backdrop-blur-xl shadow-lg">
        <Clock className="w-4 h-4 text-gold shrink-0 animate-pulse" />
        <span className="text-xs text-muted-foreground-theme font-mono">
          Voting opens in
        </span>
        <div className="flex items-center gap-1">
          {["d", "h", "m", "s"].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-0.5"
            >
              <span className="inline-block w-[18px] h-4.5 rounded bg-muted-foreground-theme/20 dark:bg-white/10 animate-pulse" />
              <span className="text-[10px] text-muted-foreground-theme/60 uppercase font-mono">
                {label}
              </span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  const remaining = getTimeRemaining();

  if (!remaining) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20">
        <Vote className="w-3.5 h-3.5" />
        Voting is Open
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-theme/90 border border-border-theme backdrop-blur-xl shadow-lg">
      <Clock className="w-4 h-4 text-gold shrink-0" />
      <span className="text-xs text-muted-foreground-theme font-mono">
        Voting opens in
      </span>
      <div className="flex items-center gap-1">
        {[
          { value: remaining.days, label: "d" },
          { value: remaining.hours, label: "h" },
          { value: remaining.minutes, label: "m" },
          { value: remaining.seconds, label: "s" },
        ].map((unit) => (
          <span
            key={unit.label}
            className="inline-flex items-center gap-0.5"
          >
            <AnimatedDigitPair value={String(unit.value).padStart(2, "0")} />
            <span className="text-[10px] text-muted-foreground-theme/60 uppercase font-mono">
              {unit.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Design Card
// ────────────────────────────────────────────────────────────────────────────

function DesignCard({
  entry,
  index,
  onOpenLightbox,
  votingOpen,
  user,
  userVote,
  onVote,
  isVoting,
}: {
  entry: ApprovedEntry;
  index: number;
  onOpenLightbox: (index: number) => void;
  votingOpen: boolean;
  user: User | null;
  userVote: string | null;
  onVote: (submissionId: string) => void;
  isVoting: boolean;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const hasVotedForThis = userVote === entry.id;

  const currentSrc = fallbackAttempted
    ? `/api/submissions/polo/image?url=${encodeURIComponent(entry.file_url)}`
    : entry.file_url;

  const handleImgError = () => {
    if (!fallbackAttempted && entry.file_url) {
      setFallbackAttempted(true);
    } else {
      setImgFailed(true);
    }
  };

  const handleVoteClick = () => {
    if (hasVotedForThis) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onVote(entry.id);
  };

  return (
    <div className={`group bg-surface-theme/90 dark:bg-surface-theme/90 border ${hasVotedForThis ? 'border-gold/50' : 'border-border-theme'} rounded-2xl overflow-hidden hover:border-gold/30 transition-all duration-300 backdrop-blur-xl shadow-lg ${hasVotedForThis ? 'ring-2 ring-gold/20' : ''}`}>
      {/* Image */}
      <div
        className="relative aspect-[3/4] bg-canvas-theme/80 cursor-pointer overflow-hidden"
        onClick={() => onOpenLightbox(index)}
      >
        {/* Skeleton Preloader Layer */}
        {!imgFailed && (
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out z-10 ${
              imgLoaded ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="absolute inset-0 bg-slate-200/80 dark:bg-white/[0.04] animate-pulse" />
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/[0.08] to-transparent animate-banner-shimmer" />
            </div>
          </div>
        )}

        {!imgFailed ? (
          <Image
            key={`card-${currentSrc}`}
            src={currentSrc}
            alt={entry.title || "Polo shirt design"}
            fill
            priority={index < 3}
            className={`object-cover transition-all duration-500 group-hover:scale-[1.03] ${
              imgLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.03] blur-xs"
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            onLoad={() => setImgLoaded(true)}
            onError={handleImgError}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas-theme/90 text-muted-foreground-theme/60">
            <ImageOff size={28} className="opacity-40" />
            <span className="text-[11px] font-mono uppercase tracking-wider">Preview Unavailable</span>
          </div>
        )}

        {/* Zoom overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-80 transition-opacity duration-300" />
        </div>

        {/* Voted badge */}
        {hasVotedForThis && (
          <div className="absolute top-2 right-2 bg-gold text-[#0D1117] px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-lg">
            <CheckCircle2 className="w-3 h-3" />
            Your Vote
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 space-y-2">
        {entry.title && (
          <h3 className="text-sm font-semibold text-foreground-theme font-display leading-tight line-clamp-2">
            {entry.title}
          </h3>
        )}

        <p className="text-xs text-muted-foreground-theme">
          {entry.student_name}
          {entry.student_course_year && (
            <span className="text-muted-foreground-theme/60">
              {" "}
              · {entry.student_course_year}
            </span>
          )}
        </p>

        {entry.description && (
          <p className="text-xs text-muted-foreground-theme/70 leading-relaxed line-clamp-3">
            {entry.description}
          </p>
        )}

        {/* Vote Button Section */}
        <div className="pt-2 space-y-2">
          {!votingOpen ? (
            <div className="w-full py-2.5 px-3 rounded-xl bg-canvas-theme/80 dark:bg-canvas-theme text-muted-foreground-theme/50 text-xs text-center border border-border-theme select-none font-mono">
              <Clock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              Voting opens Oct 9, 12:00 PM
            </div>
          ) : !user ? (
            <Link
              href="/submission"
              className="w-full py-2.5 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-canvas-theme/80 dark:bg-canvas-theme hover:bg-surface-theme dark:hover:bg-surface-theme text-muted-foreground-theme hover:text-foreground-theme transition-colors border border-border-theme flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In to Vote
            </Link>
          ) : hasVotedForThis ? (
            <div className="w-full py-2.5 px-3 rounded-xl bg-gold/15 dark:bg-gold/15 text-gold dark:text-gold text-xs text-center border border-gold/30 select-none font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              You Voted This
            </div>
          ) : showConfirm ? (
            // Inline confirmation
            <div className="bg-gold/10 dark:bg-gold/10 border border-gold/30 rounded-xl p-3 space-y-2">
              <p className="text-xs text-foreground-theme font-medium text-center">
                {userVote ? "Change your vote?" : "Confirm your vote?"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isVoting}
                  className="flex-1 py-2 px-2 rounded-lg bg-canvas-theme dark:bg-canvas-theme hover:bg-surface-theme dark:hover:bg-surface-theme text-foreground-theme text-xs font-medium transition-colors border border-border-theme disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isVoting}
                  className="flex-1 py-2 px-2 rounded-lg bg-gold hover:bg-gold-light text-[#0D1117] text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isVoting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Yes
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              disabled={isVoting}
              onClick={handleVoteClick}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gold/15 dark:bg-gold/15 hover:bg-gold/25 dark:hover:bg-gold/25 text-gold dark:text-gold transition-colors cursor-pointer border border-gold/20 hover:border-gold/40 flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(245,166,35,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVoting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Vote className="w-3.5 h-3.5" />
                  {userVote ? "Change Vote" : "Vote for this"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────

export default function ViewGalleryPage() {
  const [entries, setEntries] = useState<ApprovedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxCustomEntry, setLightboxCustomEntry] = useState<ApprovedEntry | null>(null);
  const [votingTick, setVotingTick] = useState(0);

  // Derive voting state from current time — no setState in effect needed
  const votingOpen = (() => {
    void votingTick; // trigger re-render on tick
    const now = new Date();
    return now >= VOTING_OPENS && now <= VOTING_CLOSES;
  })();

  const votingEnded = new Date() > VOTING_CLOSES;

  // Determine winner (highest vote_count after voting concludes on Oct 9)
  const winner = votingEnded && entries.length > 0
    ? entries.reduce((best, e) => ((e.vote_count || 0) > (best.vote_count || 0) ? e : best), entries[0])
    : null;

  const totalVotes = entries.reduce((sum, e) => sum + (e.vote_count || 0), 0);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Voting State
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch user session
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session?.user) {
          const email = session.user.email?.toLowerCase() || "";
          if (email.endsWith(ALLOWED_DOMAIN)) {
            setUser(session.user);
            setSessionToken(session.access_token);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setSessionToken(null);
          }
        }
      } catch (err) {
        console.error("Auth session check error:", err);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const email = session.user.email?.toLowerCase() || "";
        if (email.endsWith(ALLOWED_DOMAIN)) {
          setUser(session.user);
          setSessionToken(session.access_token);
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setSessionToken(null);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSessionToken(null);
        setVoteStatus(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch voting status when user is authenticated
  // Fetch voting status when user is authenticated
  useEffect(() => {
    if (!sessionToken) return;

    async function fetchVoteStatus() {
      try {
        const res = await fetch("/api/submissions/polo/vote", {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        const data = await res.json();
        setVoteStatus(data);
      } catch (err) {
        console.error("Error fetching vote status:", err);
      }
    }

    fetchVoteStatus();
  }, [sessionToken]);

  // Fetch approved designs
  useEffect(() => {
    async function fetchApproved() {
      try {
        const res = await fetch("/api/submissions/polo/approved");
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    fetchApproved();

    // Tick to re-derive votingOpen each second
    const timer = setInterval(() => {
      setVotingTick((t) => t + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Handle vote
  const handleVote = async (submissionId: string) => {
    if (!sessionToken) return;

    setIsVoting(true);
    setVoteMessage(null);

    try {
      const res = await fetch("/api/submissions/polo/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ submissionId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVoteMessage({ type: "success", text: data.message });
        // Refresh vote status
        const statusRes = await fetch("/api/submissions/polo/vote", {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        const statusData = await statusRes.json();
        setVoteStatus(statusData);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setVoteMessage(null), 5000);
      } else {
        setVoteMessage({ type: "error", text: data.error || "Failed to record vote." });
      }
    } catch {
      setVoteMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsVoting(false);
    }
  };

  const openLightbox = (i: number) => {
    setLightboxCustomEntry(null);
    setLightboxIndex(i);
  };
  const closeLightbox = () => {
    setLightboxIndex(null);
    setLightboxCustomEntry(null);
  };
  const prevLightbox = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + entries.length) % entries.length : null
    );
  const nextLightbox = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % entries.length : null
    );

  return (
    <div className="relative min-h-screen bg-canvas-theme text-foreground-theme overflow-hidden">
      {/* Background glow - matching submission page */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-navy/20 dark:bg-navy/40 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gold/10 dark:bg-gold/8 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas-theme" />
      </div>

      {/* Page Content Container */}
      <div className="relative z-10 pt-32 sm:pt-36 pb-28 w-full px-6">
        {/* Vote Message Toast */}
        {voteMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in slide-in-from-top duration-300">
            <div
              className={`p-4 rounded-xl backdrop-blur-xl shadow-lg border ${
                voteMessage.type === "success"
                  ? "bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/10 dark:bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
              } flex items-start gap-3`}
            >
              {voteMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{voteMessage.text}</p>
              </div>
              <button
                onClick={() => setVoteMessage(null)}
                className="text-current hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Page Title & Context */}
        <div className="text-center mb-8 space-y-2 max-w-2xl mx-auto">
          <p className="font-mono text-xs text-gold tracking-widest uppercase font-semibold">
            PSITS-UA Competition
          </p>
          <h1 className="font-display font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-foreground-theme tracking-tight uppercase leading-[1.08] break-words">
            {votingEnded ? (
              <>Results &amp; <span className="text-gold">Winner</span></>
            ) : (
              <>Design <span className="text-gold">Gallery</span></>
            )}
          </h1>
          <p className="text-muted-foreground-theme text-xs sm:text-sm">
            {votingEnded
              ? "Voting has ended. Thank you to all BSINFO students who participated!"
              : votingOpen
                ? "Cast your vote for your favorite design!"
                : "Browse the approved polo shirt designs submitted by BSINFO students. Voting opens on Friday, October 9, 2026 at 12:00 PM PHT."}
          </p>
          
          {!votingEnded && (
            <div className="pt-2">
              <CountdownPill />
            </div>
          )}
        </div>

        {/* Winner Banner — shown after voting ends */}
        {votingEnded && winner && (
          <WinnerBanner
            winner={winner}
            totalVotes={totalVotes}
            onOpenLightbox={(entry) => setLightboxCustomEntry(entry)}
          />
        )}

        {/* Gallery Grid Container */}
        <div className="max-w-6xl mx-auto">
          {loading ? (
            /* Skeleton loader */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface-theme/90 border border-border-theme rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg"
                >
                  <div className="aspect-[3/4] bg-canvas-theme/80 animate-pulse" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 w-3/4 bg-canvas-theme/80 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-canvas-theme/80 rounded animate-pulse" />
                    <div className="h-3 w-full bg-canvas-theme/80 rounded animate-pulse mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            /* Empty state */
            <div className="bg-surface-theme/90 border border-border-theme rounded-2xl p-8 sm:p-12 backdrop-blur-xl shadow-lg text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-canvas-theme/80 border border-border-theme mb-5">
                <Palette className="w-7 h-7 text-muted-foreground-theme/40" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground-theme font-display tracking-tight">
                No Approved Designs Yet
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground-theme mt-2 max-w-sm mx-auto leading-relaxed">
                Approved polo shirt designs will appear here once reviewed by
                the PSITS-UA committee. Check back soon!
              </p>
              <div className="pt-5">
                <Link
                  href="/submission"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gold hover:bg-gold-light text-[#0D1117] transition-all cursor-pointer shadow-[0_0_15px_rgba(245,166,35,0.25)]"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Submit Your Design</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Design cards */
            <>
              <p className="text-xs text-muted-foreground-theme/75 mb-5 font-mono">
                {entries.length} approved{" "}
                {entries.length === 1 ? "design" : "designs"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {entries.map((entry, i) => (
                  <DesignCard
                    key={entry.id}
                    entry={entry}
                    index={i}
                    onOpenLightbox={openLightbox}
                    votingOpen={votingOpen}
                    user={user}
                    userVote={voteStatus?.vote?.submission_id || null}
                    onVote={handleVote}
                    isVoting={isVoting}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {(lightboxIndex !== null || lightboxCustomEntry !== null) && (
        <Lightbox
          entries={entries}
          currentIndex={lightboxIndex ?? 0}
          customEntry={lightboxCustomEntry}
          onClose={closeLightbox}
          onPrev={prevLightbox}
          onNext={nextLightbox}
        />
      )}
    </div>
  );
}
