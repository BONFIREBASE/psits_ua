"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Palette,
  X,
  ChevronLeft,
  ChevronRight,
  Trophy,
  ImageOff,
} from "lucide-react";

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
      if (!customEntry && entries.length > 1) {
        if (e.key === "ArrowLeft") onPrev();
        if (e.key === "ArrowRight") onNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext, customEntry, entries.length]);

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
          {!customEntry && entries.length > 1 && (
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
// Main View Page
// ────────────────────────────────────────────────────────────────────────────

export default function ViewPage() {
  const [entries, setEntries] = useState<ApprovedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxCustomEntry, setLightboxCustomEntry] = useState<ApprovedEntry | null>(null);

  // Determine winner (highest vote_count)
  const winner = entries.length > 0
    ? entries.reduce((best, e) => ((e.vote_count || 0) > (best.vote_count || 0) ? e : best), entries[0])
    : null;

  const totalVotes = entries.reduce((sum, e) => sum + (e.vote_count || 0), 0);

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
  }, []);

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
    <div className="relative min-h-screen bg-canvas-theme text-foreground-theme overflow-hidden font-body">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-navy/20 dark:bg-navy/40 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gold/10 dark:bg-gold/8 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas-theme" />
      </div>

      {/* Page Content Container */}
      <div className="relative z-10 pt-32 sm:pt-36 pb-28 w-full max-w-5xl mx-auto px-6">
        {/* Page Title & Context */}
        <div className="text-center mb-10 space-y-2 max-w-2xl mx-auto">
          <p className="font-mono text-xs text-gold tracking-widest uppercase font-semibold">
            PSITS-UA Competition
          </p>
          <h1 className="font-display font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-foreground-theme tracking-tight uppercase leading-[1.08] break-words">
            Official Contest <span className="text-gold">Winner</span>
          </h1>
          <p className="text-muted-foreground-theme text-xs sm:text-sm">
            Voting has officially concluded and our winning design has been chosen. Congratulations to the winning designer and thank you to all BSINFO students who participated!
          </p>
        </div>

        {/* Winner Showcase Only */}
        {loading ? (
          <div className="relative mb-14 max-w-5xl mx-auto rounded-3xl bg-surface-theme/85 border border-gold/30 p-8 sm:p-12 text-center animate-pulse shadow-xl">
            <div className="h-6 w-48 bg-canvas-theme/80 rounded-full mx-auto mb-6" />
            <div className="aspect-[16/10] sm:aspect-[16/9] min-h-[340px] max-h-[520px] bg-canvas-theme/60 rounded-2xl mx-auto" />
          </div>
        ) : winner ? (
          <WinnerBanner
            winner={winner}
            totalVotes={totalVotes}
            onOpenLightbox={(entry) => setLightboxCustomEntry(entry)}
          />
        ) : (
          <div className="bg-surface-theme/90 border border-border-theme rounded-2xl p-8 sm:p-12 backdrop-blur-xl shadow-lg text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-canvas-theme/80 border border-border-theme mb-5">
              <Palette className="w-7 h-7 text-muted-foreground-theme/40" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground-theme font-display tracking-tight">
              No Approved Designs Found
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground-theme mt-2 max-w-sm mx-auto leading-relaxed">
              The winning design is currently being finalized. Please check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {(lightboxIndex !== null || lightboxCustomEntry !== null) && (
        <Lightbox
          entries={winner ? [winner] : entries}
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
