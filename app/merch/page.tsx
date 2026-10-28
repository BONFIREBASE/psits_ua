"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Eye,
  Camera,
  Loader2,
  Package,
  X,
  LogIn,
  UploadCloud,
  ShoppingBag,
  Info,
  XCircle,
} from "lucide-react";
import MerchLockWrapper from "@/components/MerchLockWrapper";
import LottieAnimation from "@/components/LottieAnimation";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { compressImageToWebP } from "@/lib/image-compress";
import type { MerchOrderRow, PoloShirtSize } from "@/lib/supabase";

const ALLOWED_DOMAIN = "@antiquespride.edu.ph";
const POLO_PRICE = 475;

const POLO_DESIGN = {
  title: "NexGen TechTorch",
  designer: "Faith Joy Vicente Manulat",
  section: "BSINFO 4-D",
  description:
    "A simple navy, white, and yellow design representing the pride of PSITS-UA, with the UA torch symbolizing Kasanag (light) kag Kaaram (knowledge). The torch is surrounded by tech-inspired elements, representing its identity as a design made for IT students, with a Patadyong-inspired detail representing the cultural heritage and identity of Antique.",
};

const SIZES: { size: PoloShirtSize; chest: string; length: string }[] = [
  { size: "XS", chest: '36"', length: '25"' },
  { size: "S", chest: '38"', length: '26"' },
  { size: "M", chest: '40"', length: '27"' },
  { size: "L", chest: '42"', length: '28"' },
  { size: "XL", chest: '44"', length: '29"' },
  { size: "XXL", chest: '46"', length: '30"' },
];

const POLO_IMAGE =
  "https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/submissions/polo/cee16597-d0e3-4ffb-89d0-51a4ea805d11/PSITS_ENTRY_-psits.webp";

export default function MerchPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Active Order State
  const [activeOrder, setActiveOrder] = useState<MerchOrderRow | null>(null);

  // Mobile Screen Step ("product" overview vs "form" order details)
  const [mobileStep, setMobileStep] = useState<"product" | "form">("product");

  // Design Info Modal (Mobile & Desktop)
  const [showDesignInfo, setShowDesignInfo] = useState(false);

  // Step 1: Order Details State
  const [selectedSize, setSelectedSize] = useState<PoloShirtSize>("M");
  const [courseYear, setCourseYear] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Bulk Order State (Support multiple shirts with different sizes)
  const [isBulkOrder, setIsBulkOrder] = useState(false);
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>({
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
  });

  const bulkTotalQuantity = Object.values(bulkQuantities).reduce((acc, qty) => acc + qty, 0);
  const currentQuantity = isBulkOrder ? bulkTotalQuantity : 1;
  const currentTotalAmount = currentQuantity * POLO_PRICE;
  const bulkBreakdown = Object.entries(bulkQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([size, qty]) => `${qty}x ${size}`)
    .join(", ");

  const updateBulkQuantity = (size: string, delta: number) => {
    setBulkQuantities((prev) => {
      const current = prev[size] || 0;
      const next = Math.max(0, Math.min(25, current + delta));
      return { ...prev, [size]: next };
    });
  };

  // Step 2: Receipt Upload State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Receipt Preview Modal
  const [viewingReceipt, setViewingReceipt] = useState(false);
  const [receiptModalLoading, setReceiptModalLoading] = useState(true);
  const [receiptModalError, setReceiptModalError] = useState(false);

  const handleOpenReceiptModal = async () => {
    setReceiptModalLoading(true);
    setReceiptModalError(false);
    if (!sessionToken) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          setSessionToken(session.access_token);
        }
      } catch (err) {
        console.warn("Could not retrieve session token for receipt viewer:", err);
      }
    }
    setViewingReceipt(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch student active order
  const fetchStudentOrder = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/merch/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data.order || null);
      }
    } catch (err) {
      console.warn("Could not fetch user order:", err);
    }
  }, []);

  // Auth session listener
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
            setAuthError(null);
            fetchStudentOrder(session.access_token);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setSessionToken(null);
            setAuthError(
              `"${email}" is not an @antiquespride.edu.ph university email. Sign in with your university Google account.`
            );
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        if (isMounted) setIsAuthLoading(false);
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
          setAuthError(null);
          fetchStudentOrder(session.access_token);
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setSessionToken(null);
          setAuthError(`Only ${ALLOWED_DOMAIN} accounts can order.`);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSessionToken(null);
        setActiveOrder(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchStudentOrder]);

  // Real-time synchronization: poll and refresh on tab focus to reflect management updates immediately
  useEffect(() => {
    if (!sessionToken) return;

    const handleFocus = () => {
      fetchStudentOrder(sessionToken);
    };
    window.addEventListener("focus", handleFocus);

    // 4-second poll so status changes in management reflect automatically
    const interval = setInterval(() => {
      fetchStudentOrder(sessionToken);
    }, 4000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [sessionToken, fetchStudentOrder]);

  // Google sign in
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("psits_auth_redirect", "/merch");
      }
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/merch`
          : "";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: { hd: "antiquespride.edu.ph" },
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setAuthError(error.message);
        setIsSigningIn(false);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed.");
      setIsSigningIn(false);
    }
  };

  // STEP 1: Submit Order Details (No receipt required initially)
  const handlePlaceOrderDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) {
      setDetailsError("Sign in with your university account to order.");
      return;
    }

    if (!courseYear.trim()) {
      setDetailsError("Please enter your Course and Section (e.g. BSINFO 3-A).");
      return;
    }

    if (isBulkOrder && bulkTotalQuantity < 1) {
      setDetailsError("Please select at least 1 shirt for your bulk order.");
      return;
    }

    setIsSubmittingDetails(true);
    setDetailsError(null);

    try {
      const formData = new FormData();
      formData.append("is_bulk", isBulkOrder ? "true" : "false");
      formData.append("quantity", String(currentQuantity));
      formData.append("size", isBulkOrder ? bulkBreakdown : selectedSize);
      formData.append("bulk_breakdown", bulkBreakdown);
      formData.append("course_year", courseYear.trim());
      formData.append("contact_number", contactNumber.trim());
      formData.append("notes", notes.trim());

      const res = await fetch("/api/merch/orders", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit order details.");
      }

      setActiveOrder(data.order);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Error placing order.");
    } finally {
      setIsSubmittingDetails(false);
    }
  };

  // Receipt file selection with WebP optimization
  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceiptError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(selected.type.toLowerCase())) {
      setReceiptError("Upload a PNG, JPG, or WebP photo of your receipt.");
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setReceiptError("Receipt photo too large (max 15MB). Take a clearer photo.");
      return;
    }

    try {
      const compressed = await compressImageToWebP(selected);
      setReceiptFile(compressed);
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(URL.createObjectURL(compressed));
    } catch {
      setReceiptFile(selected);
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(URL.createObjectURL(selected));
    }
  };

  // STEP 2: Upload Receipt to Active Order
  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) {
      setReceiptError("Sign in with your university account to proceed.");
      return;
    }

    if (!receiptFile) {
      setReceiptError("Please select or photograph your paper receipt first.");
      return;
    }

    setIsUploadingReceipt(true);
    setReceiptError(null);

    try {
      const formData = new FormData();
      formData.append("receipt", receiptFile);

      const res = await fetch("/api/merch/orders/receipt", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload payment receipt.");
      }

      setActiveOrder(data.order);
      setReceiptFile(null);
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setReceiptError(err instanceof Error ? err.message : "Error uploading receipt.");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Determine current lifecycle state
  const hasActiveOrder = Boolean(activeOrder);
  const isCancelled = activeOrder?.status === "cancelled";
  const hasReceipt = Boolean(
    activeOrder?.receipt_key &&
    activeOrder.receipt_key !== "pending_upload" &&
    activeOrder?.receipt_url &&
    activeOrder.receipt_url !== "/api/merch/orders/pending"
  );
  const isFulfilled =
    !isCancelled &&
    (activeOrder?.status === "ready_for_pickup" || activeOrder?.status === "completed");

  // Handle switching to mobile order form
  const handleProceedToMobileForm = () => {
    setMobileStep("form");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  return (
    <MerchLockWrapper>
      <main className="min-h-screen bg-canvas text-text font-body pt-20 sm:pt-24 lg:pt-28 pb-12 sm:pb-24 px-3 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-2.5 sm:space-y-6 w-full max-w-full min-w-0">
          {/* Top Navigation */}
          <div>
            {!hasActiveOrder && mobileStep === "form" ? (
              <button
                type="button"
                onClick={() => {
                  setMobileStep("product");
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "instant" });
                  }
                }}
                className="lg:hidden inline-flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-text transition-colors cursor-pointer group py-0.5"
              >
                <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform text-gold" />
                <span>Back to Polo Overview</span>
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-text transition-colors group py-0.5"
              >
                <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform text-gold" />
                <span>Back to PSITS-UA</span>
              </Link>
            )}
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-600 dark:text-rose-400 flex items-center gap-2.5">
              <AlertCircle size={15} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* ONBOARDING CHECKOUT GRID */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT: STUDIO PRODUCT SHOWCASE */}
            {/* On mobile: Hidden if already ordered OR if student is on the form step */}
            <div
              className={`lg:col-span-6 xl:col-span-7 space-y-6 lg:sticky lg:top-28 ${
                hasActiveOrder || mobileStep === "form" ? "hidden lg:block" : "block"
              }`}
            >
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-b from-black/[0.02] dark:from-white/[0.02] to-black/[0.08] dark:to-white/[0.04] border border-border/60 flex items-center justify-center p-6 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={POLO_IMAGE}
                  alt="PSITS Official Polo Shirt"
                  className="w-full h-full object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Minimal Product Meta & Designer Credit */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3 text-left font-mono text-xs">
                  <div className="p-3 rounded-2xl bg-surface/50 border border-border/50">
                    <span className="text-[10px] uppercase text-muted block">Fabric &amp; Print</span>
                    <span className="font-semibold text-foreground-theme text-[11px] truncate block">Sublimation</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface/50 border border-border/50">
                    <span className="text-[10px] uppercase text-muted block">Winning Entry</span>
                    <span className="font-semibold text-foreground-theme text-[11px] truncate block">{POLO_DESIGN.title}</span>
                  </div>
                </div>

                {/* Designer Credit with Info Story Trigger */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface/60 border border-border/60 text-xs font-mono">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted block font-semibold">Designed by</span>
                    <span className="font-bold text-foreground-theme text-xs truncate block">
                      {POLO_DESIGN.designer}
                    </span>
                    <span className="text-[10px] text-muted block">{POLO_DESIGN.section} · Official Contest Winner</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDesignInfo(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold text-xs font-bold shrink-0 cursor-pointer transition-all active:scale-95"
                    title="Read Design Description"
                  >
                    <Info size={14} />
                    <span>Story</span>
                  </button>
                </div>
              </div>

              {/* Mobile Product Summary & CTA (Shown on mobile when viewing shirt) */}
              {!hasActiveOrder && (
                <div className="lg:hidden p-5 rounded-3xl border border-border/70 bg-surface/80 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h1 className="font-display font-black text-xl text-slate-900 dark:text-white">
                        PSITS Official Polo Shirt
                      </h1>
                      <button
                        type="button"
                        onClick={() => setShowDesignInfo(true)}
                        className="inline-flex items-center gap-1 p-1.5 px-2 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                        aria-label="View Design Details"
                        title="Design Description"
                      >
                        <Info size={15} />
                        <span className="text-[11px]">Info</span>
                      </button>
                    </div>

                    <p className="text-[11px] font-mono text-muted">
                      Designed by <strong className="text-foreground-theme">{POLO_DESIGN.designer}</strong> ({POLO_DESIGN.section})
                    </p>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-2xl font-black font-display text-gold">₱{POLO_PRICE}.00</span>
                      <span className="text-[11px] font-mono text-muted">Sizes XS – XL</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToMobileForm}
                    className="w-full py-4 px-6 rounded-2xl bg-gold hover:bg-gold-light text-[#0D1117] font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,166,35,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag size={16} />
                    <span>Place Order — ₱{POLO_PRICE}.00 each</span>
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: ONBOARDING STEPPED PANELS */}
            {/* On mobile: Hidden if not ordered and still on "product" overview step */}
            <div
              className={`lg:col-span-6 xl:col-span-5 w-full max-w-full min-w-0 ${
                !hasActiveOrder && mobileStep === "product" ? "hidden lg:block" : "block"
              }`}
            >
              {/* STATE 5: ORDER CANCELLED */}
              {hasActiveOrder && isCancelled && activeOrder && (
                <div className="rounded-3xl border border-rose-500/30 bg-surface/90 backdrop-blur-md p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-xl text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                    <XCircle size={44} className="stroke-[2.2]" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-rose-500 font-bold block">
                      Order Cancelled
                    </span>
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                      #{activeOrder.id.slice(0, 8).toUpperCase()}
                    </h1>
                    <p className="text-xs font-mono text-muted">
                      {activeOrder.student_name} ({activeOrder.student_email})
                    </p>
                  </div>

                  {/* Rose Callout */}
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-700 dark:text-rose-300 text-left leading-relaxed space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <AlertCircle size={15} />
                      <span>This order was marked as cancelled by the PSITS Office.</span>
                    </p>
                    <p className="text-[11px] opacity-90">
                      If you have already paid or believe this cancellation is an error, please visit the <strong>PSITS Office</strong> with your receipt for assistance.
                    </p>
                  </div>

                  <div className="space-y-2 font-mono text-xs text-left pt-2 border-t border-border/50">
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Item:</span>
                      <span className="font-bold text-foreground-theme">PSITS Official Polo Shirt</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Quantity &amp; Size:</span>
                      <span className="font-bold text-foreground-theme">
                        {activeOrder.quantity > 1 ? `${activeOrder.quantity}x (${activeOrder.size})` : activeOrder.size}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Section:</span>
                      <span className="font-bold text-foreground-theme">{activeOrder.course_year}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Status:</span>
                      <span className="font-bold text-rose-500 uppercase">Cancelled</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted">Total Amount:</span>
                      <span className="font-bold text-foreground-theme">₱{activeOrder.total_amount || POLO_PRICE}.00</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {hasReceipt && (
                      <button
                        type="button"
                        onClick={handleOpenReceiptModal}
                        className="w-full py-3 px-4 rounded-2xl border border-border hover:border-gold text-xs font-mono font-medium text-foreground-theme transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Eye size={13} />
                        <span>View Uploaded Paper Receipt</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveOrder(null);
                        setMobileStep("form");
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gold hover:bg-gold-light text-[#0D1117] font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={15} />
                      <span>Place a New Order</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 4: ORDER READY FOR PICKUP OR COMPLETED */}
              {hasActiveOrder && !isCancelled && isFulfilled && activeOrder && (
                <div className="rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-md p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-xl text-center">
                  <LottieAnimation
                    path="/assets/order_placed.json"
                    loop={true}
                    className="w-32 h-32 sm:w-40 sm:h-40 mx-auto"
                  />

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 font-bold block">
                      {activeOrder.status === "ready_for_pickup" ? "Ready For Claiming" : "Order Completed"}
                    </span>
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                      #{activeOrder.id.slice(0, 8).toUpperCase()}
                    </h1>
                    <p className="text-xs font-mono text-muted">
                      {activeOrder.student_name} ({activeOrder.student_email})
                    </p>
                  </div>

                  {activeOrder.status === "ready_for_pickup" ? (
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 font-mono text-xs text-purple-600 dark:text-purple-300 text-left space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <Package size={15} />
                        <span>Ready for Pick Up at PSITS Office!</span>
                      </p>
                      <p className="text-[11px] opacity-90">
                        Present your receipt at the PSITS Office to claim your official PSITS polo uniform.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs text-emerald-600 dark:text-emerald-400 text-left">
                      <p className="font-bold">Order Claimed &amp; Completed</p>
                      <p className="text-[11px] opacity-90 mt-0.5">Thank you for ordering your official PSITS polo shirt.</p>
                    </div>
                  )}

                  <div className="space-y-2 font-mono text-xs text-left pt-2 border-t border-border/50">
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Quantity &amp; Size:</span>
                      <span className="font-bold text-gold">
                        {activeOrder.quantity > 1 ? `${activeOrder.quantity}x (${activeOrder.size})` : activeOrder.size}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Section:</span>
                      <span className="font-bold text-foreground-theme">{activeOrder.course_year}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Pickup Location:</span>
                      <span className="font-bold text-emerald-500">PSITS Office</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted">Amount Paid:</span>
                      <span className="font-bold text-foreground-theme">₱{activeOrder.total_amount || POLO_PRICE}.00</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenReceiptModal}
                    className="w-full py-3 px-4 rounded-2xl border border-border hover:border-gold text-xs font-mono font-medium text-foreground-theme transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>View Uploaded Paper Receipt</span>
                  </button>
                </div>
              )}

              {/* STATE 3: ORDER IN PROCESS (RECEIPT UPLOADED ➔ AWAITING VERIFICATION / TAILORING) */}
              {hasActiveOrder && !isCancelled && !isFulfilled && hasReceipt && activeOrder && (
                <div className="rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-md p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-xl text-center">
                  <LottieAnimation
                    path="/assets/timer.json"
                    loop={true}
                    className="w-32 h-32 sm:w-40 sm:h-40 mx-auto"
                  />

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold block">
                      {activeOrder.status === "ordered" ? "In Production" : "Pending Officer Review"}
                    </span>
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                      Order Is On Process
                    </h1>
                    <p className="text-xs font-mono text-muted">
                      Ref #{activeOrder.id.slice(0, 8).toUpperCase()} · {activeOrder.student_name}
                    </p>
                  </div>

                  {/* Yellow Indicator: Student picks up at PSITS Office */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-700 dark:text-amber-300 text-left leading-relaxed space-y-1">
                    <p className="font-bold">Your payment receipt has been submitted.</p>
                    <p className="text-[11px] opacity-90">
                      Officers at the PSITS Office are verifying your receipt. You will pick up your uniform polo at the PSITS Office once tailoring is complete and marked ready.
                    </p>
                  </div>

                  <div className="space-y-2 font-mono text-xs text-left pt-2 border-t border-border/50">
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Item:</span>
                      <span className="font-bold text-foreground-theme">PSITS Official Polo Shirt</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Quantity &amp; Size:</span>
                      <span className="font-bold text-gold">
                        {activeOrder.quantity > 1 ? `${activeOrder.quantity}x (${activeOrder.size})` : activeOrder.size}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Section:</span>
                      <span className="font-bold text-foreground-theme">{activeOrder.course_year}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span className="text-muted">Pickup Location:</span>
                      <span className="font-bold text-emerald-500">PSITS Office</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted">Amount:</span>
                      <span className="font-bold text-foreground-theme">₱{activeOrder.total_amount || POLO_PRICE}.00</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenReceiptModal}
                    className="w-full py-3 px-4 rounded-2xl border border-border hover:border-gold text-xs font-mono font-medium text-foreground-theme transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>View Uploaded Paper Receipt</span>
                  </button>
                </div>
              )}

              {/* STATE 2: ORDER PLACED (DETAILS SUBMITTED, AWAITING CASH PAYMENT & RECEIPT) */}
              {hasActiveOrder && !isCancelled && !hasReceipt && activeOrder && (
                <div className="rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-md p-4 sm:p-8 space-y-3 sm:space-y-6 shadow-xl text-center w-full max-w-full min-w-0 overflow-hidden">
                  <LottieAnimation
                    path="/assets/check.json"
                    loop={true}
                    className="w-24 h-24 sm:w-32 sm:h-32 mx-auto"
                  />

                  <div className="space-y-0.5 sm:space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 font-bold block">
                      Order Details Placed
                    </span>
                    <h1 className="font-display font-black text-xl sm:text-3xl text-slate-900 dark:text-white">
                      #{activeOrder.id.slice(0, 8).toUpperCase()}
                    </h1>
                    <p className="text-[11px] sm:text-xs font-mono text-muted">
                      {activeOrder.student_name} ({activeOrder.student_email})
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-border/60 text-left font-mono text-xs space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Quantity &amp; Size:</span>
                      <span className="font-bold text-gold text-xs sm:text-sm">
                        {activeOrder.quantity > 1 ? `${activeOrder.quantity}x (${activeOrder.size})` : activeOrder.size}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Section:</span>
                      <span className="font-bold text-foreground-theme">{activeOrder.course_year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Pickup Location:</span>
                      <span className="font-bold text-emerald-500">PSITS Office</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/40">
                      <span className="text-muted">Total Payable:</span>
                      <span className="font-black text-foreground-theme text-xs sm:text-sm">₱{activeOrder.total_amount || POLO_PRICE}.00</span>
                    </div>
                  </div>

                  {/* Minimalist Confirmation Callout */}
                  <div className="p-3 sm:p-4 rounded-2xl bg-gold/10 border border-gold/30 text-xs font-mono text-slate-800 dark:text-slate-200 text-left space-y-0.5 sm:space-y-1">
                    <p className="font-bold text-gold text-[11px] sm:text-xs">To confirm your order:</p>
                    <p className="text-[10.5px] sm:text-[11px] leading-relaxed opacity-95">
                      Pay ₱{activeOrder.total_amount || POLO_PRICE} in cash at the PSITS Office, then upload your paper receipt below to proceed to processing.
                    </p>
                  </div>

                  {receiptError && (
                    <div className="p-2.5 sm:p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-600 dark:text-rose-400 flex items-center gap-2 text-left">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{receiptError}</span>
                    </div>
                  )}

                  {/* Upload Receipt Form */}
                  <form onSubmit={handleUploadReceipt} className="space-y-2.5 sm:space-y-4 pt-0.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleReceiptChange}
                    />

                    {receiptFile && receiptPreview ? (
                      <div className="relative p-2.5 sm:p-3 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-gold/40 flex items-center justify-between gap-2.5 text-left w-full max-w-full min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={receiptPreview}
                            alt="Receipt Preview"
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl border border-border shrink-0"
                          />
                          <div className="min-w-0 flex-1 overflow-hidden font-mono text-xs">
                            <span className="font-bold text-foreground-theme block truncate text-[11px] sm:text-xs max-w-full">
                              {receiptFile.name}
                            </span>
                            <span className="text-[10px] text-muted block truncate">
                              {(receiptFile.size / 1024).toFixed(1)} KB · Ready to upload
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-surface border border-border hover:border-gold font-mono text-[10px] sm:text-[11px] text-foreground-theme shrink-0 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 sm:py-5 px-3 sm:px-4 rounded-2xl border border-dashed border-gold/50 hover:border-gold bg-gold/5 text-xs font-mono text-muted hover:text-foreground-theme transition-colors flex flex-col items-center justify-center gap-1 sm:gap-2 cursor-pointer"
                      >
                        <Camera size={18} className="text-gold" />
                        <span className="font-bold text-foreground-theme text-xs">Tap to Upload Paper Receipt</span>
                        <span className="text-[10px] opacity-75">PNG, JPG, or WebP up to 15MB</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={!receiptFile || isUploadingReceipt}
                      className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-[#0D1117] font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(245,166,35,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isUploadingReceipt ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Uploading Receipt...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={16} />
                          <span>Confirm Order with Receipt</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* STATE 1: STEP 1 ONBOARDING (CONFIGURE SIZE & FILL DETAILS) */}
              {!hasActiveOrder && (
                <form
                  onSubmit={handlePlaceOrderDetails}
                  className="rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-md p-4 sm:p-8 space-y-3.5 sm:space-y-6 shadow-xl"
                >
                  {/* Header Title & Price with Design Story Trigger */}
                  <div className="space-y-1 pb-2.5 sm:pb-4 border-b border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <h1 className="font-display font-black text-xl sm:text-3xl text-slate-900 dark:text-white leading-tight">
                        PSITS Official Polo Shirt
                      </h1>
                      <button
                        type="button"
                        onClick={() => setShowDesignInfo(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold font-mono text-xs font-bold cursor-pointer shrink-0 transition-all active:scale-95"
                        title="Read design inspiration & story"
                      >
                        <Info size={14} />
                        <span className="text-[11px]">Design Story</span>
                      </button>
                    </div>

                    <p className="text-xs font-mono text-muted">
                      Designed by <span className="text-foreground-theme font-semibold">{POLO_DESIGN.designer}</span> ({POLO_DESIGN.section}) · <em className="text-gold/90">{POLO_DESIGN.title}</em>
                    </p>

                    <div className="flex items-baseline justify-between pt-0.5 sm:pt-1">
                      <span className="text-2xl sm:text-3xl font-black font-display text-gold">₱{currentTotalAmount}.00</span>
                      <span className="text-[11px] sm:text-xs font-mono text-muted">
                        ₱475.00 each
                      </span>
                    </div>
                  </div>

                  {detailsError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{detailsError}</span>
                    </div>
                  )}

                  {/* 1. ORDER TYPE & SIZE SELECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        1. Select Size
                      </label>
                    </div>

                    {!isBulkOrder ? (
                      <div>
                        <div className="flex justify-between items-center text-xs font-mono mb-2">
                          <span className="text-muted text-[11px]">Individual shirt size:</span>
                          <span className="text-gold font-bold">
                            {selectedSize} · {SIZES.find((s) => s.size === selectedSize)?.chest} chest
                          </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {SIZES.map((s) => {
                            const isSelected = selectedSize === s.size;
                            return (
                              <button
                                type="button"
                                key={s.size}
                                onClick={() => setSelectedSize(s.size)}
                                className={`py-3 px-1 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center select-none active:scale-95 ${
                                  isSelected
                                    ? "border-gold bg-gold/20 text-gold font-black shadow-[0_0_15px_rgba(245,166,35,0.25)] ring-2 ring-gold/40"
                                    : "border-border/60 bg-black/5 dark:bg-white/[0.03] text-foreground-theme hover:border-gold/50"
                                }`}
                              >
                                <span className="text-base font-black font-display">{s.size}</span>
                                <span className="text-[10px] font-mono opacity-60 mt-0.5">{s.chest}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* BULK ORDER STEPPERS */
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-2xl bg-gold/10 border border-gold/30 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                          <span className="font-bold text-gold">Bulk Order: </span>
                          <span>Specify quantities per size. Claim at the PSITS Office.</span>
                        </div>

                        <div className="divide-y divide-border/40 rounded-2xl border border-border/70 bg-black/5 dark:bg-white/[0.02] overflow-hidden">
                          {SIZES.map((s) => {
                            const count = bulkQuantities[s.size] || 0;
                            return (
                              <div
                                key={s.size}
                                className={`flex items-center justify-between p-2.5 sm:p-3 transition-colors ${
                                  count > 0 ? "bg-gold/10" : ""
                                }`}
                              >
                                <div className="font-mono">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-black font-display text-foreground-theme">
                                      {s.size}
                                    </span>
                                    <span className="text-[11px] text-muted">({s.chest} chest)</span>
                                  </div>
                                  <span className="text-[10px] text-muted">₱{POLO_PRICE}.00 each</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateBulkQuantity(s.size, -1)}
                                    disabled={count === 0}
                                    className="w-8 h-8 rounded-xl bg-surface border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold flex items-center justify-center font-bold text-base cursor-pointer text-foreground-theme transition-all active:scale-95"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-mono font-bold text-sm text-foreground-theme">
                                    {count}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateBulkQuantity(s.size, 1)}
                                    className="w-8 h-8 rounded-xl bg-surface border border-border hover:border-gold flex items-center justify-center font-bold text-base cursor-pointer text-foreground-theme transition-all active:scale-95"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {bulkTotalQuantity > 0 && (
                          <div className="p-2.5 rounded-xl bg-surface border border-border/60 flex items-center justify-between font-mono text-xs">
                            <span className="text-muted truncate mr-2">Breakdown: <strong className="text-foreground-theme">{bulkBreakdown}</strong></span>
                            <span className="font-bold text-gold shrink-0">{bulkTotalQuantity} {bulkTotalQuantity > 1 ? "shirts" : "shirt"}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. STUDENT VERIFICATION */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                      2. Student Account
                    </label>

                    {authError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {isAuthLoading ? (
                      <div className="py-4 text-center font-mono text-xs text-muted flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin text-gold" />
                        <span>Verifying session...</span>
                      </div>
                    ) : user ? (
                      <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-border/60 flex items-center justify-between font-mono text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-foreground-theme block truncate">
                            {user.user_metadata?.full_name || user.email?.split("@")[0]}
                          </span>
                          <span className="text-[11px] text-muted truncate block">{user.email}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-bold shrink-0 ml-2">
                          <Check size={13} />
                          <span>Verified</span>
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled={isSigningIn}
                          onClick={handleGoogleSignIn}
                          className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-[#161B22] hover:bg-slate-50 dark:hover:bg-[#1C2128] border border-slate-200 dark:border-white/15 hover:border-gold/50 text-slate-900 dark:text-white font-medium text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                        >
                          {isSigningIn ? (
                            <Loader2 size={16} className="animate-spin text-gold" />
                          ) : (
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                          )}
                          <span>{isSigningIn ? "Connecting to Google..." : "Continue with Google"}</span>
                        </button>
                        <p className="text-[11px] font-mono text-muted text-center">
                          Sign in with your <strong className="text-foreground-theme font-semibold">university email</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 3. ORDER DETAILS (REQUIRED SECTION, OPTIONAL PHONE/NOTE) */}
                  {user && (
                    <div className="space-y-2.5 pt-2 border-t border-border/50">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                        3. Order Details
                      </label>

                      <div className="space-y-2 font-mono text-xs">
                        <div>
                          <input
                            type="text"
                            required
                            value={courseYear}
                            onChange={(e) => setCourseYear(e.target.value)}
                            placeholder="Course &amp; Section (e.g. BSINFO 3-A) *"
                            className="w-full px-3.5 py-3 rounded-xl bg-black/5 dark:bg-black/30 border border-border/70 text-foreground-theme placeholder:text-muted/60 focus:outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <input
                            type="tel"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            placeholder="Contact Number (optional)"
                            className="w-full px-3.5 py-3 rounded-xl bg-black/5 dark:bg-black/30 border border-border/70 text-foreground-theme placeholder:text-muted/60 focus:outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Note (optional)"
                            className="w-full px-3.5 py-3 rounded-xl bg-black/5 dark:bg-black/30 border border-border/70 text-foreground-theme placeholder:text-muted/60 focus:outline-none focus:border-gold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. SUMMARY & PROCEED ACTION */}
                  <div className="pt-3 border-t border-border/60 space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center text-muted">
                      <span className="truncate mr-2">
                        PSITS Official Polo {isBulkOrder ? `(Bulk: ${bulkTotalQuantity} items)` : `(${selectedSize})`}
                      </span>
                      <span className="shrink-0">₱{currentTotalAmount}.00</span>
                    </div>
                    <div className="flex justify-between items-center text-muted">
                      <span>Campus Pickup (PSITS Office)</span>
                      <span className="text-emerald-500 font-semibold">FREE</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border/40 font-bold text-sm text-slate-900 dark:text-white">
                      <span>Total Amount</span>
                      <span className="text-gold text-lg font-black font-display">₱{currentTotalAmount}.00</span>
                    </div>

                    <button
                      type="submit"
                      disabled={!user || isSubmittingDetails || !courseYear.trim() || (isBulkOrder && bulkTotalQuantity < 1)}
                      className="w-full py-4 px-6 rounded-2xl bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-[#0D1117] font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(245,166,35,0.35)] flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {isSubmittingDetails ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Submitting Order Details...</span>
                        </>
                      ) : !user ? (
                        <span>Sign In to Place Order</span>
                      ) : !courseYear.trim() ? (
                        <span>Enter Course &amp; Section to Continue</span>
                      ) : isBulkOrder && bulkTotalQuantity < 1 ? (
                        <span>Select at least 1 shirt size</span>
                      ) : (
                        <span>Proceed to Place Order — ₱{currentTotalAmount}.00</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* MODAL: VIEW UPLOADED RECEIPT */}
        {viewingReceipt && activeOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  Payment Receipt · #{activeOrder.id.slice(0, 8).toUpperCase()}
                </span>
                <button
                  onClick={() => setViewingReceipt(false)}
                  className="p-1 rounded-full text-muted hover:text-text cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative w-full max-h-[60vh] aspect-[3/4] rounded-2xl overflow-hidden bg-black/20 flex items-center justify-center border border-border">
                {receiptModalLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted font-mono text-xs z-10 bg-surface/80 backdrop-blur-xs">
                    <Loader2 size={24} className="animate-spin text-gold" />
                    <span>Loading receipt image...</span>
                  </div>
                )}
                {receiptModalError ? (
                  <div className="p-4 text-center font-mono text-xs text-rose-500 space-y-2 z-10">
                    <AlertCircle size={24} className="mx-auto" />
                    <p>Could not load receipt image.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptModalError(false);
                        setReceiptModalLoading(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-surface border border-border hover:border-gold text-foreground-theme cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={
                      receiptPreview ||
                      `/api/merch/orders/${activeOrder.id}/receipt${
                        sessionToken ? `?token=${encodeURIComponent(sessionToken)}` : ""
                      }`
                    }
                    alt="Paper Receipt"
                    className="w-full h-full object-contain"
                    onLoad={() => setReceiptModalLoading(false)}
                    onError={() => {
                      setReceiptModalLoading(false);
                      setReceiptModalError(true);
                    }}
                  />
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingReceipt(false)}
                  className="px-4 py-2 rounded-xl bg-gold text-[#0D1117] font-mono text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DESIGN STORY & INSPIRATION (MOBILE & DESKTOP) */}
        {showDesignInfo && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShowDesignInfo(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-surface border border-border rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gold font-bold block">
                    Official Winning Entry · 63 Votes
                  </span>
                  <h3 className="font-display font-black text-xl text-slate-900 dark:text-white mt-0.5">
                    {POLO_DESIGN.title}
                  </h3>
                  <p className="text-xs font-mono text-muted mt-0.5">
                    Designed by <span className="text-foreground-theme font-semibold">{POLO_DESIGN.designer}</span> ({POLO_DESIGN.section})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDesignInfo(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted hover:text-foreground-theme transition-colors cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-border/60 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">Design Concept &amp; Story</span>
                  <p className="text-xs sm:text-sm text-foreground-theme font-sans leading-relaxed italic">
                    &ldquo;{POLO_DESIGN.description}&rdquo;
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11px]">
                  <div className="p-3 rounded-xl border border-border/50 bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-muted block text-[10px] uppercase">UA Core Torch</span>
                    <span className="font-bold text-foreground-theme block mt-0.5">Kasanag kag Kaaram</span>
                    <span className="text-[10px] text-muted opacity-80">Light and Knowledge</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border/50 bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-muted block text-[10px] uppercase">Antique Heritage</span>
                    <span className="font-bold text-foreground-theme block mt-0.5">Patadyong Detail</span>
                    <span className="text-[10px] text-muted opacity-80">Cultural Pride &amp; Identity</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDesignInfo(false)}
                className="w-full py-3 rounded-xl bg-gold hover:bg-gold-light text-[#0D1117] font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </MerchLockWrapper>
  );
}
