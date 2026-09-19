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
  Loader2,
  LogOut,
  Info,
  Edit3,
  ArrowLeft,
} from "lucide-react";
import { SubmissionAuthSkeleton } from "@/components/PublicSkeletonPreloader";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const ALLOWED_DOMAIN = "@antiquespride.edu.ph";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

interface SubmissionResult {
  id: string;
  student_name: string;
  student_email: string;
  file_url: string;
  file_name: string;
  title?: string | null;
  description?: string | null;
  student_course_year?: string | null;
  status?: string;
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

  // In-Place Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStepText, setUploadStepText] = useState("Uploading design...");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<SubmissionResult | null>(null);
  const [quota, setQuota] = useState<{ used: number; max: number; remaining: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch student active submission and quota
  const fetchUserQuota = async (token: string) => {
    try {
      const res = await fetch("/api/submissions/polo?mine=true&quota=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quota) setQuota(data.quota);
        if (data.activeSubmission) {
          setSubmittedData(data.activeSubmission);
        }
      }
    } catch (err) {
      console.warn("Could not fetch user submission status:", err);
    }
  };

  // 1. Initialize Supabase Auth & Session Check
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
            fetchUserQuota(session.access_token);
          } else {
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
            fetchUserQuota(session.access_token);
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
          setSubmittedData(null);
          setIsEditing(false);
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
    setIsEditing(false);
    setAuthError(null);
  };

  // Handle File Selection (JPG, PNG, WEBP only)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_IMAGE_TYPES.includes(selected.type.toLowerCase())) {
      setSubmitError("Only JPG, PNG, and WEBP images are allowed. PDF files are not accepted.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setSubmitError(
        `File size exceeds 25MB limit (${(selected.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller image.`
      );
      return;
    }

    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    if (!ALLOWED_IMAGE_TYPES.includes(dropped.type.toLowerCase())) {
      setSubmitError("Only JPG, PNG, and WEBP images are allowed. PDF files are not accepted.");
      return;
    }

    if (dropped.size > MAX_FILE_SIZE) {
      setSubmitError(
        `File size exceeds 25MB limit (${(dropped.size / (1024 * 1024)).toFixed(1)}MB).`
      );
      return;
    }

    setFile(dropped);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(dropped));
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Switch to In-Place Edit Mode
  const handleStartEdit = () => {
    if (!submittedData) return;
    setTitle(submittedData.title || "");
    setDescription(submittedData.description || "");
    setCourseYear(submittedData.student_course_year || "");
    setFile(null);
    setPreviewUrl(null);
    setSubmitError(null);
    setIsEditing(true);
  };

  // Cancel In-Place Edit Mode
  const handleCancelEdit = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSubmitError(null);
    setIsEditing(false);
  };

  // Save in-place revisions to existing submission
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!sessionToken || !submittedData) {
      setSubmitError("Session expired. Please sign in again.");
      return;
    }

    if (!courseYear.trim()) {
      setSubmitError("Please enter your BSINFO Year & Section (e.g., BSINFO 3-A).");
      return;
    }

    setIsSubmitting(true);
    setUploadStepText("Updating design submission...");

    try {
      let newFileKey = undefined;
      let newFileUrl = undefined;
      let newFileName = undefined;
      let newFileSize = undefined;

      // If student selected a replacement mockup image
      if (file) {
        setUploadStepText("Preparing replacement image slot...");
        const presignRes = await fetch("/api/submissions/polo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            action: "presign",
            isUpdate: true,
            submissionId: submittedData.id,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
          }),
        });

        const presignData = await presignRes.json();
        if (!presignRes.ok) {
          throw new Error(presignData.error || "Failed to initialize image replacement.");
        }

        setUploadStepText("Uploading new mockup to storage...");
        const r2PutRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!r2PutRes.ok) {
          throw new Error("Direct image upload failed. Please try again.");
        }

        newFileKey = presignData.fileKey;
        newFileUrl = presignData.publicUrl;
        newFileName = file.name;
        newFileSize = file.size;
      }

      setUploadStepText("Saving changes to PSITS vault...");
      const updateRes = await fetch("/api/submissions/polo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          action: "update",
          title: title.trim(),
          description: description.trim(),
          courseYear: courseYear.trim(),
          newFileKey,
          newFileUrl,
          newFileName,
          newFileSize,
        }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.error || "Failed to save submission updates.");
      }

      setSubmittedData(updateData.submission);
      setIsEditing(false);
      setEditSuccessMessage("Your design entry has been successfully updated!");
      setTimeout(() => setEditSuccessMessage(null), 6000);
      fetchUserQuota(sessionToken);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred while updating."
      );
    } finally {
      setIsSubmitting(false);
      setUploadStepText("Uploading design...");
    }
  };

  // Submit Handler for First-Time Entry
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

    if (quota && quota.remaining <= 0) {
      setSubmitError("You have already submitted your official entry. Please edit your existing entry instead.");
      return;
    }

    if (!courseYear.trim()) {
      setSubmitError("Please enter your BSINFO Year & Section (e.g., BSINFO 3-A).");
      return;
    }

    setIsSubmitting(true);
    setUploadStepText("Connecting to storage...");

    try {
      let submissionResult = null;
      let directUploadSucceeded = false;

      // ATTEMPT 1: High-concurrency direct upload directly to Cloudflare R2
      try {
        setUploadStepText("Requesting upload slot...");
        const presignRes = await fetch("/api/submissions/polo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            action: "presign",
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
          }),
        });

        const presignData = await presignRes.json();
        if (!presignRes.ok) {
          throw new Error(presignData.error || "Failed to initialize upload.");
        }

        setUploadStepText("Uploading file directly to R2...");
        const r2PutRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!r2PutRes.ok) {
          throw new Error("Direct upload failed; falling back to server route.");
        }

        setUploadStepText("Saving submission record...");
        const finalizeRes = await fetch("/api/submissions/polo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            action: "finalize",
            submissionId: presignData.submissionId,
            fileKey: presignData.fileKey,
            fileUrl: presignData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
            title: title.trim(),
            description: description.trim(),
            courseYear: courseYear.trim(),
          }),
        });

        const finalizeData = await finalizeRes.json();
        if (!finalizeRes.ok) {
          throw new Error(finalizeData.error || "Failed to finalize submission record.");
        }

        submissionResult = finalizeData.submission;
        directUploadSucceeded = true;
      } catch (directErr) {
        if (directErr instanceof Error && directErr.message.includes("already submitted")) {
          throw directErr;
        }
        console.warn("Direct upload fallback invoked:", directErr);
      }

      // ATTEMPT 2: Fallback server-side upload if direct R2 upload encountered CORS/network error
      if (!directUploadSucceeded) {
        setUploadStepText("Uploading via server fallback...");
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

        submissionResult = data.submission;
      }

      setSubmittedData(submissionResult);
      if (sessionToken) fetchUserQuota(sessionToken);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
      setUploadStepText("Uploading design...");
    }
  };

  return (
    <div className="relative min-h-screen bg-canvas-theme text-foreground-theme overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-navy/20 dark:bg-navy/40 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gold/10 dark:bg-gold/8 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas-theme" />
      </div>

      {/* Page Content Container */}
      <div className="relative z-10 pt-32 sm:pt-36 pb-28 max-w-2xl w-full mx-auto px-6">
        {/* Page Title & Context */}
        <div className="text-center mb-8 space-y-2">
          <p className="font-mono text-xs text-gold tracking-widest uppercase font-semibold">
            PSITS-UA Competition
          </p>
          <h1 className="font-display font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-foreground-theme tracking-tight uppercase leading-[1.08] break-words">
            Polo Shirt <span className="text-gold">Design Contest</span>
          </h1>
          <p className="text-muted-foreground-theme text-xs sm:text-sm">
            Official uniform design competition exclusive to BSINFO students (A.Y. 2026–2027).
          </p>
        </div>

        {/* Success Toast Notice */}
        {editSuccessMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{editSuccessMessage}</span>
          </div>
        )}

        {/* Dynamic Auth / Form Container */}
        <div className="bg-surface-theme/90 border border-border-theme rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-lg">
          {isAuthLoading ? (
            <SubmissionAuthSkeleton />
          ) : !user ? (
            /* ──────────────────────────────────────────────────────────── */
            /* STEP 1: AUTHENTICATION                                      */
            /* ──────────────────────────────────────────────────────────── */
            <div className="text-center py-4 space-y-5">
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground-theme font-display tracking-tight">
                  Sign In to Submit Entry
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground-theme max-w-sm mx-auto leading-relaxed">
                  Please sign in using your <strong className="text-foreground-theme font-semibold">@antiquespride.edu.ph</strong> account. Exclusive to BSINFO students.
                </p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-left flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-200 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-200 dark:border-white/15 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </button>
              </div>

              <div className="pt-4 border-t border-border-theme/60 grid grid-cols-3 gap-2 text-center text-[11px] font-mono text-muted-foreground-theme/75">
                <div>
                  <span className="block text-foreground-theme/80 font-medium">Eligible</span>
                  <span className="block text-foreground-theme/80 font-medium">BSINFO STUDENT</span>
                </div>
                <div>
                  <span className="block text-foreground-theme/80 font-medium">Formats</span>
                  <span>JPG, PNG, WEBP</span>
                </div>
                <div>
                  <span className="block text-foreground-theme/80 font-medium">Max Size</span>
                  <span>25 MB</span>
                </div>
              </div>
            </div>
          ) : (
            /* ──────────────────────────────────────────────────────────── */
            /* AUTHENTICATED STUDENT SESSION                               */
            /* ──────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* Authenticated Submitter Header */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-canvas-theme/80 border border-border-theme shadow-xs">
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
                    <div className="w-8 h-8 rounded-full bg-gold/20 text-amber-600 dark:text-gold flex items-center justify-center font-bold text-xs shrink-0">
                      {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground-theme truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </p>
                    <p className="text-[11px] text-muted-foreground-theme font-mono truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-gold/15 text-amber-700 dark:text-gold border border-gold/30">
                    BSINFO
                  </span>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    title="Sign out of submission session"
                    className="text-muted-foreground-theme hover:text-foreground-theme p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {submittedData && !isEditing ? (
                /* ────────────────────────────────────────────────────────── */
                /* VIEW MODE: ACTIVE SUBMISSION DASHBOARD                     */
                /* ────────────────────────────────────────────────────────── */
                <div className="py-2 text-center space-y-6">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Official Entry Registered</span>
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground-theme font-display uppercase tracking-wide">
                      Your Polo Design Entry
                    </h2>
                    <p className="text-xs text-muted-foreground-theme max-w-sm mx-auto">
                      Your submission is safely recorded. You can modify your design or concept at any time prior to judging.
                    </p>
                  </div>

                  {/* Submission Detail Card */}
                  <div className="bg-canvas-theme/90 border border-border-theme rounded-2xl p-5 text-left space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border-theme pb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground-theme font-medium font-mono">
                          Reference ID
                        </span>
                        <p className="text-xs font-mono font-bold text-amber-600 dark:text-gold break-all">
                          {submittedData.id}
                        </p>
                      </div>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium capitalize">
                        {submittedData.status || "Pending Review"}
                      </span>
                    </div>

                    {/* Mockup Preview Area */}
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {submittedData.file_url && (
                        <div className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden border border-border-theme bg-canvas-theme shrink-0 shadow-xs">
                          <Image
                            src={submittedData.file_url}
                            alt="Submitted polo design"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-2 w-full">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground-theme font-mono block">
                            Design Title
                          </span>
                          <p className="text-sm font-semibold text-foreground-theme">
                            {submittedData.title || submittedData.file_name}
                          </p>
                        </div>

                        {submittedData.student_course_year && (
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground-theme font-mono block">
                              Year & Section
                            </span>
                            <p className="text-xs font-mono text-foreground-theme/90">
                              {submittedData.student_course_year}
                            </p>
                          </div>
                        )}

                        <div className="text-[11px] font-mono text-muted-foreground-theme">
                          Submitted: {new Date(submittedData.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    {submittedData.description && (
                      <div className="border-t border-border-theme pt-3">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground-theme font-medium block mb-1 font-mono">
                          Concept Note
                        </span>
                        <p className="text-xs text-foreground-theme/85 italic leading-relaxed whitespace-pre-wrap">
                          &quot;{submittedData.description}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions: Edit or Return Home */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gold hover:bg-gold-light text-[#0D1117] transition-all cursor-pointer shadow-[0_0_15px_rgba(245,166,35,0.25)]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Design / Update Details</span>
                    </button>

                    <Link
                      href="/"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-foreground-theme transition-colors cursor-pointer"
                    >
                      Return to Home
                    </Link>
                  </div>
                </div>
              ) : submittedData && isEditing ? (
                /* ────────────────────────────────────────────────────────── */
                /* EDIT MODE: REVISE EXISTING SUBMISSION                      */
                /* ────────────────────────────────────────────────────────── */
                <form onSubmit={handleSaveEdit} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border-theme pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-muted-foreground-theme hover:text-foreground-theme transition-colors p-1 -ml-1 rounded-md"
                        title="Cancel edit"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h2 className="text-sm font-bold text-foreground-theme uppercase font-display tracking-tight">
                          Edit Submission
                        </h2>
                        <p className="text-[11px] text-muted-foreground-theme">
                          Modify your design details or upload a new mockup image.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mockup Image Replacement */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-foreground-theme uppercase tracking-wider mb-2">
                      Polo Shirt Design Mockup
                    </label>

                    {!file ? (
                      <div className="relative rounded-2xl border border-border-theme bg-canvas-theme/90 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border-theme bg-canvas-theme shrink-0">
                            <Image
                              src={submittedData.file_url}
                              alt="Current mockup"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                              Current Uploaded Design
                            </span>
                            <p className="text-xs font-semibold text-foreground-theme truncate">
                              {submittedData.file_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground-theme">
                              Click replace to upload a new mockup.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-lg border border-border-theme bg-surface-theme hover:bg-surface-theme/80 text-xs font-medium transition-colors cursor-pointer shrink-0"
                        >
                          Replace Mockup
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-2xl border border-gold/40 bg-canvas-theme/90 p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
                        {previewUrl && (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-canvas-theme shrink-0 border border-gold/50">
                            <Image
                              src={previewUrl}
                              alt="Replacement mockup preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 text-left">
                          <span className="text-[10px] font-mono text-gold font-bold uppercase">
                            New Replacement Image
                          </span>
                          <p className="text-xs font-semibold text-foreground-theme truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground-theme font-mono">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="mt-1 text-[11px] text-rose-500 hover:text-rose-600 font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Keep previous image</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fields Section */}
                  <div className="space-y-4 pt-2 border-t border-border-theme">
                    {/* Design Title */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-foreground-theme uppercase tracking-wider mb-1.5">
                        Design Title <span className="text-muted-foreground-theme text-[11px] normal-case">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Cyber Antique Blue Edition"
                        maxLength={100}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-canvas-theme/90 border border-border-theme text-xs text-foreground-theme placeholder:text-muted-foreground-theme/60 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition-colors shadow-xs"
                      />
                    </div>

                    {/* Course & Year */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-foreground-theme uppercase tracking-wider mb-1.5">
                        Year & Section (BSINFO) <span className="text-gold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={courseYear}
                        onChange={(e) => setCourseYear(e.target.value)}
                        placeholder="e.g., BSINFO 3-A"
                        maxLength={50}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-canvas-theme/90 border border-border-theme text-xs text-foreground-theme placeholder:text-muted-foreground-theme/60 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition-colors shadow-xs"
                      />
                    </div>

                    {/* Concept Description */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-foreground-theme uppercase tracking-wider mb-1.5">
                        Design Concept / Description <span className="text-muted-foreground-theme text-[11px] normal-case">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your design symbolism, chosen color palette, or inspiration..."
                        maxLength={500}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-canvas-theme/90 border border-border-theme text-xs text-foreground-theme placeholder:text-muted-foreground-theme/60 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition-colors resize-none shadow-xs"
                      />
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <p>{submitError}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#0D1117] bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.99] shadow-[0_0_20px_rgba(245,166,35,0.25)] cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{uploadStepText}</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-foreground-theme transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* ────────────────────────────────────────────────────────── */
                /* FIRST-TIME SUBMISSION FORM                                 */
                /* ────────────────────────────────────────────────────────── */
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Upload Zone */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-foreground-theme uppercase tracking-wider mb-2">
                      Polo Shirt Design Mockup <span className="text-gold">*</span>
                    </label>

                    {!file ? (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border-theme hover:border-gold/50 bg-canvas-theme/60 hover:bg-canvas-theme/90 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 border border-border-theme flex items-center justify-center mx-auto mb-3 text-muted-foreground-theme group-hover:text-amber-600 dark:group-hover:text-gold group-hover:scale-105 transition-all">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-foreground-theme mb-1">
                          Click to browse or drag and drop
                        </p>
                        <p className="text-[11px] text-muted-foreground-theme font-mono">
                          JPG, PNG, or WEBP up to 25MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl border border-border-theme bg-canvas-theme/90 p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
                        {previewUrl ? (
                          <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-canvas-theme shrink-0 border border-border-theme">
                            <Image
                              src={previewUrl}
                              alt="Mockup preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-canvas-theme border border-border-theme flex items-center justify-center text-muted-foreground-theme shrink-0">
                            <FileImage className="w-8 h-8" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1 text-center sm:text-left">
                          <p className="text-xs font-semibold text-foreground-theme truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground-theme font-mono mt-0.5">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="mt-2 text-[11px] text-rose-500 hover:text-rose-600 font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Choose a different file</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Fields Section */}
                  <div className="space-y-4 pt-2 border-t border-border-theme">
                    {/* Design Title */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-foreground-theme uppercase tracking-wider mb-1.5">
                        Design Title <span className="text-muted-foreground-theme text-[11px] normal-case">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Cyber Antique Blue Edition"
                        maxLength={100}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-canvas-theme/90 border border-border-theme text-xs text-foreground-theme placeholder:text-muted-foreground-theme/60 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition-colors shadow-xs"
                      />
                    </div>

                    {/* Course & Year */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-foreground-theme uppercase tracking-wider mb-1.5">
                        Year & Section (BSINFO) <span className="text-gold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={courseYear}
                        onChange={(e) => setCourseYear(e.target.value)}
                        placeholder="e.g., BSINFO 3-A"
                        maxLength={50}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-canvas-theme/90 border border-border-theme text-xs text-foreground-theme placeholder:text-muted-foreground-theme/60 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition-colors shadow-xs"
                      />
                    </div>

                    {/* Concept Description */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-foreground-theme uppercase tracking-wider mb-1.5">
                        Design Concept / Description <span className="text-muted-foreground-theme text-[11px] normal-case">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your design symbolism, chosen color palette, or inspiration..."
                        maxLength={500}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-canvas-theme/90 border border-border-theme text-xs text-foreground-theme placeholder:text-muted-foreground-theme/60 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 transition-colors resize-none shadow-xs"
                      />
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <p>{submitError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !file}
                    className="w-full py-3.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#0D1117] bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.99] shadow-[0_0_20px_rgba(245,166,35,0.25)] hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{uploadStepText}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Submit Official Polo Design</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground-theme font-mono">
                    <Info className="w-3.5 h-3.5" />
                    <span>Limit: 1 entry per BSINFO student. You can edit your entry anytime before review.</span>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
