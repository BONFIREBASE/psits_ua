'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Bell,
  Heart,
  MessageSquare,
  CornerDownRight,
  AtSign,
  UserPlus,
  CheckCheck,
  X,
  Sparkles,
} from 'lucide-react'
import type { CommunityNotificationItem } from '@/app/community/actions'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: CommunityNotificationItem[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onOpenPost: (postId: string) => void
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenPost,
}: NotificationModalProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all')

  if (!isOpen) return null

  const displayedList = filterTab === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const renderTypeIcon = (type: CommunityNotificationItem['type']) => {
    switch (type) {
      case 'reaction':
        return (
          <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#0f141d]">
            <Heart className="w-2.5 h-2.5 fill-current" />
          </span>
        )
      case 'comment':
        return (
          <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#0f141d]">
            <MessageSquare className="w-2.5 h-2.5 fill-current" />
          </span>
        )
      case 'reply':
        return (
          <span className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#0f141d]">
            <CornerDownRight className="w-2.5 h-2.5" />
          </span>
        )
      case 'mention':
        return (
          <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#0f141d] font-bold">
            <AtSign className="w-2.5 h-2.5" />
          </span>
        )
      case 'follow':
        return (
          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#0f141d]">
            <UserPlus className="w-2.5 h-2.5" />
          </span>
        )
      default:
        return (
          <span className="w-4 h-4 rounded-full bg-gold text-slate-950 flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#0f141d]">
            <Bell className="w-2.5 h-2.5" />
          </span>
        )
    }
  }

  const handleItemClick = (item: CommunityNotificationItem) => {
    if (!item.is_read) {
      onMarkAsRead(item.$id)
    }
    if (item.post_id) {
      onClose()
      onOpenPost(item.post_id)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#0c1017] shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,16px)] animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-gold/20 text-gold border border-gold/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Realtime student updates & interactions</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-gold dark:hover:text-gold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-2 border-b border-black/[0.04] dark:border-white/[0.04] shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('unread')}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              filterTab === 'unread'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification List Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04] scrollbar-thin">
          {displayedList.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.05] mx-auto flex items-center justify-center text-slate-400">
                <Sparkles className="w-6 h-6 text-gold" />
              </div>
              <div className="font-display font-semibold text-sm text-slate-800 dark:text-white/80">
                {filterTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                When kasubays react to your discussions, comment on your posts, or mention you, updates will appear here live.
              </p>
            </div>
          ) : (
            displayedList.map(item => {
              const isUnread = !item.is_read
              const isFollow = item.type === 'follow'

              const contentBlock = (
                <div
                  key={item.$id}
                  onClick={() => !isFollow && handleItemClick(item)}
                  className={`px-5 py-3.5 flex items-start gap-3.5 transition-colors cursor-pointer group ${
                    isUnread
                      ? 'bg-gold/[0.06] dark:bg-gold/[0.08] hover:bg-gold/10'
                      : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Actor Avatar with Action Indicator */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                      {item.actor_avatar && !item.actor_avatar.startsWith('preset:') ? (
                        <Image
                          src={item.actor_avatar}
                          alt={item.actor_name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gold bg-gold/10">
                          {item.actor_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {renderTypeIcon(item.type)}
                    </div>
                  </div>

                  {/* Notification Details */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                      <span className="font-bold text-slate-900 dark:text-white hover:underline">
                        {item.actor_name}
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-300">
                        {item.summary}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{timeAgo(item.$createdAt)}</span>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
                      )}
                    </div>
                  </div>
                </div>
              )

              if (isFollow) {
                return (
                  <Link
                    key={item.$id}
                    href={`/community/${item.actor_handle}`}
                    onClick={() => {
                      if (isUnread) onMarkAsRead(item.$id)
                      onClose()
                    }}
                  >
                    {contentBlock}
                  </Link>
                )
              }

              return contentBlock
            })
          )}
        </div>
      </div>
    </div>
  )
}
