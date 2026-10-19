'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  X,
  Camera,
  Globe,
  Loader2,
  Check,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { compressImageToWebP } from '@/lib/image-compress'
import { appwriteStorage, APPWRITE_STORAGE_BUCKET_ID } from '@/lib/appwrite'
import { ID } from 'appwrite'
import type { CommunityUserProfile } from './CommunityOnboardingModal'

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.95 0-1.68.73-1.68 1.68s.73 1.68 1.68 1.68 1.68-.73 1.68-1.68-.73-1.68-1.68-1.68z" />
    </svg>
  )
}

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    email: string
    name: string
    avatar?: string
    username?: string
    yearSection?: string
  } | null
  currentProfile: CommunityUserProfile | null
  onProfileUpdated: (profile: CommunityUserProfile) => void
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  currentProfile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [yearSection, setYearSection] = useState('')
  const [bio, setBio] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [github, setGithub] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [instagram, setInstagram] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentProfile?.name || user?.name || '')
      setYearSection(currentProfile?.yearSection || user?.yearSection || 'BSIT')
      setBio(currentProfile?.bio || '')
      setPortfolio(currentProfile?.portfolio || '')
      setGithub(currentProfile?.github || '')
      setLinkedin(currentProfile?.linkedin || '')
      setInstagram((currentProfile as { instagram?: string })?.instagram || '')
      setAvatarUrl(currentProfile?.avatar || user?.avatar || '')
      setErrorMsg(null)
      setSuccessToast(false)
    }
  }, [isOpen, currentProfile, user])

  if (!isOpen) return null

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.')
      return
    }

    setIsUploadingAvatar(true)
    setErrorMsg(null)
    try {
      const compressed = await compressImageToWebP(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 })
      const createdFile = await appwriteStorage.createFile(
        APPWRITE_STORAGE_BUCKET_ID,
        ID.unique(),
        compressed
      )
      const uploadedUrl = appwriteStorage.getFileView(APPWRITE_STORAGE_BUCKET_ID, createdFile.$id)
      setAvatarUrl(uploadedUrl)
    } catch (err) {
      console.error('Avatar upload error:', err)
      setErrorMsg('Failed to upload avatar image.')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    setErrorMsg(null)

    try {
      const updatedData: CommunityUserProfile = {
        email: user.email,
        name: displayName.trim() || user.name,
        username: currentProfile?.username || (user.username ? `@${user.username}` : `@${user.name.toLowerCase().replace(/[^a-z0-9_]/g, '')}`),
        avatar: avatarUrl,
        yearSection: yearSection.trim() || 'BSIT',
        bio: bio.trim(),
        hobbies: currentProfile?.hobbies || [],
        github: github.trim(),
        linkedin: linkedin.trim(),
        portfolio: portfolio.trim(),
        tosAccepted: true,
        tosAcceptedAt: currentProfile?.tosAcceptedAt || new Date().toISOString(),
      }

      // 1. Persist to Supabase Auth user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: updatedData.name,
          community_avatar: updatedData.avatar,
          year_section: updatedData.yearSection,
          bio: updatedData.bio,
          social_github: updatedData.github,
          social_linkedin: updatedData.linkedin,
          social_portfolio: updatedData.portfolio,
          social_instagram: instagram.trim(),
          instagram: instagram.trim(),
        },
      })

      // 2. Cache locally
      try {
        const fullCached = {
          ...updatedData,
          instagram: instagram.trim(),
        }
        localStorage.setItem(`psits_community_profile_${user.email}`, JSON.stringify(fullCached))
      } catch {}

      // 3. Inform parent component
      onProfileUpdated({
        ...updatedData,
        ...({ instagram: instagram.trim() }),
      })

      setSuccessToast(true)
      setTimeout(() => {
        setSuccessToast(false)
        onClose()
      }, 700)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-[#11141a] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Instagram-Style Minimalist Avatar Header */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-900 ring-2 ring-gold/40 shrink-0 flex items-center justify-center">
              {avatarUrl && !avatarUrl.startsWith('preset:') ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gold font-bold text-xl bg-slate-900">
                  {displayName.charAt(0).toUpperCase() || 'U'}
                </div>
              )}

              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-gold animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate text-slate-900 dark:text-white">
                {currentProfile?.username || `@${user?.username || 'handle'}`}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-gold hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploadingAvatar ? 'Uploading...' : 'Change profile photo'}
                </button>
                {avatarUrl && (
                  <>
                    <span className="text-slate-300 dark:text-white/20 select-none">·</span>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields (Stacked Clean IG Style) */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-white/60 mb-1">
                Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Year & Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-white/60 mb-1">
                Year & Section
              </label>
              <input
                type="text"
                value={yearSection}
                onChange={e => setYearSection(e.target.value)}
                placeholder="e.g. BSIT 4-D, BSIT 1-A"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-white/60">
                  Bio
                </label>
                <span className={`text-[11px] font-mono ${bio.length > 160 ? 'text-rose-500' : 'text-slate-400 dark:text-white/40'}`}>
                  {bio.length} / 160
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={160}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Write a short bio about yourself..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-gold resize-none leading-relaxed"
              />
            </div>

            {/* Social Links & SEO Section */}
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">
                Links & Socials (SEO & Portfolio)
              </label>

              <div className="space-y-2.5">
                {/* Website / Portfolio */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 focus-within:ring-1 focus-within:ring-gold">
                  <Globe className="w-4 h-4 text-gold shrink-0" />
                  <input
                    type="url"
                    value={portfolio}
                    onChange={e => setPortfolio(e.target.value)}
                    placeholder="Website or Portfolio URL (https://...)"
                    className="flex-1 bg-transparent text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none"
                  />
                </div>

                {/* GitHub */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 focus-within:ring-1 focus-within:ring-gold">
                  <GithubIcon className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={github}
                    onChange={e => setGithub(e.target.value)}
                    placeholder="GitHub username or profile URL"
                    className="flex-1 bg-transparent text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none"
                  />
                </div>

                {/* LinkedIn */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 focus-within:ring-1 focus-within:ring-gold">
                  <LinkedinIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  <input
                    type="text"
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                    placeholder="LinkedIn profile URL or handle"
                    className="flex-1 bg-transparent text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none"
                  />
                </div>

                {/* Instagram */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 focus-within:ring-1 focus-within:ring-gold">
                  <InstagramIcon className="w-4 h-4 text-pink-500 shrink-0" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="Instagram handle (e.g. @yourhandle)"
                    className="flex-1 bg-transparent text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-2.5 bg-black/[0.01] dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUploadingAvatar}
            className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-muted text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : successToast ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-900" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Done</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
