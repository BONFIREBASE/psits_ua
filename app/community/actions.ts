'use server'

import { createServerAppwriteClient } from '@/lib/appwrite-server'
import { APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS, APPWRITE_STORAGE_BUCKET_ID, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '@/lib/appwrite'
import { getCache, setCache, deleteCache } from '@/lib/ratelimit'
import { validateSessionAction } from '@/lib/session'
import { ID, Query, Models } from 'node-appwrite'
import { supabaseAdmin } from '@/lib/supabase'
import { detectProhibitedHandle } from '@/lib/community-validation'
import { officers as staticOfficers } from '@/data/officers'

const FEED_CACHE_KEY = 'psits:community:feed:recent'
const FEED_CACHE_TTL = 45
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
  status?: 'active' | 'hidden' | 'archived'
}

export interface CommunityNotificationItem {
  $id: string
  $createdAt: string
  recipient_email: string
  recipient_handle: string
  actor_name: string
  actor_handle: string
  actor_avatar?: string
  type: 'reaction' | 'comment' | 'reply' | 'mention' | 'follow'
  post_id?: string
  comment_id?: string
  summary: string
  is_read: boolean
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
  parent_id?: string
  reply_to_handle?: string
  is_edited?: boolean
}

export interface CommunityCommentItem {
  $id: string
  $createdAt: string
  content: string
  author_student_no?: string
  author_display_name: string
  author_avatar?: string
  is_anonymous: boolean
  is_verified: boolean
  is_officer: boolean
  officer_title?: string
  parent_id?: string
  reply_to_handle?: string
  is_edited?: boolean
  status?: string
}

function formatStudentFullName(rawName: string): string {
  if (!rawName) return ''
  const trimmed = rawName.trim()
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      const lastName = parts[0]
      const givenParts = parts.slice(1).join(' ').trim().split(/\s+/).filter(Boolean)
      if (givenParts.length > 1) {
        // Drop middle name (the trailing token in Philippine roster format: LAST, FIRST(S) MIDDLE)
        const firstNames = givenParts.slice(0, -1).join(' ')
        return `${firstNames} ${lastName}`.trim()
      }
      return `${givenParts.join(' ')} ${lastName}`.trim()
    }
  }
  return trimmed
}

function normalizeWords(str: string): string[] {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function matchStudentNameSimilarity(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false
  const tokensA = normalizeWords(nameA).filter(t => t.length >= 2)
  const tokensB = normalizeWords(nameB).filter(t => t.length >= 2)
  if (tokensA.length === 0 || tokensB.length === 0) return false
  return tokensA.some(t => tokensB.includes(t))
}

async function resolveOfficerStatus(email: string, name?: string): Promise<{ isOfficer: boolean; title: string; name?: string }> {
  const normalizedEmail = (email || '').toLowerCase().trim()
  if (normalizedEmail === SUPER_ADMIN_EMAIL || normalizedEmail.includes('admin')) {
    return { isOfficer: true, title: 'PSITS Super Admin' }
  }

  const cleanName = (name || '').trim().toLowerCase().replace(/^@/, '')

  // 1. If email is an institutional email, resolve the student's real full name from students roster
  let studentFullName = ''
  if (normalizedEmail) {
    try {
      const idMatch = normalizedEmail.match(/^(\d{4})s(\d{5})@antiquespride\.edu\.ph$/i)
      const possibleNos = idMatch
        ? [`${idMatch[1]}-S${idMatch[2]}`, `${idMatch[1]}s${idMatch[2]}`, normalizedEmail.split('@')[0]]
        : [normalizedEmail.split('@')[0]]

      const { data: sDocs } = await supabaseAdmin
        .from('students')
        .select('full_name, student_no')
        .in('student_no', possibleNos)
        .eq('is_active', true)

      const matched = sDocs?.find(s => cleanName ? matchStudentNameSimilarity(cleanName, s.full_name) : true) || sDocs?.[0]
      if (matched?.full_name && (!cleanName || matchStudentNameSimilarity(cleanName, matched.full_name))) {
        studentFullName = formatStudentFullName(matched.full_name).toLowerCase().trim()
      }
    } catch {}
  }

  // 2. Check static officers list against both name and resolved student full name
  const namesToCheck = [cleanName, studentFullName].filter(Boolean)
  for (const n of namesToCheck) {
    const staticMatch = staticOfficers.find(o => {
      const oName = o.name.toLowerCase().trim()
      return oName === n || n.includes(oName) || oName.includes(n)
    })
    if (staticMatch) {
      return { isOfficer: true, title: staticMatch.position, name: staticMatch.name }
    }
  }

  // 3. Check Supabase officers table
  try {
    let query = supabaseAdmin.from('officers').select('position, role_group, name, email')
    const orClauses: string[] = []
    if (normalizedEmail) orClauses.push(`email.eq.${normalizedEmail}`)
    if (cleanName && cleanName.length >= 3) orClauses.push(`name.ilike.%${cleanName}%`)
    if (studentFullName && studentFullName.length >= 3) orClauses.push(`name.ilike.%${studentFullName}%`)

    if (orClauses.length > 0) {
      query = query.or(orClauses.join(','))
      const { data: dbOfficers } = await query

      if (dbOfficers && dbOfficers.length > 0) {
        const exec = dbOfficers.find(o => o.role_group === 'Executive' || o.position.toLowerCase().includes('president'))
        if (exec) {
          return { isOfficer: true, title: exec.position, name: exec.name }
        }
        return { isOfficer: true, title: dbOfficers[0].position, name: dbOfficers[0].name }
      }
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
      error: 'Access restricted: Please sign in with your official university student account.',
    }
  }

  let studentMatch: { student_no: string; full_name: string; year_section: string } | null = null

  const idMatch = cleanEmail.match(/^(\d{4})s(\d{5})@antiquespride\.edu\.ph$/i)
  if (idMatch) {
    const possibleNos = [`${idMatch[1]}-S${idMatch[2]}`, `${idMatch[1]}s${idMatch[2]}`, cleanEmail.split('@')[0]]
    const { data: candidates } = await supabaseAdmin
      .from('students')
      .select('student_no, full_name, year_section')
      .in('student_no', possibleNos)
      .eq('program', 'BSIT')
      .eq('is_active', true)

    if (candidates && candidates.length > 0) {
      if (cleanGoogleName) {
        studentMatch = candidates.find(c => matchStudentNameSimilarity(cleanGoogleName, c.full_name)) || null
      } else {
        studentMatch = candidates[0]
      }
    }
  }


  if (!studentMatch) {
    const prefix = cleanEmail.split('@')[0]
    const { data: allStudents } = await supabaseAdmin
      .from('students')
      .select('student_no, full_name, full_name_normalized, year_section')
      .eq('program', 'BSIT')
      .eq('is_active', true)

    if (allStudents && allStudents.length > 0) {

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


  const officerCheck = await resolveOfficerStatus(cleanEmail, cleanGoogleName)


  if (officerCheck.isOfficer) {
    return {
      verified: true,
      isOfficer: true,
      officerTitle: officerCheck.title,
      studentNo: studentMatch?.student_no,
      name: officerCheck.name
        ? formatStudentFullName(officerCheck.name)
        : studentMatch
        ? formatStudentFullName(studentMatch.full_name)
        : cleanGoogleName || 'PSITS Executive',
      yearSection: studentMatch?.year_section || 'CCIS Faculty',
    }
  }


  if (studentMatch) {
    return {
      verified: true,
      isOfficer: false,
      studentNo: studentMatch.student_no,
      name: formatStudentFullName(studentMatch.full_name),
      yearSection: studentMatch.year_section,
    }
  }

  return {
    verified: false,
    isOfficer: false,
    name: cleanGoogleName || cleanEmail,
    yearSection: 'Unverified',
    error: 'Access restricted to College of Computing and Information Sciences (CCIS) BSIT students. Your account was not found on the official class roster.',
  }
}

export async function getCommunityFeedAction(tag?: string): Promise<{
  success: boolean
  posts: CommunityPostItem[]
  fromCache: boolean
  error?: string
}> {
  try {
    const cacheKey = tag ? `${FEED_CACHE_KEY}:${tag}` : FEED_CACHE_KEY

    const cached = await getCache<CommunityPostItem[]>(cacheKey)
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return { success: true, posts: cached, fromCache: true }
    }

    const { databases } = createServerAppwriteClient()
    const queries = [
      Query.equal('status', 'active'),
      Query.orderDesc('$createdAt'),
      Query.limit(30),
    ]

    if (tag && tag !== 'All') {
      if (tag === 'Feed') {
        try {
          queries.push(Query.or([Query.contains('tags', 'Feed'), Query.contains('tags', 'Discussions')]))
        } catch {
          queries.push(Query.contains('tags', 'Feed'))
        }
      } else {
        queries.push(Query.contains('tags', tag))
      }
    }

    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      queries
    )


    // Collect known officer handles from Supabase Auth
    const officerHandles = new Set<string>()
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      usersData?.users.forEach(u => {
        const meta = u.user_metadata || {}
        const uHandle = String(meta.community_username || '').toLowerCase().replace(/^@/, '').trim()
        const isOff = Boolean(meta.role === 'officer' || meta.role === 'admin' || (u.email && u.email.toLowerCase() === SUPER_ADMIN_EMAIL))
        if (isOff && uHandle) {
          officerHandles.add(uHandle)
        }
      })
    } catch {}

    const sanitizedPosts: CommunityPostItem[] = (res.documents as unknown as AppwritePostRecord[]).map(doc => {
      const isAnon = Boolean(doc.is_anonymous)
      const cleanAuthor = String(doc.author_display_name || '').toLowerCase().replace(/^@/, '').trim()
      const isOff = !isAnon && (Boolean(doc.is_officer) || officerHandles.has(cleanAuthor))
      const isVer = isOff || Boolean(doc.is_verified)
      const offTitle = isOff ? String(doc.officer_title || 'PSITS Officer') : undefined

      return {
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        content: String(doc.content || ''),
        author_student_no: undefined,
        author_display_name: isAnon
          ? 'Anonymous Kasubay'
          : (String(doc.author_display_name || '').startsWith('@')
            ? String(doc.author_display_name)
            : `@${String(doc.author_display_name || 'kasubay').toLowerCase().replace(/[^a-z0-9_.]/g, '')}`),
        author_avatar: isAnon ? '' : (doc.author_avatar ? String(doc.author_avatar) : ''),
        author_year_section: isAnon ? 'BSIT Student' : (doc.author_year_section ? String(doc.author_year_section) : 'BSIT'),
        is_anonymous: isAnon,
        is_verified: isVer,
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

export async function getSingleCommunityPostAction(postId: string): Promise<{
  success: boolean
  post?: CommunityPostItem
  error?: string
}> {
  try {
    if (!postId || typeof postId !== 'string') {
      return { success: false, error: 'Invalid post ID' }
    }
    const { databases } = createServerAppwriteClient()
    const doc = (await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      postId.trim()
    )) as unknown as AppwritePostRecord

    if (!doc || doc.status === 'hidden' || doc.status === 'archived') {
      return { success: false, error: 'Post is no longer available' }
    }

    const isAnon = Boolean(doc.is_anonymous)
    const isOff = Boolean(doc.is_officer) && !isAnon
    const offTitle = isOff ? String(doc.officer_title || 'Officer') : undefined

    const postItem: CommunityPostItem = {
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      content: String(doc.content || ''),
      author_student_no: undefined,
      author_display_name: isAnon
        ? 'Anonymous Kasubay'
        : (String(doc.author_display_name || '').startsWith('@')
          ? String(doc.author_display_name)
          : `@${String(doc.author_display_name || 'kasubay').toLowerCase().replace(/[^a-z0-9_.]/g, '')}`),
      author_avatar: isAnon ? '' : (doc.author_avatar ? String(doc.author_avatar) : ''),
      author_year_section: isAnon ? 'BSIT Student' : (doc.author_year_section ? String(doc.author_year_section) : 'BSIT'),
      is_anonymous: isAnon,
      is_verified: false,
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

    return { success: true, post: postItem }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Post not found' }
  }
}


/* ─── Pure Appwrite Storage Avatar Resolver ─── */
async function resolveAvatarUrl(avatar?: string): Promise<string> {
  if (!avatar) return ''
  const trimmed = avatar.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('preset:')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.slice(0, 2048)
  }
  if (trimmed.startsWith('data:image/')) {
    try {
      const match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/)
      if (match) {
        const rawExt = match[1].toLowerCase()
        const ext = rawExt.includes('webp') ? 'webp' : rawExt.includes('png') ? 'png' : 'jpg'
        const mime = `image/${ext}`
        const buffer = Buffer.from(match[2], 'base64')
        const file = new File([buffer], `avatar-${Date.now()}.${ext}`, { type: mime })
        const { storage } = createServerAppwriteClient()
        const uploaded = await storage.createFile(APPWRITE_STORAGE_BUCKET_ID, ID.unique(), file)
        const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_STORAGE_BUCKET_ID}/files/${uploaded.$id}/view?project=${APPWRITE_PROJECT_ID}`
        return fileUrl
      }
    } catch (err) {
      console.warn('[Appwrite Avatar Storage Upload Failed]:', err)
      return ''
    }
  }
  return trimmed.slice(0, 2048)
}

/* ─── Notification Dispatcher Helper (Non-Blocking) ─── */
async function createNotificationRecord(params: {
  recipientEmail?: string
  recipientHandle?: string
  actorName: string
  actorHandle: string
  actorAvatar?: string
  type: 'reaction' | 'comment' | 'reply' | 'mention' | 'follow'
  postId?: string
  commentId?: string
  summary: string
}): Promise<void> {
  try {
    const actorHandleClean = (params.actorHandle || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '')
    const recipientHandleClean = (params.recipientHandle || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '')
    const recipientEmailClean = (params.recipientEmail || '').toLowerCase().trim()

    // Do not notify self
    if (recipientHandleClean && actorHandleClean && recipientHandleClean === actorHandleClean) return

    let finalRecipientHandle = recipientHandleClean
    const finalRecipientEmail = recipientEmailClean

    // If handle is missing, look it up by email
    if (!finalRecipientHandle && finalRecipientEmail) {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('full_name')
        .eq('student_no', finalRecipientEmail)
        .maybeSingle()
      if (student) {
        finalRecipientHandle = student.full_name.toLowerCase().replace(/[^a-z0-9_.]/g, '')
      } else {
        finalRecipientHandle = finalRecipientEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '')
      }
    }

    if (!finalRecipientHandle) return

    const { databases } = createServerAppwriteClient()
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.NOTIFICATIONS,
      ID.unique(),
      {
        recipient_email: finalRecipientEmail || `${finalRecipientHandle}@antiquespride.edu.ph`,
        recipient_handle: finalRecipientHandle,
        actor_name: (params.actorName || actorHandleClean).slice(0, 100),
        actor_handle: actorHandleClean.slice(0, 100),
        actor_avatar: (params.actorAvatar || '').slice(0, 2048),
        type: params.type,
        post_id: params.postId ? String(params.postId).slice(0, 100) : '',
        comment_id: params.commentId ? String(params.commentId).slice(0, 100) : '',
        summary: params.summary.slice(0, 1000),
        is_read: false,
      }
    )
  } catch (err) {
    console.warn('[Notification Error]:', err)
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
    const [officerCheck, resolvedAvatar] = await Promise.all([
      resolveOfficerStatus(payload.userEmail, payload.userName),
      payload.isAnonymous ? Promise.resolve('') : resolveAvatarUrl(payload.userAvatar),
    ])
    const isOfficer = officerCheck.isOfficer && !payload.isAnonymous
    const officerTitle = isOfficer ? officerCheck.title : ''

    const newDoc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      ID.unique(),
      {
        content: payload.content.trim().slice(0, 5000),
        author_student_no: payload.userEmail.trim().slice(0, 255), // Audit accountability
        author_display_name: (payload.isAnonymous ? 'Anonymous Kasubay' : payload.userName).slice(0, 100),
        author_avatar: resolvedAvatar ? resolvedAvatar.slice(0, 2048) : '',
        author_year_section: (payload.userYearSection || 'BSIT').slice(0, 20),
        is_verified: isOfficer,
        is_officer: isOfficer,
        officer_title: officerTitle.slice(0, 100),
        attachments: (payload.attachments || []).map(a => String(a).slice(0, 500)),
        attachment_names: (payload.attachmentNames || []).map(a => String(a).slice(0, 255)),
        attachment_types: (payload.attachmentTypes || []).map(a => String(a).slice(0, 50)),
        attachment_sizes: (payload.attachmentSizes || []).map(a => String(a).slice(0, 50)),
        likes_count: 0,
        comments_count: 0,
        tags: (payload.tags || ['Feed']).map(t => String(t).slice(0, 50)),
        is_locked: false,
        is_flagged: false,
        flag_count: 0,
        status: 'active',
      }
    )

    // Invalidate Redis feed cache non-blockingly so client gets 0ms return
    void (async () => {
      try {
        await deleteCache(FEED_CACHE_KEY)
        for (const tag of payload.tags || []) {
          await deleteCache(`${FEED_CACHE_KEY}:${tag}`)
        }
      } catch {}
    })()

    // Dispatch mention notifications non-blockingly
    void (async () => {
      try {
        const mentions = Array.from(new Set(payload.content.match(/@([a-zA-Z0-9_.]+)/g) || [])).map(m => m.slice(1).toLowerCase())
        const snippet = payload.content.trim().slice(0, 80)
        for (const mHandle of mentions) {
          if (mHandle !== payload.userName.replace(/^@/, '').toLowerCase()) {
            await createNotificationRecord({
              recipientHandle: mHandle,
              actorName: payload.isAnonymous ? 'Anonymous Kasubay' : payload.userName,
              actorHandle: payload.isAnonymous ? 'anonymous' : payload.userName,
              actorAvatar: payload.isAnonymous ? '' : resolvedAvatar,
              type: 'mention',
              postId: newDoc.$id,
              summary: `mentioned you in a discussion: "${snippet}..."`,
            })
          }
        }
      } catch {}
    })()

    const postItem: CommunityPostItem = {
      $id: newDoc.$id,
      $createdAt: newDoc.$createdAt,
      content: newDoc.content,
      author_student_no: undefined, // Never leak student email or ID in public client post item
      author_display_name: newDoc.author_display_name,
      author_avatar: newDoc.author_avatar,
      author_year_section: newDoc.author_year_section,
      is_anonymous: Boolean(newDoc.is_anonymous),
      is_verified: isOfficer,
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

/* ─── 3.1 Delete Own Post (Author or Admin) ─── */
export async function deleteOwnCommunityPostAction(params: {
  postId: string
  userEmail: string
  adminToken?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { postId, userEmail, adminToken } = params
    if (!postId || !userEmail) return { success: false, error: 'Post ID and user email are required.' }

    const { databases } = createServerAppwriteClient()
    const doc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.POSTS, postId)
    if (!doc) return { success: false, error: 'Post not found.' }

    let isAuthorized = (doc.author_student_no || '').toLowerCase().trim() === userEmail.toLowerCase().trim()

    if (!isAuthorized && doc.author_display_name) {
      const cleanDocHandle = String(doc.author_display_name).toLowerCase().replace(/[^a-z0-9_.]/g, '')
      const cleanEmailPrefix = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '')
      if (cleanDocHandle && (cleanDocHandle === cleanEmailPrefix || userEmail.toLowerCase().includes(cleanDocHandle))) {
        isAuthorized = true
      }
    }

    if (!isAuthorized && adminToken) {
      const session = await validateSessionAction(adminToken)
      if (session.valid && (session.user?.role === 'admin' || session.user?.role === 'officer')) {
        isAuthorized = true
      }
    }

    if (!isAuthorized && (userEmail.toLowerCase() === SUPER_ADMIN_EMAIL || userEmail.toLowerCase().includes('admin'))) {
      isAuthorized = true
    }

    if (!isAuthorized) {
      return { success: false, error: 'Unauthorized: You can only delete your own posts.' }
    }

    await databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.POSTS, postId)
    await deleteCache(FEED_CACHE_KEY)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete post.'
    console.error('[Delete Post Error]:', err)
    return { success: false, error: message }
  }
}

/* ─── 3.2 Edit Own Post (Author Only) ─── */
export async function editCommunityPostAction(params: {
  postId: string
  content: string
  userEmail: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { postId, content, userEmail } = params
    if (!postId || !content?.trim() || !userEmail) {
      return { success: false, error: 'Post content and valid user session are required.' }
    }

    const { databases } = createServerAppwriteClient()
    const doc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.POSTS, postId)
    if (!doc) return { success: false, error: 'Post not found.' }

    let isAuthor = (doc.author_student_no || '').toLowerCase().trim() === userEmail.toLowerCase().trim()
    if (!isAuthor && doc.author_display_name) {
      const cleanDocHandle = String(doc.author_display_name).toLowerCase().replace(/[^a-z0-9_.]/g, '')
      const cleanEmailPrefix = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '')
      if (cleanDocHandle && (cleanDocHandle === cleanEmailPrefix || userEmail.toLowerCase().includes(cleanDocHandle))) {
        isAuthor = true
      }
    }
    if (!isAuthor) {
      return { success: false, error: 'Unauthorized: You can only edit your own posts.' }
    }

    await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.POSTS, postId, {
      content: content.trim(),
    })
    await deleteCache(FEED_CACHE_KEY)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to edit post.'
    console.error('[Edit Post Error]:', err)
    return { success: false, error: message }
  }
}

/* ─── 4. Toggle Post Reaction ─── */
export async function togglePostReactionAction(params: {
  postId: string
  userEmail: string
  reactionType?: string
  userName?: string
  userAvatar?: string
}): Promise<{ success: boolean; newLikesCount?: number; liked?: boolean; error?: string }> {
  try {
    const { postId, userEmail, reactionType = 'like', userName, userAvatar } = params
    if (!postId || !userEmail) return { success: false, error: 'Missing parameters.' }

    const { databases } = createServerAppwriteClient()

    // Check if existing reaction exists
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.REACTIONS,
      [Query.equal('post_id', postId), Query.equal('student_no', userEmail)]
    )

    let liked = false

    if (existing.total > 0) {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTIONS.REACTIONS,
        existing.documents[0].$id
      )
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
      liked = true
    }

    // Authoritative ACID document count query directly from REACTIONS collection
    const reactionsCount = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.REACTIONS,
      [Query.equal('post_id', postId), Query.limit(1)]
    )
    const authoritativeLikes = reactionsCount.total

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      postId,
      { likes_count: authoritativeLikes }
    )

    // Dispatch reaction notification non-blockingly to post author
    if (liked) {
      void (async () => {
        try {
          const postDoc = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTIONS.POSTS,
            postId
          )
          const targetAuthorEmail = String(postDoc.author_student_no || '')
          const targetAuthorHandle = String(postDoc.author_display_name || '').replace(/^@/, '')
          const actorDisplay = userName || userEmail.split('@')[0]
          const snippet = String(postDoc.content || '').trim().slice(0, 60)

          if (targetAuthorEmail !== userEmail) {
            await createNotificationRecord({
              recipientEmail: targetAuthorEmail,
              recipientHandle: targetAuthorHandle,
              actorName: actorDisplay,
              actorHandle: actorDisplay,
              actorAvatar: userAvatar || '',
              type: 'reaction',
              postId,
              summary: `reacted to your discussion: "${snippet}..."`,
            })
          }
        } catch {}
      })()
    }

    return { success: true, newLikesCount: authoritativeLikes, liked }
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
  parentId?: string
  replyToHandle?: string
}): Promise<{ success: boolean; comment?: CommunityCommentItem; error?: string }> {
  try {
    const { postId, content, userEmail, userName, userAvatar, isAnonymous, parentId, replyToHandle } = params
    if (!postId || !content?.trim() || !userEmail) {
      return { success: false, error: 'Content and valid user session required.' }
    }

    const { databases } = createServerAppwriteClient()
    const [officerCheck, resolvedCommentAvatar] = await Promise.all([
      resolveOfficerStatus(userEmail, userName),
      isAnonymous ? Promise.resolve('') : resolveAvatarUrl(userAvatar),
    ])
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
        author_avatar: resolvedCommentAvatar,
        is_anonymous: Boolean(isAnonymous),
        is_verified: isOfficer,
        is_officer: isOfficer,
        officer_title: officerTitle,
        is_flagged: false,
        flag_count: 0,
        status: 'active',
        parent_id: parentId ? String(parentId).trim() : '',
        reply_to_handle: replyToHandle ? String(replyToHandle).trim() : '',
        is_edited: false,
      }
    )

    // Authoritative active comments count update on post non-blockingly
    void (async () => {
      try {
        const commentsCount = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTIONS.COMMENTS,
          [Query.equal('post_id', postId), Query.equal('status', 'active'), Query.limit(1)]
        )
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTIONS.POSTS,
          postId,
          { comments_count: commentsCount.total }
        )
      } catch {
        // Non-blocking
      }
    })()

    // Dispatch comment, reply, and mention notifications non-blockingly
    void (async () => {
      try {
        const postDoc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTIONS.POSTS,
          postId
        )
        const targetAuthorEmail = String(postDoc.author_student_no || '')
        const targetAuthorHandle = String(postDoc.author_display_name || '').replace(/^@/, '')
        const snippet = content.trim().slice(0, 80)
        const actorDisplay = isAnonymous ? 'Anonymous Kasubay' : userName
        const actorHandle = isAnonymous ? 'anonymous' : userName
        const actorAvatar = isAnonymous ? '' : resolvedCommentAvatar

        // 1. Notify post author (if not self and not anonymous post author)
        if (targetAuthorEmail !== userEmail) {
          await createNotificationRecord({
            recipientEmail: targetAuthorEmail,
            recipientHandle: targetAuthorHandle,
            actorName: actorDisplay,
            actorHandle: actorHandle,
            actorAvatar: actorAvatar,
            type: 'comment',
            postId,
            commentId: commentDoc.$id,
            summary: `commented: "${snippet}"`,
          })
        }

        // 2. Notify replied user if replying to another comment
        if (replyToHandle) {
          const cleanReplyTarget = replyToHandle.replace(/^@/, '').toLowerCase().trim()
          const cleanMyHandle = userName.replace(/^@/, '').toLowerCase().trim()
          if (cleanReplyTarget !== cleanMyHandle && cleanReplyTarget !== targetAuthorHandle.toLowerCase().trim()) {
            await createNotificationRecord({
              recipientHandle: cleanReplyTarget,
              actorName: actorDisplay,
              actorHandle: actorHandle,
              actorAvatar: actorAvatar,
              type: 'reply',
              postId,
              commentId: commentDoc.$id,
              summary: `replied to your comment: "${snippet}"`,
            })
          }
        }

        // 3. Mentions in comment
        const mentions = Array.from(new Set(content.match(/@([a-zA-Z0-9_.]+)/g) || [])).map(m => m.slice(1).toLowerCase().trim())
        for (const mHandle of mentions) {
          if (mHandle !== userName.replace(/^@/, '').toLowerCase().trim() && mHandle !== replyToHandle?.replace(/^@/, '').toLowerCase().trim()) {
            await createNotificationRecord({
              recipientHandle: mHandle,
              actorName: actorDisplay,
              actorHandle: actorHandle,
              actorAvatar: actorAvatar,
              type: 'mention',
              postId,
              commentId: commentDoc.$id,
              summary: `mentioned you in a comment: "${snippet}"`,
            })
          }
        }
      } catch {}
    })()

    return {
      success: true,
      comment: {
        $id: commentDoc.$id,
        $createdAt: commentDoc.$createdAt,
        content: commentDoc.content,
        author_student_no: userEmail,
        author_display_name: commentDoc.author_display_name,
        author_avatar: commentDoc.author_avatar,
        is_anonymous: Boolean(commentDoc.is_anonymous),
        is_verified: isOfficer || Boolean(commentDoc.is_verified),
        is_officer: Boolean(commentDoc.is_officer),
        officer_title: commentDoc.officer_title || undefined,
        parent_id: commentDoc.parent_id || undefined,
        reply_to_handle: commentDoc.reply_to_handle || undefined,
        is_edited: Boolean(commentDoc.is_edited),
        status: 'active',
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add comment.'
    console.error('[Add Comment Error]:', err)
    return { success: false, error: message }
  }
}

/* ─── 5.1 Edit Comment ─── */
export async function editCommunityCommentAction(params: {
  commentId: string
  content: string
  userEmail: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { commentId, content, userEmail } = params
    if (!commentId || !content?.trim() || !userEmail) {
      return { success: false, error: 'Comment content and valid user session are required.' }
    }

    const { databases } = createServerAppwriteClient()
    const doc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.COMMENTS, commentId)
    if (!doc) return { success: false, error: 'Comment not found.' }

    const isAuthor = (doc.author_student_no || '').toLowerCase().trim() === userEmail.toLowerCase().trim()
    if (!isAuthor) {
      return { success: false, error: 'Unauthorized: You can only edit your own comment.' }
    }

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.COMMENTS,
      commentId,
      {
        content: content.trim(),
        is_edited: true,
      }
    )

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to edit comment.'
    console.error('[Edit Comment Error]:', err)
    return { success: false, error: message }
  }
}

/* ─── 5.2 Delete Comment (Soft Delete to preserve replies and show notice) ─── */
export async function deleteCommunityCommentAction(params: {
  commentId: string
  userEmail: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { commentId, userEmail } = params
    if (!commentId || !userEmail) {
      return { success: false, error: 'Comment ID and valid user session are required.' }
    }

    const { databases } = createServerAppwriteClient()
    const doc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.COMMENTS, commentId)
    if (!doc) return { success: false, error: 'Comment not found.' }

    const isAuthor = (doc.author_student_no || '').toLowerCase().trim() === userEmail.toLowerCase().trim()
    if (!isAuthor) {
      return { success: false, error: 'Unauthorized: You can only delete your own comment.' }
    }

    // Mark as deleted and overwrite content with placeholder to protect privacy
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.COMMENTS,
      commentId,
      {
        content: 'This comment has been deleted',
        status: 'deleted',
      }
    )

    // Authoritative comments count update on post non-blockingly
    void (async () => {
      try {
        const targetPostId = String(doc.post_id || '')
        if (targetPostId) {
          const commentsCount = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTIONS.COMMENTS,
            [Query.equal('post_id', targetPostId), Query.equal('status', 'active'), Query.limit(1)]
          )
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTIONS.POSTS,
            targetPostId,
            { comments_count: commentsCount.total }
          )
        }
      } catch {
        // Non-blocking
      }
    })()

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete comment.'
    console.error('[Delete Comment Error]:', err)
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
        Query.orderAsc('$createdAt'),
        Query.limit(100),
      ]
    )

    const sanitized: CommunityCommentItem[] = (res.documents as unknown as AppwriteCommentRecord[])
      .filter(c => c.status !== 'hidden')
      .map(c => {
        const isDeleted = c.status === 'deleted'
        const isAnon = Boolean(c.is_anonymous)
        const isOff = Boolean(c.is_officer) && !isAnon
        return {
          $id: c.$id,
          $createdAt: c.$createdAt,
          content: isDeleted ? 'This comment has been deleted' : String(c.content || ''),
          author_student_no: isDeleted ? undefined : String(c.author_student_no || ''),
          author_display_name: isDeleted
            ? ''
            : isAnon
            ? 'Anonymous Kasubay'
            : String(c.author_display_name || 'Kasubay Student'),
          author_avatar: isDeleted || isAnon ? '' : (c.author_avatar ? String(c.author_avatar) : ''),
          is_anonymous: isAnon,
          is_verified: isDeleted ? false : (isOff || Boolean(c.is_verified)),
          is_officer: isDeleted ? false : isOff,
          officer_title: isDeleted || !isOff ? undefined : String(c.officer_title || 'Officer'),
          parent_id: c.parent_id ? String(c.parent_id) : undefined,
          reply_to_handle: c.reply_to_handle ? String(c.reply_to_handle) : undefined,
          is_edited: Boolean(c.is_edited),
          status: String(c.status || 'active'),
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

/* ─── Follow System Actions ─── */
export interface FollowUserInfo {
  handle: string
  name: string
  avatar: string
  isFollowing?: boolean
  isFollowedBy?: boolean
}

export async function toggleFollowAction(params: {
  followerHandle: string
  followingHandle: string
  followerName?: string
  followerAvatar?: string
  followingName?: string
  followingAvatar?: string
}): Promise<{ success: boolean; isFollowing: boolean; error?: string }> {
  try {
    const follower = (params.followerHandle || '').toLowerCase().replace(/^@/, '').trim()
    const following = (params.followingHandle || '').toLowerCase().replace(/^@/, '').trim()

    if (!follower || !following) {
      return { success: false, isFollowing: false, error: 'Both follower and target handle required' }
    }

    if (follower === following) {
      return { success: false, isFollowing: false, error: 'Cannot follow yourself' }
    }

    const { databases } = createServerAppwriteClient()

    // Check if already following
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.FOLLOWS,
      [
        Query.equal('follower_handle', follower),
        Query.equal('following_handle', following),
        Query.limit(1),
      ]
    )

    if (existing.documents.length > 0) {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTIONS.FOLLOWS,
        existing.documents[0].$id
      )
      return { success: true, isFollowing: false }
    }

    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.FOLLOWS,
      ID.unique(),
      {
        follower_student_no: follower,
        following_student_no: following,
        follower_handle: follower,
        following_handle: following,
        follower_name: params.followerName || follower,
        follower_avatar: params.followerAvatar || '',
        following_name: params.followingName || following,
        following_avatar: params.followingAvatar || '',
      }
    )

    // Dispatch follow notification non-blockingly
    void createNotificationRecord({
      recipientHandle: following,
      actorName: params.followerName || follower,
      actorHandle: follower,
      actorAvatar: params.followerAvatar || '',
      type: 'follow',
      summary: 'started following you',
    })

    return { success: true, isFollowing: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Follow operation failed'
    return { success: false, isFollowing: false, error: message }
  }
}

export async function getFollowStatsAction(
  targetHandle: string,
  viewerHandle?: string
): Promise<{
  success: boolean
  followersCount: number
  followingCount: number
  isFollowing: boolean
  isFollowedBy: boolean
}> {
  try {
    const target = (targetHandle || '').toLowerCase().replace(/^@/, '').trim()
    const viewer = (viewerHandle || '').toLowerCase().replace(/^@/, '').trim()

    if (!target) {
      return { success: false, followersCount: 0, followingCount: 0, isFollowing: false, isFollowedBy: false }
    }

    const { databases } = createServerAppwriteClient()

    const [followersRes, followingRes] = await Promise.all([
      databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.FOLLOWS, [
        Query.equal('following_handle', target),
        Query.limit(1),
      ]),
      databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.FOLLOWS, [
        Query.equal('follower_handle', target),
        Query.limit(1),
      ]),
    ])

    let isFollowing = false
    let isFollowedBy = false

    if (viewer && viewer !== target) {
      const [checkViewerFollowsTarget, checkTargetFollowsViewer] = await Promise.all([
        databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTIONS.FOLLOWS,
          [
            Query.equal('follower_handle', viewer),
            Query.equal('following_handle', target),
            Query.limit(1),
          ]
        ),
        databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTIONS.FOLLOWS,
          [
            Query.equal('follower_handle', target),
            Query.equal('following_handle', viewer),
            Query.limit(1),
          ]
        ),
      ])

      isFollowing = checkViewerFollowsTarget.documents.length > 0
      isFollowedBy = checkTargetFollowsViewer.documents.length > 0
    }

    return {
      success: true,
      followersCount: followersRes.total || 0,
      followingCount: followingRes.total || 0,
      isFollowing,
      isFollowedBy,
    }
  } catch {
    return { success: false, followersCount: 0, followingCount: 0, isFollowing: false, isFollowedBy: false }
  }
}

export async function getFollowListAction(
  targetHandle: string,
  type: 'followers' | 'following',
  viewerHandle?: string
): Promise<{ success: boolean; users: FollowUserInfo[] }> {
  try {
    const target = (targetHandle || '').toLowerCase().replace(/^@/, '').trim()
    const viewer = (viewerHandle || '').toLowerCase().replace(/^@/, '').trim()
    if (!target) return { success: true, users: [] }

    const { databases } = createServerAppwriteClient()

    const query =
      type === 'followers'
        ? [Query.equal('following_handle', target), Query.limit(50), Query.orderDesc('$createdAt')]
        : [Query.equal('follower_handle', target), Query.limit(50), Query.orderDesc('$createdAt')]

    const res = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.FOLLOWS, query)

    // Viewer's following set for inline indicators
    let viewerFollowingSet = new Set<string>()
    let viewerFollowersSet = new Set<string>()
    if (viewer) {
      try {
        const [vFollowingRes, vFollowersRes] = await Promise.all([
          databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.FOLLOWS, [
            Query.equal('follower_handle', viewer),
            Query.limit(100),
          ]),
          databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.FOLLOWS, [
            Query.equal('following_handle', viewer),
            Query.limit(100),
          ]),
        ])
        viewerFollowingSet = new Set(vFollowingRes.documents.map(d => String(d.following_handle || '').toLowerCase()))
        viewerFollowersSet = new Set(vFollowersRes.documents.map(d => String(d.follower_handle || '').toLowerCase()))
      } catch {}
    }

    const users: FollowUserInfo[] = res.documents.map(doc => {
      const handle = String((type === 'followers' ? doc.follower_handle : doc.following_handle) || 'student').toLowerCase()
      const rawName = (type === 'followers' ? doc.follower_name : doc.following_name) as string | undefined
      const name = rawName || handle
      const avatar = String((type === 'followers' ? doc.follower_avatar : doc.following_avatar) || '')

      return {
        handle,
        name,
        avatar,
        isFollowing: viewerFollowingSet.has(handle),
        isFollowedBy: viewerFollowersSet.has(handle),
      }
    })

    return { success: true, users }
  } catch {
    return { success: true, users: [] }
  }
}

export async function getMyFollowRelationshipsAction(
  rawViewerHandle: string
): Promise<{ success: boolean; following: string[]; followers: string[] }> {
  try {
    const viewer = (rawViewerHandle || '').toLowerCase().replace(/^@/, '').trim()
    if (!viewer) return { success: true, following: [], followers: [] }

    const { databases } = createServerAppwriteClient()

    const [followingRes, followersRes] = await Promise.all([
      databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.FOLLOWS, [
        Query.equal('follower_handle', viewer),
        Query.limit(200),
      ]),
      databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.FOLLOWS, [
        Query.equal('following_handle', viewer),
        Query.limit(200),
      ]),
    ])

    const following = followingRes.documents.map(d => String(d.following_handle || '').toLowerCase()).filter(Boolean)
    const followers = followersRes.documents.map(d => String(d.follower_handle || '').toLowerCase()).filter(Boolean)

    return { success: true, following, followers }
  } catch {
    return { success: true, following: [], followers: [] }
  }
}

export async function getMutualFollowsAction(
  rawHandle: string
): Promise<{ success: boolean; mutuals: FollowUserInfo[] }> {
  try {
    const handle = (rawHandle || '').toLowerCase().replace(/^@/, '').trim()
    if (!handle) return { success: true, mutuals: [] }

    const { databases } = createServerAppwriteClient()

    // 1. Fetch people who the user follows (following)
    const followingRes = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.FOLLOWS,
      [Query.equal('follower_handle', handle), Query.limit(100)]
    )

    if (!followingRes.documents || followingRes.documents.length === 0) {
      return { success: true, mutuals: [] }
    }

    // Map of followed handles
    const followingMap = new Map<string, { handle: string; name: string }>()
    for (const doc of followingRes.documents) {
      const h = String(doc.following_handle || '').toLowerCase().trim()
      if (h) {
        followingMap.set(h, {
          handle: h,
          name: (doc.following_name as string) || (doc.following_handle as string) || h,
        })
      }
    }

    // 2. Fetch people who follow the user (followers)
    const followersRes = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.FOLLOWS,
      [Query.equal('following_handle', handle), Query.limit(100)]
    )

    // 3. Intersection: followers who are also followed back by the user (mutuals)
    const mutuals: FollowUserInfo[] = []
    const seen = new Set<string>()

    for (const doc of followersRes.documents) {
      const followerHandle = String(doc.follower_handle || '').toLowerCase().trim()
      if (followerHandle && followingMap.has(followerHandle) && !seen.has(followerHandle)) {
        seen.add(followerHandle)
        mutuals.push({
          handle: followerHandle,
          name: (doc.follower_name as string) || followerHandle,
          avatar: (doc.follower_avatar as string) || '',
        })
      }
    }

    return { success: true, mutuals }
  } catch (err: unknown) {
    console.error('[Mutuals Action Error]:', err)
    return { success: true, mutuals: [] }
  }
}


/* ─── Persistent Student Profile Lookup ─── */
export interface StudentProfileData {
  displayName: string
  handle: string
  avatar: string
  yearSection: string
  isOfficer: boolean
  isVerified: boolean
  officerTitle: string
  bio?: string
  github?: string
  linkedin?: string
  portfolio?: string
  instagram?: string
  hobbies?: string[]
}

export async function getStudentProfileByHandleAction(
  rawHandle: string
): Promise<{ success: boolean; profile?: StudentProfileData }> {
  try {
    const cleanHandle = (rawHandle || '').toLowerCase().replace(/^@/, '').trim()
    if (!cleanHandle) return { success: false }

    // 1. Search in Supabase Auth users for this handle
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const matchedUser = usersData?.users.find(u => {
      const uHandle = (u.user_metadata?.community_username || '').toLowerCase().replace(/^@/, '').trim()
      return uHandle === cleanHandle
    })

    if (matchedUser) {
      const meta = matchedUser.user_metadata || {}
      const email = (matchedUser.email || '').toLowerCase().trim()
      let name = meta.full_name || email.split('@')[0] || cleanHandle
      const avatar = meta.community_avatar || meta.avatar_url || ''
      let yearSection = meta.year_section || 'BSIT'
      const bio = (meta.bio as string) || ''
      const github = (meta.social_github || meta.github as string) || ''
      const linkedin = (meta.social_linkedin || meta.linkedin as string) || ''
      const portfolio = (meta.social_portfolio || meta.portfolio as string) || ''
      const instagram = (meta.social_instagram || meta.instagram as string) || ''
      const hobbies = (meta.hobbies as string[]) || []

      // Check officers table first for authoritative executive name
      const officerCheck = await resolveOfficerStatus(email, name)
      if (officerCheck.name) {
        name = formatStudentFullName(officerCheck.name)
      }

      // Check students table for authoritative student record
      if (email) {
        const idMatch = email.match(/^(\d{4})s(\d{5})@antiquespride\.edu\.ph$/i)
        const possibleNos = idMatch
          ? [`${idMatch[1]}-S${idMatch[2]}`, `${idMatch[1]}s${idMatch[2]}`, email.split('@')[0]]
          : [email.split('@')[0]]

        const { data: candidates } = await supabaseAdmin
          .from('students')
          .select('student_no, full_name, year_section')
          .in('student_no', possibleNos)
          .eq('is_active', true)

        let matchingStudent = candidates?.find(c => matchStudentNameSimilarity(name, c.full_name))

        // If no candidate matched by student_no and name similarity, try searching all students by name
        if (!matchingStudent && name && name.trim().split(/\s+/).length >= 2) {
          const { data: nameCandidates } = await supabaseAdmin
            .from('students')
            .select('student_no, full_name, year_section')
            .eq('is_active', true)
            .limit(1000)

          matchingStudent = nameCandidates?.find(c => matchStudentNameSimilarity(name, c.full_name))
        }

        if (matchingStudent) {
          if (matchingStudent.full_name) {
            name = formatStudentFullName(matchingStudent.full_name)
          }
          if (matchingStudent.year_section) {
            yearSection = matchingStudent.year_section
          }
        }
      }

      const isOfficer = Boolean(officerCheck.isOfficer || meta.role === 'officer' || meta.role === 'admin')
      const isVerified = Boolean(isOfficer || meta.is_verified || meta.community_tos_accepted)

      return {
        success: true,
        profile: {
          displayName: name,
          handle: `@${cleanHandle}`,
          avatar,
          yearSection,
          isOfficer,
          isVerified,
          officerTitle: officerCheck.title || (isOfficer ? 'PSITS Officer' : ''),
          bio,
          github,
          linkedin,
          portfolio,
          instagram,
          hobbies,
        },
      }
    }

    // 2. Direct fallback to students database table
    const { data: directStudent } = await supabaseAdmin
      .from('students')
      .select('student_no, full_name, year_section')
      .ilike('student_no', `%${cleanHandle}%`)
      .eq('is_active', true)
      .maybeSingle()

    if (directStudent) {
      const formattedName = formatStudentFullName(directStudent.full_name)
      const officerCheck = await resolveOfficerStatus('', formattedName)

      return {
        success: true,
        profile: {
          displayName: formattedName,
          handle: `@${cleanHandle}`,
          avatar: '',
          yearSection: directStudent.year_section || 'BSIT',
          isOfficer: officerCheck.isOfficer,
          isVerified: true,
          officerTitle: officerCheck.title || (officerCheck.isOfficer ? 'PSITS Officer' : ''),
        },
      }
    }

    // 3. Fallback to Appwrite posts collection history
    const { databases } = createServerAppwriteClient()
    const searchHandles = [`@${cleanHandle}`, cleanHandle]
    const postRes = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.POSTS,
      [Query.equal('author_display_name', searchHandles), Query.limit(1)]
    )

    if (postRes.documents.length > 0) {
      const doc = postRes.documents[0]
      const isOfficer = Boolean(doc.is_officer)
      return {
        success: true,
        profile: {
          displayName: doc.author_display_name.startsWith('@') ? doc.author_display_name.slice(1) : doc.author_display_name,
          handle: `@${cleanHandle}`,
          avatar: (doc.author_avatar as string) || '',
          yearSection: (doc.author_year_section as string) || 'BSIT',
          isOfficer,
          isVerified: Boolean(isOfficer || doc.is_verified),
          officerTitle: (doc.officer_title as string) || (isOfficer ? 'PSITS Officer' : ''),
        },
      }
    }

    return { success: false }
  } catch (err) {
    console.error('getStudentProfileByHandleAction error:', err)
    return { success: false }
  }
}

/* ─── 13. Threads System (Public & Private Threads with Quotas) ─── */
export interface CommunityThreadItem {
  $id: string
  $createdAt: string
  title: string
  slug: string
  description: string
  category: string
  creator_student_no: string
  creator_display_name: string
  creator_avatar?: string
  is_private: boolean
  allowed_users: string[]
  pending_requests: string[]
  is_verified_creator: boolean
  status: string
}

export async function createCommunityThreadAction(params: {
  title: string
  description?: string
  category?: string
  userEmail: string
  userName: string
  userAvatar?: string
  isPrivate?: boolean
  allowedUsers?: string[]
  isVerified?: boolean
}): Promise<{ success: boolean; thread?: CommunityThreadItem; error?: string }> {
  try {
    const {
      title,
      description = '',
      category = 'Feed',
      userEmail,
      userName,
      userAvatar,
      isPrivate = false,
      allowedUsers = [],
      isVerified = false,
    } = params

    if (!title || !title.trim() || !userEmail) {
      return { success: false, error: 'Thread title and valid student session required.' }
    }

    const { databases } = createServerAppwriteClient()

    // 1. Quota Enforcement: Check if user is verified/officer/admin
    const officerCheck = await resolveOfficerStatus(userEmail, userName)
    const isOfficerOrAdmin = officerCheck.isOfficer || userEmail.toLowerCase() === SUPER_ADMIN_EMAIL
    const hasUnlimited = isOfficerOrAdmin || Boolean(isVerified)

    if (!hasUnlimited) {
      // Normal users can only create 1 custom thread
      const existing = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTIONS.THREADS,
        [
          Query.equal('creator_student_no', userEmail),
          Query.equal('status', 'active'),
          Query.limit(5),
        ]
      )
      if (existing.total >= 1) {
        return {
          success: false,
          error: 'Standard accounts can only create 1 custom thread. Complete institutional verification to create unlimited threads!',
        }
      }
    }

    const cleanTitle = title.trim().slice(0, 100)
    // Create clean slug
    const cleanSlug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `thread-${Date.now()}`

    // Check for duplicate active slug
    const duplicateCheck = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      [Query.equal('slug', cleanSlug), Query.equal('status', 'active'), Query.limit(1)]
    )
    const finalSlug = duplicateCheck.total > 0 ? `${cleanSlug}-${Math.floor(1000 + Math.random() * 9000)}` : cleanSlug

    // Sanitize allowed_users: ensure creator is in allowed list if private
    const sanitizedAllowed = Array.from(
      new Set(
        allowedUsers
          .map(u => u.trim().toLowerCase().replace(/^@/, ''))
          .filter(Boolean)
          .concat([userEmail.toLowerCase(), userName.toLowerCase().replace(/^@/, '')])
      )
    )

    const resolvedAvatar = await resolveAvatarUrl(userAvatar)

    const threadDoc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      ID.unique(),
      {
        title: cleanTitle.slice(0, 100),
        slug: finalSlug.slice(0, 100),
        description: description.trim().slice(0, 1000),
        category: category.trim().slice(0, 50) || 'Feed',
        creator_student_no: userEmail.slice(0, 100),
        creator_display_name: (userName.startsWith('@') ? userName : `@${userName}`).slice(0, 100),
        creator_avatar: resolvedAvatar ? resolvedAvatar.slice(0, 500) : '',
        is_private: Boolean(isPrivate),
        allowed_users: sanitizedAllowed.map(u => String(u).slice(0, 100)),
        pending_requests: [],
        is_verified_creator: hasUnlimited,
        status: 'active',
      }
    )

    const threadItem: CommunityThreadItem = {
      $id: threadDoc.$id,
      $createdAt: threadDoc.$createdAt,
      title: threadDoc.title,
      slug: threadDoc.slug,
      description: threadDoc.description || '',
      category: threadDoc.category || 'Feed',
      creator_student_no: threadDoc.creator_student_no,
      creator_display_name: threadDoc.creator_display_name,
      creator_avatar: threadDoc.creator_avatar || undefined,
      is_private: Boolean(threadDoc.is_private),
      allowed_users: Array.isArray(threadDoc.allowed_users) ? threadDoc.allowed_users : [],
      pending_requests: Array.isArray(threadDoc.pending_requests) ? threadDoc.pending_requests : [],
      is_verified_creator: Boolean(threadDoc.is_verified_creator),
      status: threadDoc.status || 'active',
    }

    return { success: true, thread: threadItem }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create thread.'
    console.error('[Create Thread Error]:', err)
    return { success: false, error: msg }
  }
}

export async function getAvailableThreadsAction(_params?: {
  userEmail?: string
  userHandle?: string
}): Promise<{ success: boolean; threads: CommunityThreadItem[]; error?: string }> {
  void _params
  try {
    const { databases } = createServerAppwriteClient()
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      [Query.equal('status', 'active'), Query.orderDesc('$createdAt'), Query.limit(100)]
    )

    // Return all active threads so students can see existing channels and request to join private ones
    const threads: CommunityThreadItem[] = (res.documents as unknown as Array<Record<string, unknown>>).map(doc => ({
      $id: String(doc.$id),
      $createdAt: String(doc.$createdAt),
      title: String(doc.title || ''),
      slug: String(doc.slug || ''),
      description: String(doc.description || ''),
      category: String(doc.category || 'Feed'),
      creator_student_no: String(doc.creator_student_no || ''),
      creator_display_name: String(doc.creator_display_name || ''),
      creator_avatar: doc.creator_avatar ? String(doc.creator_avatar) : undefined,
      is_private: Boolean(doc.is_private),
      allowed_users: Array.isArray(doc.allowed_users) ? (doc.allowed_users as string[]).map(String) : [],
      pending_requests: Array.isArray(doc.pending_requests) ? (doc.pending_requests as string[]).map(String) : [],
      is_verified_creator: Boolean(doc.is_verified_creator),
      status: String(doc.status || 'active'),
    }))

    return { success: true, threads }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch threads.'
    console.error('[Get Threads Error]:', err)
    return { success: false, threads: [], error: msg }
  }
}

export async function requestToJoinThreadAction(params: {
  threadId: string
  userEmail: string
  userHandle?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { threadId, userEmail, userHandle } = params
    if (!threadId || !userEmail) {
      return { success: false, error: 'Thread ID and student email required.' }
    }

    const { databases } = createServerAppwriteClient()
    const thread = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      threadId
    )

    if (!thread || thread.status !== 'active') {
      return { success: false, error: 'Thread not found or no longer active.' }
    }

    const cleanEmail = userEmail.toLowerCase().trim()
    const cleanHandle = (userHandle || '').trim().replace(/^@/, '')
    const currentAllowed: string[] = Array.isArray(thread.allowed_users) ? thread.allowed_users : []
    const currentPending: string[] = Array.isArray(thread.pending_requests) ? thread.pending_requests : []

    // Check if already allowed
    const isAlreadyAllowed = currentAllowed.some(u => {
      const c = u.toLowerCase().replace(/^@/, '')
      return c === cleanEmail || (cleanHandle && c === cleanHandle.toLowerCase())
    })
    if (isAlreadyAllowed) {
      return { success: false, error: 'You are already a member of this thread.' }
    }

    // Check if already pending
    const isAlreadyPending = currentPending.some(p => {
      const lower = p.toLowerCase()
      return lower.includes(cleanEmail) || (cleanHandle && lower.includes(cleanHandle.toLowerCase()))
    })
    if (isAlreadyPending) {
      return { success: true }
    }

    const requesterEntry = cleanHandle ? `@${cleanHandle}::${cleanEmail}` : cleanEmail
    const updatedPending = [...currentPending, requesterEntry]

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      threadId,
      {
        pending_requests: updatedPending,
      }
    )

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to request joining thread.'
    console.error('[Request Join Thread Error]:', err)
    return { success: false, error: msg }
  }
}

export async function respondToThreadJoinRequestAction(params: {
  threadId: string
  requesterStr: string
  action: 'approve' | 'decline'
  hostEmail: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { threadId, requesterStr, action, hostEmail } = params
    if (!threadId || !requesterStr || !hostEmail) {
      return { success: false, error: 'Missing required parameters.' }
    }

    const { databases } = createServerAppwriteClient()
    const thread = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      threadId
    )

    const cleanHostEmail = hostEmail.toLowerCase().trim()
    const threadCreator = (thread.creator_student_no || '').toLowerCase().trim()
    const isHost = threadCreator === cleanHostEmail || cleanHostEmail === SUPER_ADMIN_EMAIL

    if (!isHost) {
      return { success: false, error: 'Only the thread host can approve or decline join requests.' }
    }

    const currentPending: string[] = Array.isArray(thread.pending_requests) ? thread.pending_requests : []
    const updatedPending = currentPending.filter(p => p !== requesterStr)

    const updatePayload: Record<string, unknown> = {
      pending_requests: updatedPending,
    }

    if (action === 'approve') {
      const currentAllowed: string[] = Array.isArray(thread.allowed_users) ? thread.allowed_users : []
      const parts = requesterStr.split('::')
      const handle = parts[0]?.trim()
      const email = parts[1]?.trim()
      const toAdd = [handle, email].filter(Boolean) as string[]

      const newAllowed = Array.from(new Set([...currentAllowed, ...toAdd]))
      updatePayload.allowed_users = newAllowed
    }

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      threadId,
      updatePayload
    )

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to respond to join request.'
    console.error('[Respond Join Thread Error]:', err)
    return { success: false, error: msg }
  }
}

export async function joinPublicThreadAction(params: {
  threadId: string
  userEmail: string
  userHandle?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { threadId, userEmail, userHandle } = params
    if (!threadId || !userEmail) {
      return { success: false, error: 'Thread ID and user session required.' }
    }

    const { databases } = createServerAppwriteClient()
    const thread = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      threadId
    )

    if (thread.is_private) {
      return { success: false, error: 'Cannot directly join a private thread. Please request to join.' }
    }

    const cleanEmail = userEmail.toLowerCase().trim()
    const cleanHandle = (userHandle || '').trim().replace(/^@/, '')
    const currentAllowed: string[] = Array.isArray(thread.allowed_users) ? thread.allowed_users : []

    const toAdd = [cleanEmail, cleanHandle ? `@${cleanHandle}` : null].filter(Boolean) as string[]
    const updatedAllowed = Array.from(new Set([...currentAllowed, ...toAdd]))

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      threadId,
      {
        allowed_users: updatedAllowed,
      }
    )

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to join thread.'
    console.error('[Join Public Thread Error]:', err)
    return { success: false, error: msg }
  }
}

export async function getUserThreadQuotaAction(params: {
  userEmail: string
  userName?: string
  isVerified?: boolean
}): Promise<{
  success: boolean
  canCreate: boolean
  usedCount: number
  maxLimit: number | 'unlimited'
  isVerified: boolean
}> {
  try {
    const { userEmail, userName, isVerified } = params
    if (!userEmail) {
      return { success: false, canCreate: false, usedCount: 0, maxLimit: 1, isVerified: false }
    }

    const officerCheck = await resolveOfficerStatus(userEmail, userName)
    const isOfficerOrAdmin = officerCheck.isOfficer || userEmail.toLowerCase() === SUPER_ADMIN_EMAIL
    const hasUnlimited = isOfficerOrAdmin || Boolean(isVerified)

    if (hasUnlimited) {
      return {
        success: true,
        canCreate: true,
        usedCount: 0,
        maxLimit: 'unlimited',
        isVerified: true,
      }
    }

    const { databases } = createServerAppwriteClient()
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      [
        Query.equal('creator_student_no', userEmail),
        Query.equal('status', 'active'),
        Query.limit(5),
      ]
    )

    const usedCount = res.total
    return {
      success: true,
      canCreate: usedCount < 1,
      usedCount,
      maxLimit: 1,
      isVerified: false,
    }
  } catch (err) {
    console.error('[Quota Check Error]:', err)
    return { success: false, canCreate: true, usedCount: 0, maxLimit: 1, isVerified: false }
  }
}

/* ─── 14. Notifications Hub Actions (Realtime Mobile & Desktop) ─── */
export async function getMyNotificationsAction(params: {
  userHandle: string
  userEmail?: string
  limit?: number
}): Promise<{
  success: boolean
  notifications?: CommunityNotificationItem[]
  unreadCount?: number
  error?: string
}> {
  try {
    const cleanHandle = (params.userHandle || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '')
    if (!cleanHandle) return { success: true, notifications: [], unreadCount: 0 }

    const { databases } = createServerAppwriteClient()
    const limitCount = params.limit || 30

    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.NOTIFICATIONS,
      [
        Query.equal('recipient_handle', cleanHandle),
        Query.orderDesc('$createdAt'),
        Query.limit(limitCount),
      ]
    )

    interface AppwriteNotificationDoc extends Models.Document {
      recipient_email?: string
      recipient_handle?: string
      actor_name?: string
      actor_handle?: string
      actor_avatar?: string
      type?: string
      post_id?: string
      comment_id?: string
      summary?: string
      is_read?: boolean
    }

    const notifications: CommunityNotificationItem[] = (res.documents as unknown as AppwriteNotificationDoc[]).map(d => ({
      $id: d.$id,
      $createdAt: d.$createdAt,
      recipient_email: d.recipient_email || '',
      recipient_handle: d.recipient_handle || '',
      actor_name: d.actor_name || 'Kasubay',
      actor_handle: d.actor_handle || 'kasubay',
      actor_avatar: d.actor_avatar || '',
      type: (d.type as CommunityNotificationItem['type']) || 'mention',
      post_id: d.post_id || undefined,
      comment_id: d.comment_id || undefined,
      summary: d.summary || '',
      is_read: Boolean(d.is_read),
    }))

    const unreadCount = notifications.filter(n => !n.is_read).length
    return { success: true, notifications, unreadCount }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get notifications'
    console.warn('[Get Notifications Error]:', err)
    return { success: false, notifications: [], unreadCount: 0, error: message }
  }
}

export async function markNotificationAsReadAction(notificationId: string): Promise<{ success: boolean }> {
  try {
    if (!notificationId) return { success: false }
    const { databases } = createServerAppwriteClient()
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.NOTIFICATIONS,
      notificationId,
      { is_read: true }
    )
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function markAllNotificationsAsReadAction(userHandle: string): Promise<{ success: boolean }> {
  try {
    const cleanHandle = (userHandle || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '')
    if (!cleanHandle) return { success: false }
    const { databases } = createServerAppwriteClient()

    const unread = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.NOTIFICATIONS,
      [
        Query.equal('recipient_handle', cleanHandle),
        Query.equal('is_read', false),
        Query.limit(50),
      ]
    )

    await Promise.all(
      unread.documents.map(d =>
        databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTIONS.NOTIFICATIONS,
          d.$id,
          { is_read: true }
        )
      )
    )
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function deleteCommunityThreadAction(params: {
  threadId: string
  userEmail: string
  userHandle?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { threadId, userEmail, userHandle } = params
    if (!threadId || !userEmail) {
      return { success: false, error: 'Thread ID and user email are required.' }
    }

    const { databases } = createServerAppwriteClient()
    const thread = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      threadId
    )

    if (!thread) {
      return { success: false, error: 'Thread not found.' }
    }

    const cleanEmail = userEmail.toLowerCase().trim()
    const cleanHandle = (userHandle || '').trim().toLowerCase().replace(/^@/, '')
    const threadCreator = String(thread.creator_student_no || '').toLowerCase().trim()
    const threadCreatorDisplay = String(thread.creator_display_name || '').toLowerCase().trim().replace(/^@/, '')
    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL

    const isHost =
      threadCreator === cleanEmail ||
      (cleanHandle && (threadCreatorDisplay === cleanHandle || threadCreator === cleanHandle)) ||
      isSuperAdmin

    if (!isHost) {
      return { success: false, error: 'Unauthorized: Only the thread creator can delete this thread.' }
    }

    // Mark as deleted in Appwrite
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.THREADS,
      threadId,
      { status: 'deleted' }
    )

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete thread.'
    console.error('[Delete Thread Error]:', err)
    return { success: false, error: msg }
  }
}


