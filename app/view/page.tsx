"use client";

import React, { useState, useEffect } from "react";
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

const VOTING_OPENS = new Date(); // Testing: Open now
const VOTING_CLOSES = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Testing: Closes in 7 days
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
// Lightbox Component
// ────────────────────────────────────────────────────────────────────────────

function Lightbox({
  entries,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  entries: ApprovedEntry[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const entry = entries[currentIndex];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

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
      {entries.length > 1 && (
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
        className="relative max-w-4xl w-full mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] max-h-[75vh] rounded-xl overflow-hidden bg-black/50">
          <Image
            src={entry.file_url}
            alt={entry.title || "Design entry"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 95vw, 800px"
            unoptimized
          />
        </div>

        <div className="mt-4 text-center max-w-lg">
          {entry.title && (
            <h3 className="text-lg font-semibold text-white font-display">
              {entry.title}
            </h3>
          )}
          <p className="text-sm text-white/60 mt-1">
            {entry.student_name}
            {entry.student_course_year && (
              <span className="text-white/40">
                {" "}
                · {entry.student_course_year}
              </span>
            )}
          </p>
          {entry.description && (
            <p className="text-xs text-white/50 mt-2 leading-relaxed">
              {entry.description}
            </p>
          )}
          <p className="text-xs text-white/30 mt-2">
            {currentIndex + 1} / {entries.length}
          </p>
        </div>
      </div>

      {/* Next */}
      {entries.length > 1 && (
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

function CountdownPill() {
  const [remaining, setRemaining] = useState<ReturnType<typeof getTimeRemaining> | undefined>(undefined);

  useEffect(() => {
    // Set initial value on client only
    setRemaining(getTimeRemaining());
    
    const timer = setInterval(() => {
      setRemaining(getTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show placeholder during initial server render and hydration
  if (remaining === undefined) {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-theme/90 border border-border-theme backdrop-blur-xl shadow-lg">
        <Clock className="w-4 h-4 text-gold shrink-0" />
        <span className="text-xs text-muted-foreground-theme font-mono">
          Loading...
        </span>
      </div>
    );
  }

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
            className="inline-flex items-baseline gap-0.5"
          >
            <span className="text-sm font-semibold text-foreground-theme tabular-nums font-display">
              {String(unit.value).padStart(2, "0")}
            </span>
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
  const [showConfirm, setShowConfirm] = useState(false);
  const hasVotedForThis = userVote === entry.id;

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
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-canvas-theme/80">
            <Loader2 className="w-6 h-6 text-muted-foreground-theme/40 animate-spin" />
          </div>
        )}
        <Image
          src={entry.file_url}
          alt={entry.title || "Polo shirt design"}
          fill
          className={`object-cover transition-all duration-500 group-hover:scale-[1.03] ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
          onLoad={() => setImgLoaded(true)}
        />

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
              Voting opens Oct 5
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
  const [votingOpen, setVotingOpen] = useState(false);

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
  useEffect(() => {
    if (!sessionToken) {
      setVoteStatus(null);
      return;
    }

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

    // Check voting status
    const now = new Date();
    setVotingOpen(now >= VOTING_OPENS && now <= VOTING_CLOSES);
    
    const timer = setInterval(() => {
      const currentTime = new Date();
      setVotingOpen(currentTime >= VOTING_OPENS && currentTime <= VOTING_CLOSES);
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
    } catch (err) {
      setVoteMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsVoting(false);
    }
  };

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
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
            Design <span className="text-gold">Gallery</span>
          </h1>
          <p className="text-muted-foreground-theme text-xs sm:text-sm">
            Browse the approved polo shirt designs submitted by BSINFO students.
            {!votingOpen
              ? " Voting opens on October 5, 2026."
              : " Cast your vote for your favorite design!"}
          </p>
          
          <div className="pt-2">
            <CountdownPill />
          </div>
        </div>

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
      {lightboxIndex !== null && (
        <Lightbox
          entries={entries}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevLightbox}
          onNext={nextLightbox}
        />
      )}
    </div>
  );
}
