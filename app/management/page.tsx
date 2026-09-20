'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import coverImage from '@/public/assets/cover.jpg'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  Shield,
  Lock,
  KeyRound,
  X,
  ArrowLeft,
} from 'lucide-react'
import { useAuth } from './_context/auth-context'
import { LoginCardSkeleton } from './_components/SkeletonPreloader'
import TurnstileWidget from '@/components/TurnstileWidget'

type LoginMode = 'sso' | 'admin'

export default function ManagementLoginPage() {
  const {
    loginWithAdminPassword,
    loginWithGoogle,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<LoginMode>('sso')
  const [adminPassword, setAdminPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect to dashboard safely inside useEffect
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/management/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  // Reset token and clear errors when switching modes
  function switchMode(newMode: LoginMode) {
    setMode(newMode)
    setError(null)
    setAdminPassword('')
    setTurnstileToken(null)
    setResetKey((k) => k + 1)
    setIsSubmitting(false)
  }

  // If already authenticated or loading, render skeleton
  if (authLoading || isAuthenticated) {
    return <LoginCardSkeleton />
  }

  // Turnstile canonical verification helper
  async function validateBotToken(action: string): Promise<boolean> {
    if (!turnstileToken) {
      setError('Please wait for the security verification check to complete.')
      return false
    }
    try {
      const res = await fetch('/api/auth/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken, action }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Bot challenge verification failed. Please try again.')
        setTurnstileToken(null)
        setResetKey((k) => k + 1)
        return false
      }
      return true
    } catch {
      setError('Turnstile verification service unreachable. Please try again.')
      setTurnstileToken(null)
      setResetKey((k) => k + 1)
      return false
    }
  }

  // ─── Officer: Continue with Google ───
  async function handleGoogleLogin() {
    setError(null)
    setIsSubmitting(true)
    const result = await loginWithGoogle()
    if (!result.success) {
      setError(result.error || 'Google login failed.')
      setIsSubmitting(false)
    }
  }

  // ─── Super Admin: Password Login ───
  async function handleAdminSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!(await validateBotToken('admin-login'))) {
      setIsSubmitting(false)
      return
    }

    const result = await loginWithAdminPassword(adminPassword)
    if (result.success) {
      router.replace('/management/dashboard')
    } else {
      setError(result.error || 'Invalid administrator authorization key.')
      setTurnstileToken(null)
      setResetKey((k) => k + 1)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center px-4 py-8 overflow-hidden bg-slate-100 dark:bg-[#0a0e17] transition-colors duration-200">
      {/* Immersive Cover Background with subtle tint */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image
          src={coverImage}
          alt=""
          fill
          className="object-cover object-center opacity-25 dark:opacity-45"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F1F5F9]/80 via-[#F1F5F9]/90 to-[#F1F5F9] dark:from-[#0a0e17]/75 dark:via-[#0a0e17]/85 dark:to-[#0a0e17]/95 backdrop-blur-[2px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[350px] sm:h-[450px] bg-navy/15 dark:bg-navy/20 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] sm:w-[350px] h-[300px] sm:h-[350px] bg-gold/[0.06] dark:bg-gold/[0.04] rounded-full blur-[150px]" />
      </div>

      {/* Top Floating Back to Home Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#0d1219]/80 hover:bg-white dark:hover:bg-[#0d1219] backdrop-blur-md border border-black/10 dark:border-white/10 hover:border-gold/40 text-xs font-mono text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform text-gold" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Top spacer for clean vertical centering */}
      <div className="w-full flex-1 min-h-[16px] max-h-[64px]" />

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[380px] my-auto"
      >
        <div className="bg-white/95 dark:bg-[#0d1219]/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.7)] relative overflow-hidden">
          {/* Specular top rim highlight */}
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-13 h-13 sm:w-14 sm:h-14 mb-3 relative">
              <Image
                src="/assets/logo/PSITS logo.png"
                alt="PSITS-UA"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight flex items-center gap-0.5">
              <span>PSITS</span>
              <span className="text-gold">-U</span>
              <span className="text-[#E63946]">A</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-white/40 font-mono uppercase tracking-[0.2em] mt-1">
              Officer Management Portal
            </p>
          </div>

          {/* Dynamic Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-600 dark:text-red-300 text-xs mb-4"
            >
              <AlertCircle size={14} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed text-[11px] sm:text-xs">{error}</span>
            </motion.div>
          )}

          {/* Animated Modes: Officer SSO vs Admin Console */}
          <AnimatePresence mode="wait">
            {/* ───────── MODE 1: Officer Google SSO (Default) ───────── */}
            {mode === 'sso' && (
              <motion.div
                key="sso"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Security advisory */}
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/6">
                  <Shield size={14} className="text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 dark:text-white/45 leading-relaxed">
                    Access restricted to verified PSITS officers with an official{' '}
                    <span className="text-slate-900 dark:text-white/70 font-medium">@antiquespride.edu.ph</span>{' '}
                    Google Workspace account.
                  </p>
                </div>

                {/* Primary Single Action: Continue with Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="
                    w-full flex items-center justify-center gap-3
                    py-3 px-4 rounded-xl
                    bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100
                    text-white dark:text-[#0f172a] font-semibold text-xs sm:text-sm
                    active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                    shadow-lg shadow-black/10 dark:shadow-black/40
                    min-h-[46px]
                  "
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
                  <span>{isSubmitting ? 'Authenticating...' : 'Continue with Google'}</span>
                </button>
              </motion.div>
            )}

            {/* ───────── MODE 2: Super Admin Master Key ───────── */}
            {mode === 'admin' && (
              <motion.form
                key="admin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleAdminSubmit}
                className="space-y-3.5"
              >
                {/* Header with Return button */}
                <div className="flex items-center justify-between pb-1 border-b border-black/8 dark:border-white/6">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gold flex items-center gap-1.5 font-bold">
                    <KeyRound size={12} /> Master Console
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode('sso')}
                    className="text-slate-400 dark:text-white/30 hover:text-slate-800 dark:hover:text-white transition-colors p-1"
                    title="Return to Officer Portal"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="master-key"
                    className="block font-mono text-[10px] text-gold uppercase tracking-wider font-semibold"
                  >
                    Authorization Key
                  </label>
                  <input
                    id="master-key"
                    type="password"
                    placeholder="Enter master authorization key..."
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value)
                      setError(null)
                    }}
                    autoFocus
                    required
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-gold/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 font-mono transition-all min-h-[42px]"
                  />
                </div>

                {/* Dedicated Centered Turnstile Widget */}
                <div className="py-1">
                  <TurnstileWidget
                    action="admin-login"
                    resetKey={resetKey}
                    onVerify={(token) => {
                      setTurnstileToken(token)
                      setError(null)
                    }}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => {
                      setError('Security challenge blocked or failed. If using Brave Shields, please allow challenges or retry.')
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !adminPassword.trim()}
                  className="
                    w-full py-2.5 px-4 rounded-xl
                    bg-gold hover:bg-gold-muted text-[#0a0e17]
                    text-xs font-bold transition-all duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed
                    shadow-lg shadow-gold/10 min-h-[44px]
                  "
                >
                  {isSubmitting ? 'Validating Session...' : 'Authorize Session'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Minimalist Footer with Discreet Admin Trigger */}
        <div className="flex items-center justify-end px-2 mt-3">
          <button
            type="button"
            onClick={() => switchMode(mode === 'admin' ? 'sso' : 'admin')}
            title="System Console"
            className="p-1.5 rounded-lg text-slate-400 dark:text-white/20 hover:text-gold hover:bg-black/5 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
            aria-label="Admin Access"
          >
            <Lock size={12} />
          </button>
        </div>
      </motion.div>

      {/* Bottom spacer for clean vertical balance */}
      <div className="w-full flex-1 min-h-[16px] max-h-[64px]" />
    </div>
  )
}
