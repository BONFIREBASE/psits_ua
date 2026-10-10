'use server'

import { createServerAppwriteClient } from '@/lib/appwrite-server'
import { APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '@/lib/appwrite'
import { getCache, setCache, deleteCache } from '@/lib/ratelimit'
import { validateSessionAction } from '@/lib/session'
import { ID, Query, Models } from 'node-appwrite'
import { supabaseAdmin } from '@/lib/supabase'
import { detectProhibitedHandle } from '@/lib/community-validation'

const FEED_CACHE_KEY = 'psits:community:feed:recent'
const FEED_CACHE_TTL = 45 // 45 seconds Stale-While-Revalidate
const SUPER_ADMIN_EMAIL = 'psits-ua@antiquespride.edu.ph'

export interface CommunityPostItem {
  $id: string
  $createdAt: string
  content: string
  author_student_no?: string
  author_display_name: string
  author_avatar?: string
  author_year_section?: string
  is_anonymous: boolean
  is_verified: boolean
  is_officer: boolean
  officer_title?: string
  attachments?: string[]
  attachment_names?: string[]
  attachment_types?: string[]
  attachment_sizes?: string[]
  likes_count: number
  comments_count: number
  tags?: string[]
  is_locked: boolean
  is_flagged: boolean
  flag_count: number
  status: 'active' | 'hidden' | 'archived'
}

interface AppwritePostRecord extends Models.Document {
  content?: string
  author_student_no?: string
  author_display_name?: string
  author_avatar?: string
  author_year_section?: string
  is_anonymous?: boolean
  is_verified?: boolean
  is_officer?: boolean
  officer_title?: string
  attachments?: string[]
  attachment_names?: string[]
  attachment_types?: string[]
  attachment_sizes?: string[]
  likes_count?: number
  comments_count?: number
  tags?: string[]
  is_locked?: boolean
  is_flagged?: boolean
  flag_count?: number
  status?: string
}

interface AppwriteCommentRecord extends Models.Document {
  post_id?: string
  content?: string
  author_student_no?: string
  author_display_name?: string
  author_avatar?: string
  is_anonymous?: boolean
  is_verified?: boolean
  is_officer?: boolean
  officer_title?: string
  is_flagged?: boolean
  flag_count?: number
  status?: string
}

export interface CommunityCommentItem {
  $id: string
  $createdAt: string
  content: string
  author_display_name: string
  author_avatar?: string
  is_anonymous: boolean
  is_verified: boolean
  is_officer: boolean
  officer_title?: string
}

async function resolveOfficerStatus(email: string, name?: string): Promise<{ isOfficer: boolean; title: string }> {
  const normalizedEmail = (email || '').toLowerCase().trim()
  if (normalizedEmail === SUPER_ADMIN_EMAIL || normalizedEmail.includes('admin')) {
    return { isOfficer: true, title: 'PSITS Super Admin' }
  }

  try {
    const cleanName = (name || '').trim()
    let query = supabaseAdmin.from('officers').select('position, role_group, name, email')
    if (normalizedEmail && cleanName) {
      query = query.or(`email.eq.${normalizedEmail},name.ilike.%${cleanName}%`)
    } else if (normalizedEmail) {
      query = query.eq('email', normalizedEmail)
    } else if (cleanName) {
      query = query.ilike('name', `%${cleanName}%`)
    } else {
      return { isOfficer: false, title: '' }
    }

    const { data: dbOfficers } = await query

    if (dbOfficers && dbOfficers.length > 0) {
      // Prioritize Executive titles (e.g. Vice President, President)
      const exec = dbOfficers.find(o => o.role_group === 'Executive' || o.position.toLowerCase().includes('president'))
      if (exec) {
        return { isOfficer: true, title: exec.position }
      }
      return { isOfficer: true, title: dbOfficers[0].position }
    }
  } catch {
    // ignore
  }

  return { isOfficer: false, title: '' }
}

export interface AutoResolveEligibilityResult {
  verified: boolean
  isOfficer: boolean
  officerTitle?: string
  studentNo?: string
  name: string
  yearSection: string
  error?: string
}

function normalizeWords(str: string): string[] {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
}

/**
 * 100% Automated Background Resolver for Community Access.
 * Resolves ID-based emails (1st/2nd years), initial-based emails (3rd/4th years),
 * and Executive/Faculty accounts with zero manual user input directly via Supabase.
 */
export async function autoResolveStudentEligibilityAction(params: {
  email: string
  googleName?: string
}): Promise<AutoResolveEligibilityResult> {
  const cleanEmail = (params.email || '').toLowerCase().trim()
  const cleanGoogleName = (params.googleName || '').trim()

  if (!cleanEmail.endsWith('@antiquespride.edu.ph')) {
    return {
      verified: false,
      isOfficer: false,
      name: cleanGoogleName || cleanEmail,
      yearSection: 'Non-IT',
      error: 'Access restricted: Please sign in with your official @antiquespride.edu.ph student account.',
    }
  }

  // 1. Resolve Enrolled Student Record from public.students
  let studentMatch: { student_no: string; full_name: string; year_section: string } | null = null

  // A. ID-Based Email (1st & 2nd Years, e.g. 2024s00002@... -> 2024-S00002)
  const idMatch = cleanEmail.match(/^(\d{4})s(\d{5})@antiquespride\.edu\.ph$/i)
  if (idMatch) {
    const studentNo = `${idMatch[1]}-S${idMatch[2]}`
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('student_no, full_name, year_section')
      .eq('student_no', studentNo)
      .eq('program', 'BSIT')
      .eq('is_active', true)
      .maybeSingle()

    if (student) {
      studentMatch = student
    }
  }

  // B. Name & Senior Initial Decomposition (3rd & 4th Years, e.g. eblabanon@...)
  if (!studentMatch) {
    const prefix = cleanEmail.split('@')[0]
    const { data: allStudents } = await supabaseAdmin
      .from('students')
      .select('student_no, full_name, full_name_normalized, year_section')
      .eq('program', 'BSIT')
      .eq('is_active', true)

    if (allStudents && allStudents.length > 0) {
      // Token set match against Google Full Name
      if (cleanGoogleName) {
        const googleTokens = new Set(normalizeWords(cleanGoogleName))
        for (const s of allStudents) {
          const dbTokens = new Set(normalizeWords(s.full_name))
          let allFound = true
          for (const t of googleTokens) {
            if (!dbTokens.has(t)) {
              allFound = false
              break
            }
          }
          if (allFound && googleTokens.size >= 2) {
            studentMatch = { student_no: s.student_no, full_name: s.full_name, year_section: s.year_section }
            break
          }
        }
      }

      // Initial + surname match against prefix
      if (!studentMatch) {
        for (const s of allStudents) {
          const parts = s.full_name.split(',').map((p: string) => p.trim())
          if (parts.length < 2) continue
          const surname = parts[0].toLowerCase().replace(/[^a-z]/g, '')
          const givenNames = parts[1].toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean)
          const initials = givenNames.map((w: string) => w[0]).join('')

          if (prefix.endsWith(surname)) {
            const prefixInitials = prefix.slice(0, prefix.length - surname.length)
            if (initials.startsWith(prefixInitials) && prefixInitials.length > 0) {
              studentMatch = { student_no: s.student_no, full_name: s.full_name, year_section: s.year_section }
              break
            }
          }
        }
      }
    }
  }

  // 2. Check Leadership / Executive Status from public.officers
  const officerCheck = await resolveOfficerStatus(cleanEmail, cleanGoogleName)

  // A. Verified Officer / Executive (Includes real enrolled class section)
  if (officerCheck.isOfficer) {
    return {
      verified: true,
      isOfficer: true,
      officerTitle: officerCheck.title,
      studentNo: studentMatch?.student_no,
      name: cleanGoogleName || studentMatch?.full_name || 'PSITS Executive',
      yearSection: studentMatch?.year_section || 'CCIS Faculty',
    }
  }

  // B. Verified Regular CCIS BSIT Student
  if (studentMatch) {
    return {
      verified: true,
      isOfficer: false,
      studentNo: studentMatch.student_no,
      name: studentMatch.full_name,
      yearSection: studentMatch.year_section,
    }
  }

  // C. Non-IT or Unenrolled Account
  return {
    verified: false,
    isOfficer: false,
    name: cleanGoogleName || cleanEmail,
    yearSection: 'Unverified',
    error: 'Access restricted to College of Computing and Information Sciences (CCIS) BSIT students. Your account was not found on the official class roster.',
  }
}

/* ─── 1. Get Feed (with Upstash Redis Edge Caching) ─── */
export async function getCommunityFeedAction(tag?: string): Promise<{
  success: boolean
  posts: CommunityPostItem[]
  fromCache: boolean
  error?: string
}> {
  try {
    const cacheKey = tag ? `${FEED_CACHE_KEY}:${tag}` : FEED_CACHE_KEY

    // Try Redis cache first (0 DB queries)
    const cached = await getCache<CommunityPostItem[]>(cacheKey)
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return { success: true, posts: cached, fromCache: true }
    }

    // Cache miss -> Query Appwrite Singapore
    const { databases } = createServerAppwriteClient()
    const queries = [
      Query.equal('status', 'active'),
      Query.orderDesc('$createdAt'),
      Query.limit(30),
    ]

    if (tag && tag !== 'All') {
      queries.push(Query.contains('tags', tag))
    }

    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      queries
    )

    // Mask author_student_no for public consumption
    const sanitizedPosts: CommunityPostItem[] = (res.documents as unknown as AppwritePostRecord[]).map(doc => {
      const isAnon = Boolean(doc.is_anonymous)
      const isOff = Boolean(doc.is_officer) && !isAnon
      const offTitle = isOff ? String(doc.officer_title || 'Officer') : undefined

      return {
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        content: String(doc.content || ''),
        author_student_no: undefined, // Strictly stripped! Never leak student ID or institutional email to public clients
        author_display_name: isAnon
          ? 'Anonymous Kasubay'
          : (String(doc.author_display_name || '').startsWith('@')
            ? String(doc.author_display_name)
            : `@${String(doc.author_display_name || 'kasubay').toLowerCase().replace(/[^a-z0-9_.]/g, '')}`),
        author_avatar: isAnon ? '' : (doc.author_avatar ? String(doc.author_avatar) : ''),
        author_year_section: isAnon ? 'BSIT Student' : (doc.author_year_section ? String(doc.author_year_section) : 'BSIT'),
        is_anonymous: isAnon,
        is_verified: false, // Regular students have NO badge
        is_officer: isOff,
        officer_title: offTitle,
        attachments: Array.isArray(doc.attachments) ? doc.attachments.map(String) : [],
        attachment_names: Array.isArray(doc.attachment_names) ? doc.attachment_names.map(String) : [],
        attachment_types: Array.isArray(doc.attachment_types) ? doc.attachment_types.map(String) : [],
        attachment_sizes: Array.isArray(doc.attachment_sizes) ? doc.attachment_sizes.map(String) : [],
        likes_count: Number(doc.likes_count) || 0,
        comments_count: Number(doc.comments_count) || 0,
        tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
        is_locked: Boolean(doc.is_locked),
        is_flagged: Boolean(doc.is_flagged),
        flag_count: Number(doc.flag_count) || 0,
        status: (doc.status as 'active' | 'hidden' | 'archived') || 'active',
      }
    })

    // Save to Redis cache
    await setCache(cacheKey, sanitizedPosts, FEED_CACHE_TTL)

    return { success: true, posts: sanitizedPosts, fromCache: false }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load community feed.'
    console.error('[Appwrite Feed Error]:', err)
    return { success: false, posts: [], fromCache: false, error: message }
  }
}

/* ─── 2. Create Community Post (Direct Appwrite Write + Cache Invalidation) ─── */
export async function createCommunityPostAction(payload: {
  content: string
  userEmail: string
  userName: string
  userAvatar?: string
  userYearSection?: string
  isAnonymous: boolean
  tags?: string[]
  attachments?: string[]
  attachmentNames?: string[]
  attachmentTypes?: string[]
  attachmentSizes?: string[]
}): Promise<{ success: boolean; post?: CommunityPostItem; error?: string }> {
  try {
    if (!payload.content || payload.content.trim().length === 0) {
      return { success: false, error: 'Post content cannot be empty.' }
    }

    if (!payload.userEmail) {
      return { success: false, error: 'Institutional authentication required.' }
    }

    const { databases } = createServerAppwriteClient()
    const officerCheck = await resolveOfficerStatus(payload.userEmail, payload.userName)
    const isOfficer = officerCheck.isOfficer && !payload.isAnonymous
    const officerTitle = isOfficer ? officerCheck.title : ''

    const newDoc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      ID.unique(),
      {
        content: payload.content.trim(),
        author_student_no: payload.userEmail.trim(), // Audit accountability
        author_display_name: payload.isAnonymous ? 'Anonymous Kasubay' : payload.userName,
        author_avatar: payload.isAnonymous ? '' : (payload.userAvatar || ''),
        author_year_section: payload.userYearSection || 'BSIT',
        is_anonymous: Boolean(payload.isAnonymous),
        is_verified: false, // Regular students have NO badge
        is_officer: isOfficer,
        officer_title: officerTitle,
        attachments: payload.attachments || [],
        attachment_names: payload.attachmentNames || [],
        attachment_types: payload.attachmentTypes || [],
        attachment_sizes: payload.attachmentSizes || [],
        likes_count: 0,
        comments_count: 0,
        tags: payload.tags || ['Discussions'],
        is_locked: false,
        is_flagged: false,
        flag_count: 0,
        status: 'active',
      }
    )

    // Invalidate Redis feed cache so edge servers drop stale cache
    await deleteCache(FEED_CACHE_KEY)

    const postItem: CommunityPostItem = {
      $id: newDoc.$id,
      $createdAt: newDoc.$createdAt,
      content: newDoc.content,
      author_student_no: undefined, // Never leak student email or ID in public client post item
      author_display_name: newDoc.author_display_name,
      author_avatar: newDoc.author_avatar,
      author_year_section: newDoc.author_year_section,
      is_anonymous: Boolean(newDoc.is_anonymous),
      is_verified: false,
      is_officer: Boolean(newDoc.is_officer),
      officer_title: newDoc.officer_title || undefined,
      attachments: newDoc.attachments,
      attachment_names: newDoc.attachment_names,
      attachment_types: newDoc.attachment_types,
      attachment_sizes: newDoc.attachment_sizes,
      likes_count: 0,
      comments_count: 0,
      tags: newDoc.tags,
      is_locked: false,
      is_flagged: false,
      flag_count: 0,
      status: 'active',
    }

    return { success: true, post: postItem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create post.'
    console.error('[Create Post Error]:', err)
    return { success: false, error: message }
  }
}

/* ─── 3. Moderator Content Takedown & Realtime Purge ─── */
export async function moderatorTakedownPostAction(params: {
  postId: string
  reason: string
  adminToken?: string
  moderatorEmail: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { postId, reason, adminToken, moderatorEmail } = params

    if (!postId) return { success: false, error: 'Post ID is required.' }

    // Validate admin privileges
    let isAuthorized = false
    if (adminToken) {
      const session = await validateSessionAction(adminToken)
      if (session.valid && (session.user?.role === 'admin' || session.user?.role === 'officer')) {
        isAuthorized = true
      }
    }

    if (!isAuthorized && moderatorEmail) {
      if (
        moderatorEmail.toLowerCase() === SUPER_ADMIN_EMAIL ||
        moderatorEmail.toLowerCase().includes('admin')
      ) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return { success: false, error: 'Unauthorized: Only officers and admins can take down posts.' }
    }

    const { databases } = createServerAppwriteClient()

    // 1. Mark status as 'hidden' in Appwrite (triggers Realtime UPDATE event to all browsers)
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      postId,
      {
        status: 'hidden',
        is_flagged: true,
      }
    )

    // 2. Log incident into moderation reports collection
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTIONS.REPORTS,
        ID.unique(),
        {
          target_type: 'post',
          target_id: postId,
          reporter_student_no: moderatorEmail || 'admin',
          reason: reason || 'Takedown by moderator / Violates Code of Conduct',
          status: 'resolved',
        }
      )
    } catch (e) {
      console.warn('[Report logging warning]:', e)
    }

    // 3. Immediately invalidate Redis Cache so edge servers drop the post
    await deleteCache(FEED_CACHE_KEY)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to take down post.'
    console.error('[Takedown Error]:', err)
    return { success: false, error: message }
  }
}

/* ─── 4. Toggle Post Reaction ─── */
export async function togglePostReactionAction(params: {
  postId: string
  userEmail: string
  reactionType?: string
}): Promise<{ success: boolean; newLikesCount?: number; liked?: boolean; error?: string }> {
  try {
    const { postId, userEmail, reactionType = 'like' } = params
    if (!postId || !userEmail) return { success: false, error: 'Missing parameters.' }

    const { databases } = createServerAppwriteClient()

    // Check if existing reaction exists
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.REACTIONS,
      [Query.equal('post_id', postId), Query.equal('student_no', userEmail)]
    )

    const postDoc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      postId
    )

    let currentLikes = (postDoc.likes_count as number) || 0
    let liked = false

    if (existing.total > 0) {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTIONS.REACTIONS,
        existing.documents[0].$id
      )
      currentLikes = Math.max(0, currentLikes - 1)
      liked = false
    } else {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTIONS.REACTIONS,
        ID.unique(),
        {
          post_id: postId,
          student_no: userEmail,
          reaction_type: reactionType,
        }
      )
      currentLikes += 1
      liked = true
    }

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      postId,
      { likes_count: currentLikes }
    )

    return { success: true, newLikesCount: currentLikes, liked }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle reaction.'
    console.error('[Reaction Error]:', err)
    return { success: false, error: message }
  }
}

/* ─── 5. Add Comment ─── */
export async function addCommentAction(params: {
  postId: string
  content: string
  userEmail: string
  userName: string
  userAvatar?: string
  isAnonymous?: boolean
}): Promise<{ success: boolean; comment?: CommunityCommentItem; error?: string }> {
  try {
    const { postId, content, userEmail, userName, userAvatar, isAnonymous } = params
    if (!postId || !content?.trim() || !userEmail) {
      return { success: false, error: 'Content and valid user session required.' }
    }

    const { databases } = createServerAppwriteClient()
    const officerCheck = await resolveOfficerStatus(userEmail, userName)
    const isOfficer = officerCheck.isOfficer && !isAnonymous
    const officerTitle = isOfficer ? officerCheck.title : ''

    const commentDoc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.COMMENTS,
      ID.unique(),
      {
        post_id: postId,
        content: content.trim(),
        author_student_no: userEmail, // Audit trail
        author_display_name: isAnonymous ? 'Anonymous Kasubay' : userName,
        author_avatar: isAnonymous ? '' : (userAvatar || ''),
        is_anonymous: Boolean(isAnonymous),
        is_verified: false,
        is_officer: isOfficer,
        officer_title: officerTitle,
        is_flagged: false,
        flag_count: 0,
        status: 'active',
      }
    )

    // Increment comment count on post
    try {
      const post = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.POSTS, postId)
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTIONS.POSTS,
        postId,
        { comments_count: ((post.comments_count as number) || 0) + 1 }
      )
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      comment: {
        $id: commentDoc.$id,
        $createdAt: commentDoc.$createdAt,
        content: commentDoc.content,
        author_display_name: commentDoc.author_display_name,
        author_avatar: commentDoc.author_avatar,
        is_anonymous: Boolean(commentDoc.is_anonymous),
        is_verified: false,
        is_officer: Boolean(commentDoc.is_officer),
        officer_title: commentDoc.officer_title || undefined,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add comment.'
    console.error('[Add Comment Error]:', err)
    return { success: false, error: message }
  }
}

/* ─── 6. Get Comments for a Post ─── */
export async function getCommentsForPostAction(postId: string): Promise<{
  success: boolean
  comments: CommunityCommentItem[]
  error?: string
}> {
  try {
    if (!postId) return { success: false, comments: [] }

    const { databases } = createServerAppwriteClient()
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.COMMENTS,
      [
        Query.equal('post_id', postId),
        Query.equal('status', 'active'),
        Query.orderAsc('$createdAt'),
        Query.limit(100),
      ]
    )

    const sanitized: CommunityCommentItem[] = (res.documents as unknown as AppwriteCommentRecord[]).map(c => {
      const isAnon = Boolean(c.is_anonymous)
      const isOff = Boolean(c.is_officer) && !isAnon
      return {
        $id: c.$id,
        $createdAt: c.$createdAt,
        content: String(c.content || ''),
        author_display_name: isAnon ? 'Anonymous Kasubay' : String(c.author_display_name || 'Kasubay Student'),
        author_avatar: isAnon ? '' : (c.author_avatar ? String(c.author_avatar) : ''),
        is_anonymous: isAnon,
        is_verified: false,
        is_officer: isOff,
        officer_title: isOff ? String(c.officer_title || 'Officer') : undefined,
      }
    })

    return { success: true, comments: sanitized }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch comments.'
    return { success: false, comments: [], error: message }
  }
}

/* ─── 7. Live Username Availability & Moderation Action ─── */
const RESERVED_HANDLES = new Set([
  'admin',
  'administrator',
  'mod',
  'moderator',
  'psits',
  'psits_ua',
  'psits_admin',
  'ccis',
  'ccis_dean',
  'system',
  'root',
  'support',
  'official',
  'help',
  'staff',
  'executive',
  'security',
  'anonymous',
  'kasubay',
])

const PROFANITY_WORDS = [
  'gago', 'tanga', 'puta', 'bobo', 'inutil', 'tarantado', 'puke', 'titi', 'tae',
  'ulol', 'pucha', 'pakyu', 'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy',
  'cunt', 'porn', 'sex', 'nazi', 'hitler', 'nigger', 'nigga', 'faggot',
]

export async function checkUsernameAvailabilityAction(
  rawUsername: string,
  userEmail?: string,
  fullName?: string
): Promise<{
  available: boolean
  error?: string
  cleanUsername?: string
}> {
  try {
    const clean = (rawUsername || '').trim().replace(/^@/, '').toLowerCase()

    if (!clean || clean.length < 3) {
      return { available: false, error: 'Min 3 characters' }
    }

    if (clean.length > 25) {
      return { available: false, error: 'Max 25 characters' }
    }

    if (!/^[a-z0-9_.]+$/.test(clean)) {
      return { available: false, error: 'Letters, numbers, _, . only' }
    }

    if (clean.startsWith('.') || clean.endsWith('.') || clean.startsWith('_') || clean.endsWith('_')) {
      return { available: false, error: 'Cannot start/end with dot or _' }
    }

    if (clean.includes('..') || clean.includes('__')) {
      return { available: false, error: 'No consecutive dots or _' }
    }

    // Smart PII Detection (Blocks full name, student ID, student email)
    const piiCheck = detectProhibitedHandle(clean, userEmail, fullName)
    if (piiCheck.prohibited) {
      return { available: false, error: piiCheck.reason }
    }

    if (RESERVED_HANDLES.has(clean)) {
      return { available: false, error: 'Reserved handle' }
    }

    const hasProfanity = PROFANITY_WORDS.some((w) => clean.includes(w))
    if (hasProfanity) {
      return { available: false, error: 'Inappropriate handle' }
    }

    // Check Appwrite Posts database to ensure no conflicting student is using this handle
    try {
      const { databases } = createServerAppwriteClient()
      const searchHandle = `@${clean}`
      const existing = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTIONS.POSTS,
        [
          Query.equal('author_display_name', [searchHandle, clean]),
          Query.limit(10),
        ]
      )

      if (existing.documents.length > 0) {
        const conflicting = existing.documents.find((doc) => {
          const authorEmail = (doc.author_student_no || '').toLowerCase().trim()
          const myEmail = (userEmail || '').toLowerCase().trim()
          return authorEmail && authorEmail !== myEmail
        })

        if (conflicting) {
          return { available: false, error: 'Already taken' }
        }
      }
    } catch {
      // Ignore network fallback
    }

    return { available: true, cleanUsername: `@${clean}` }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Validation failed'
    return { available: false, error: message }
  }
}
