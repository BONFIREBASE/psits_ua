"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileImage,
  X,
  ShieldCheck,
  Loader2,
  LogOut,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const ALLOWED_DOMAIN = "@antiquespride.edu.ph";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface SubmissionResult {
  id: string;
  student_name: string;
  student_email: string;
  file_url: string;
  file_name: string;
  title?: string | null;
  description?: string | null;
  student_course_year?: string | null;
  created_at: string;
}

export default function SubmissionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseYear, setCourseYear] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<SubmissionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initialize Supabase Auth & Listen for OAuth Redirects
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const email = session.user.email?.toLowerCase() || "";
          if (email.endsWith(ALLOWED_DOMAIN)) {
            setUser(session.user);
            setSessionToken(session.access_token);
            setAuthError(null);
          } else {
            // Non-institutional email detected -> auto sign out
            await supabase.auth.signOut();
            setUser(null);
            setSessionToken(null);
            setAuthError(
              `Access restricted: "${email}" is not an @antiquespride.edu.ph account. Please use your official University of Antique Google Workspace email.`
            );
          }
        }
      } catch (err) {
        console.error("Auth session check error:", err);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          const email = session.user.email?.toLowerCase() || "";
          if (email.endsWith(ALLOWED_DOMAIN)) {
            setUser(session.user);
            setSessionToken(session.access_token);
            setAuthError(null);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setSessionToken(null);
            setAuthError(
              `Access restricted: "${email}" is not an @antiquespride.edu.ph account. Please sign in using your official university email.`
            );
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setSessionToken(null);
        }
        setIsAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle Google OAuth Sign-in
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/submission`
          : "";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            hd: "antiquespride.edu.ph",
          },
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setAuthError(error.message);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Failed to initialize Google authentication."
      );
    }
  };

  // Handle Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSessionToken(null);
    setFile(null);
    setPreviewUrl(null);
    setSubmittedData(null);
    setAuthError(null);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      setSubmitError(
        `File size exceeds 25MB limit (${(selected.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller image.`
      );
      return;
    }

    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (selected.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    if (dropped.size > MAX_FILE_SIZE) {
      setSubmitError(
        `File size exceeds 25MB limit (${(dropped.size / (1024 * 1024)).toFixed(1)}MB).`
      );
      return;
    }

    setFile(dropped);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (dropped.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(dropped));
    } else {
      setPreviewUrl(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!file) {
      setSubmitError("Please select or drop your design file before submitting.");
      return;
    }

    if (!sessionToken) {
      setSubmitError("Session expired. Please sign in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title.trim()) formData.append("title", title.trim());
      if (description.trim()) formData.append("description", description.trim());
      if (courseYear.trim()) formData.append("courseYear", courseYear.trim());

      const res = await fetch("/api/submissions/polo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload design. Please try again.");
      }

      setSubmittedData(data.submission);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setTitle("");
    setDescription("");
    setCourseYear("");
    setSubmittedData(null);
    setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="relative min-h-screen bg-canvas text-text overflow-hidden">
      {/* Background glow — mirrors home/about/events/projects hero */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-navy/40 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gold/8 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117]/40 via-transparent to-canvas" />
      </div>

      {/* Page Content Container */}
      <div className="relative z-10 pt-32 sm:pt-36 pb-28 max-w-2xl w-full mx-auto px-6">
        {/* Page Title & Context */}
        <div className="text-center mb-10 space-y-3">
          <p className="font-mono text-xs text-gold tracking-widest uppercase flex items-center justify-center gap-2">
            <span>Official Competition · Call for Entries</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight uppercase leading-[1.08]">
            Polo Shirt <span className="text-gold">Design Contest</span>
          </h1>
        </div>

        {/* Dynamic Auth / Form Container */}
        <div className="bg-surface/85 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          {isAuthLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
              <p className="text-xs font-mono">Checking university session...</p>
            </div>
          ) : !user ? (
            /* ──────────────────────────────────────────────────────────── */
            /* STEP 1: AUTHENTICATION REQUIRED                             */
            /* ──────────────────────────────────────────────────────────── */
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4 text-gold shadow-lg shadow-gold/5">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <h2 className="text-lg font-bold text-white mb-2 font-display uppercase tracking-wide">
                Institutional Sign-In Required
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-md mx-auto mb-6 leading-relaxed">
                To guarantee genuine student entries and verify identity for awards, please sign in with your official University of Antique account.
              </p>

              {authError && (
                <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-left flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-200 leading-relaxed">
                    {authError}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm text-[#0D1117] bg-white hover:bg-white/90 transition-all flex items-center justify-center gap-3 mx-auto shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span className="font-semibold">Continue with @antiquespride.edu.ph</span>
              </button>

              <p className="mt-5 text-[11px] text-muted font-mono">
                Accounts ending in <span className="text-gold font-medium">@antiquespride.edu.ph</span> only
              </p>
            </div>
          ) : submittedData ? (
            /* ──────────────────────────────────────────────────────────── */
            /* STEP 3: SUBMISSION RECEIPT / DONE                           */
            /* ──────────────────────────────────────────────────────────── */
            <div className="py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-1 font-display uppercase tracking-wide">
                Design Submitted!
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto mb-6">
                Your entry has been securely stored in the official PSITS vault. Thank you for contributing to the department identity!
              </p>

              {/* Minimalist Receipt Card */}
              <div className="bg-canvas/90 border border-white/10 rounded-xl p-4 sm:p-5 text-left mb-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted font-medium font-mono">
                      Reference ID
                    </span>
                    <p className="text-xs font-mono font-bold text-gold">
                      {submittedData.id}
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Received & Stored
                  </span>
                </div>

                {/* Preview Thumbnail */}
                <div className="flex items-center gap-4">
                  {submittedData.file_url && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-canvas shrink-0">
                      <Image
                        src={submittedData.file_url}
                        alt="Submitted polo design"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">
                      {submittedData.title || submittedData.file_name}
                    </p>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {submittedData.student_name}
                    </p>
                    <p className="text-[11px] font-mono text-muted truncate">
                      {submittedData.student_email}
                    </p>
                  </div>
                </div>

                {submittedData.description && (
                  <div className="border-t border-white/10 pt-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1 font-mono">
                      Concept Note
                    </span>
                    <p className="text-xs text-white/80 italic line-clamp-3">
                      &quot;{submittedData.description}&quot;
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForAnother}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                >
                  Submit Another Design
                </button>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gold hover:bg-gold-light text-[#0D1117] transition-all cursor-pointer shadow-[0_0_15px_rgba(245,166,35,0.25)]"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            /* ──────────────────────────────────────────────────────────── */
            /* STEP 2: DESIGN UPLOAD & SUBMISSION FORM                      */
            /* ──────────────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Authenticated Submitter Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-canvas/80 border border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  {user.user_metadata?.avatar_url ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gold/30">
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-xs shrink-0">
                      {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </p>
                    <p className="text-[11px] text-muted font-mono truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out of submission session"
                  className="text-muted hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Zone */}
              <div>
                <label className="block text-xs font-mono font-medium text-white/80 uppercase tracking-wider mb-2">
                  Polo Shirt Design Mockup <span className="text-gold">*</span>
                </label>

                {!file ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-gold/50 bg-canvas/60 hover:bg-canvas/90 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-muted group-hover:text-gold group-hover:scale-105 transition-all">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-white mb-1">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-[11px] text-muted font-mono">
                      PNG, JPG, WEBP, or PDF up to 25MB
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-white/10 bg-canvas/90 p-4 flex flex-col sm:flex-row items-center gap-4">
                    {previewUrl ? (
                      <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-canvas shrink-0 border border-white/10">
                        <Image
                          src={previewUrl}
                          alt="Mockup preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-canvas border border-white/10 flex items-center justify-center text-muted shrink-0">
                        <FileImage className="w-8 h-8" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-xs font-semibold text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-muted font-mono mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type || "file"}
                      </p>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="mt-2 text-[11px] text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Choose a different file</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Fields Section */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                {/* Design Title */}
                <div>
                  <label className="block text-xs font-mono font-medium text-white/80 uppercase tracking-wider mb-1.5">
                    Design Title <span className="text-muted text-[11px] normal-case">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Minimalist Cyber CCS Polo"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-canvas/90 border border-white/10 text-xs text-white placeholder:text-muted focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition-colors"
                  />
                </div>

                {/* Course & Year */}
                <div>
                  <label className="block text-xs font-mono font-medium text-white/80 uppercase tracking-wider mb-1.5">
                    Course & Year Section <span className="text-muted text-[11px] normal-case">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={courseYear}
                    onChange={(e) => setCourseYear(e.target.value)}
                    placeholder="e.g., BSIT 3-A or Faculty"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-canvas/90 border border-white/10 text-xs text-white placeholder:text-muted focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition-colors"
                  />
                </div>

                {/* Concept Description */}
                <div>
                  <label className="block text-xs font-mono font-medium text-white/80 uppercase tracking-wider mb-1.5">
                    Design Concept / Description <span className="text-muted text-[11px] normal-case">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your design symbolism, chosen color palette, or inspiration..."
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-canvas/90 border border-white/10 text-xs text-white placeholder:text-muted focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Error Notice */}
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p>{submitError}</p>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !file}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#0D1117] bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.99] shadow-[0_0_20px_rgba(245,166,35,0.25)] hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading to PSITS Storage...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Submit Polo Shirt Design</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted font-mono">
                <Info className="w-3.5 h-3.5" />
                <span>Uploaded entries are stored securely in official PSITS storage.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
