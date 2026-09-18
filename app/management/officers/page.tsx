'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  X,
  Save,
  Plus,
  Award,
  ShieldCheck,
  BookOpen,
  Users as UsersIcon,
  Palette,
  Trash2,
  Edit2,
  AlertTriangle,
} from 'lucide-react'
import {
  officers as initialOfficers,
  pubmatTeam as initialPubmat,
  type Officer,
} from '@/data/officers'
import FormField, { inputStyles } from '../_components/FormField'
import FileUpload from '../_components/FileUpload'
import Select from '../_components/Select'
import { useToast } from '../_components/Toast'
import { getOfficers, supabase } from '@/lib/supabase'
import {
  createOfficerAction,
  updateOfficerAction,
  deleteOfficerAction,
} from './actions'
import { useAuth } from '../_context/auth-context'

/* ─── Types & Constants ─── */

type RoleGroup = Officer['roleGroup']
type TabKey = RoleGroup | 'All' | 'Pubmat'

const officerTabs: { key: TabKey; label: string; icon: typeof Award }[] = [
  { key: 'All', label: 'All', icon: UsersIcon },
  { key: 'Executive', label: 'Executive', icon: Award },
  { key: 'Secretariat & Finance', label: 'Secretariat & Finance', icon: ShieldCheck },
  { key: 'Operations & PR', label: 'Operations & PR', icon: BookOpen },
  { key: 'Year Representatives', label: 'Year Reps', icon: UsersIcon },
  { key: 'Pubmat', label: 'Pubmat Team', icon: Palette },
]

const roleGroupOptions: { value: RoleGroup; label: string }[] = [
  { value: 'Executive', label: 'Executive' },
  { value: 'Secretariat & Finance', label: 'Secretariat & Finance' },
  { value: 'Operations & PR', label: 'Operations & PR' },
  { value: 'Year Representatives', label: 'Year Representatives' },
]

interface OfficerWithMeta extends Officer {
  id?: string
  email?: string
  isPubmat?: boolean
  pubmatRole?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((w) => !['Jr.', 'II', 'III', 'IV'].includes(w))
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function OfficersManagementPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const canManage = !user || user.role === 'admin' || user.role === 'officer'

  const [officersList, setOfficersList] = useState<OfficerWithMeta[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('All')
  const [search, setSearch] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [savingAdd, setSavingAdd] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const loadOfficers = useCallback(async () => {
    try {
      const dbOfficers = await getOfficers()
      if (dbOfficers && dbOfficers.length > 0) {
        const mapped: OfficerWithMeta[] = dbOfficers.map((o) => ({
          id: o.id,
          name: o.name,
          position: o.position,
          roleGroup: (o.role_group as RoleGroup) || 'Operations & PR',
          department: o.year_section,
          email: o.email || undefined,
          image: o.image_url || undefined,
          isPubmat: o.is_pubmat,
          pubmatRole: o.pubmat_role || undefined,
        }))
        setOfficersList(mapped)
      } else {
        // Fallback to static seeds
        const staticList: OfficerWithMeta[] = [
          ...initialOfficers.map((o) => ({ ...o, isPubmat: false })),
          ...initialPubmat.map((p) => ({
            name: p.name,
            position: p.role,
            roleGroup: 'Operations & PR' as RoleGroup,
            department: 'Pubmat Creative Team',
            image: p.image || undefined,
            isPubmat: true,
            pubmatRole: p.role,
          })),
        ]
        setOfficersList(staticList)
      }
    } catch {
      toast('Failed to load officers directory')
    }
  }, [toast])

  useEffect(() => {
    loadOfficers()

    const channel = supabase
      .channel('officers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'officers' },
        () => {
          loadOfficers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadOfficers])

  // Form states
  const [form, setForm] = useState({
    name: '',
    position: '',
    roleGroup: 'Executive' as RoleGroup,
    department: 'BSIT · CCIS',
    email: '',
    isPubmat: false,
    pubmatRole: '',
  })
  const [formImage, setFormImage] = useState<File | null>(null)
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null)

  const filtered = officersList.filter((o) => {
    let matchesTab = false
    if (activeTab === 'All') matchesTab = true
    else if (activeTab === 'Pubmat') matchesTab = !!o.isPubmat
    else matchesTab = !o.isPubmat && o.roleGroup === activeTab

    const matchesSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.position.toLowerCase().includes(search.toLowerCase()) ||
      (o.pubmatRole && o.pubmatRole.toLowerCase().includes(search.toLowerCase())) ||
      (o.email && o.email.toLowerCase().includes(search.toLowerCase()))

    return matchesTab && matchesSearch
  })

  function startEdit(index: number) {
    const officer = officersList[index]
    setForm({
      name: officer.name,
      position: officer.position,
      roleGroup: officer.roleGroup || 'Executive',
      department: officer.department,
      email: officer.email || '',
      isPubmat: !!officer.isPubmat,
      pubmatRole: officer.pubmatRole || '',
    })
    setFormImage(null)
    setFormImagePreview(officer.image || null)
    setEditingIndex(index)
    setShowAdd(false)
    setConfirmDeleteId(null)
  }

  function cancelEdit() {
    setEditingIndex(null)
    setForm({
      name: '',
      position: '',
      roleGroup: 'Executive',
      department: 'BSIT · CCIS',
      email: '',
      isPubmat: false,
      pubmatRole: '',
    })
    setFormImage(null)
    setFormImagePreview(null)
  }

  async function saveEdit() {
    if (editingIndex === null) return
    const target = officersList[editingIndex]

    if (!form.name || !form.position) {
      toast('Name and position are required.')
      return
    }

    if (form.email && !form.email.endsWith('@antiquespride.edu.ph')) {
      toast('Email must end with @antiquespride.edu.ph')
      return
    }

    setSavingEdit(true)
    try {
      if (target.id) {
        const formData = new FormData()
        formData.append('name', form.name)
        formData.append('position', form.position)
        formData.append('roleGroup', form.roleGroup)
        formData.append('yearSection', form.department || 'BSIT · CCIS')
        formData.append('email', form.email)
        formData.append('isPubmat', form.isPubmat ? 'true' : 'false')
        formData.append('pubmatRole', form.pubmatRole || '')
        if (target.image) {
          formData.append('existingImageUrl', target.image)
        }
        if (formImage) {
          formData.append('photo', formImage)
        }

        const res = await updateOfficerAction(target.id, formData)
        if (!res.success) {
          toast(res.error || 'Failed to update officer')
          return
        }
      }

      await loadOfficers()
      cancelEdit()
      toast('Officer profile updated successfully!')
    } catch {
      toast('Error saving officer changes')
    } finally {
      setSavingEdit(false)
    }
  }

  function startAdd() {
    setShowAdd(true)
    setEditingIndex(null)
    setConfirmDeleteId(null)
    const isAddingPubmat = activeTab === 'Pubmat'
    setForm({
      name: '',
      position: isAddingPubmat ? 'Graphic Designer' : '',
      roleGroup: isAddingPubmat ? 'Operations & PR' : activeTab !== 'All' ? activeTab : 'Executive',
      department: isAddingPubmat ? 'Pubmat Creative Team' : 'BSIT · CCIS',
      email: '',
      isPubmat: isAddingPubmat,
      pubmatRole: isAddingPubmat ? 'Graphic Designer' : '',
    })
    setFormImage(null)
    setFormImagePreview(null)
  }

  async function saveAdd() {
    if (!form.name || !form.position) {
      toast('Name and position are required.')
      return
    }
    if (form.email && !form.email.endsWith('@antiquespride.edu.ph')) {
      toast('Email must end with @antiquespride.edu.ph')
      return
    }

    setSavingAdd(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('position', form.position)
      formData.append('roleGroup', form.roleGroup)
      formData.append('yearSection', form.department || 'BSIT · CCIS')
      formData.append('email', form.email)
      formData.append('isPubmat', form.isPubmat ? 'true' : 'false')
      formData.append('pubmatRole', form.pubmatRole || '')
      if (formImage) {
        formData.append('photo', formImage)
      }

      const res = await createOfficerAction(formData)
      if (!res.success) {
        toast(res.error || 'Failed to add officer')
        return
      }

      await loadOfficers()
      setShowAdd(false)
      toast(`${form.isPubmat ? 'Pubmat member' : 'Officer'} added successfully!`)
    } catch {
      toast('Error saving new officer')
    } finally {
      setSavingAdd(false)
    }
  }

  async function handleDelete(officer: OfficerWithMeta) {
    if (!officer.id) {
      setOfficersList(officersList.filter((o) => o !== officer))
      toast('Officer removed from list.')
      setConfirmDeleteId(null)
      return
    }

    setDeletingId(officer.id)
    try {
      const res = await deleteOfficerAction(officer.id, officer.image)
      if (res.success) {
        toast('Officer deleted successfully.')
        await loadOfficers()
      } else {
        toast(res.error || 'Failed to delete officer')
      }
    } catch {
      toast('Error deleting officer')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  function handleImageChange(file: File | null) {
    setFormImage(file)
    setFormImagePreview(file ? URL.createObjectURL(file) : null)
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">
            Officers & Pubmat Directory
          </h1>
          <p className="text-sm text-white/35 mt-1">
            Manage student officers and Pubmat creative members, edit profiles, and configure access.
          </p>
        </div>
        {canManage && (
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit"
          >
            <Plus size={16} />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {officerTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${activeTab === tab.key
                ? 'bg-gold/15 text-gold border border-gold/25'
                : 'bg-white/[0.03] text-white/40 border border-white/8 hover:text-white/60 hover:border-white/15'
              }
            `}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, position, or email..."
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
        />
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="border border-gold/20 rounded-xl bg-gold/[0.03] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-white">
              Add New {form.isPubmat ? 'Pubmat Member' : 'Officer'}
            </h3>
            <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/8 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80 select-none">
              <input
                type="checkbox"
                checked={form.isPubmat}
                onChange={(e) => {
                  const isPub = e.target.checked
                  setForm({
                    ...form,
                    isPubmat: isPub,
                    position: isPub && !form.position ? 'Graphic Designer' : form.position,
                    department: isPub ? 'Pubmat Creative Team' : 'BSIT · CCIS',
                    pubmatRole: isPub ? 'Graphic Designer' : '',
                  })
                }}
                className="w-4 h-4 rounded border-white/20 text-gold focus:ring-gold/30 bg-white/5"
              />
              <span className="font-semibold text-white">Pubmat Creative Team Member</span>
            </label>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Full Name" htmlFor="add-name" required>
              <input id="add-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={inputStyles} required />
            </FormField>

            <FormField label="Position / Role" htmlFor="add-position" required>
              <input id="add-position" type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder={form.isPubmat ? 'e.g. Graphic Designer, Photographer' : 'e.g. President, Vice President'} className={inputStyles} required />
            </FormField>

            {!form.isPubmat ? (
              <FormField label="Role Group" required>
                <Select
                  value={form.roleGroup}
                  onChange={(val) => setForm({ ...form, roleGroup: val as RoleGroup })}
                  options={roleGroupOptions}
                />
              </FormField>
            ) : (
              <FormField label="Pubmat Role Specialty">
                <input
                  type="text"
                  value={form.pubmatRole}
                  onChange={(e) => setForm({ ...form, pubmatRole: e.target.value })}
                  placeholder="e.g. Graphic Designer, Videographer"
                  className={inputStyles}
                />
              </FormField>
            )}

            <FormField label="Department / Year Section">
              <input id="add-dept" type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="BSIT · CCIS" className={inputStyles} />
            </FormField>

            <FormField label="Institutional SSO Email" htmlFor="add-email">
              <input id="add-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@antiquespride.edu.ph" className={inputStyles} />
            </FormField>
          </div>

          <FormField label="Profile Image">
            <FileUpload accept="image/*" label="Upload profile photo" value={formImage} preview={formImagePreview} onChange={handleImageChange} maxSizeMB={3} />
          </FormField>

          <div className="flex gap-2">
            <button onClick={saveAdd} disabled={savingAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors disabled:opacity-50">
              <Save size={13} /> {savingAdd ? 'Saving...' : 'Save Member'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-lg text-xs text-white/40 border border-white/8 hover:text-white/60 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Officers Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((officer, i) => {
          const realIndex = officersList.indexOf(officer)
          const isEditing = editingIndex === realIndex
          const isConfirmingDelete = confirmDeleteId === (officer.id || officer.name)

          return (
            <div
              key={`${officer.name}-${officer.id || i}`}
              className={`
                group relative border rounded-xl overflow-hidden transition-all duration-300
                ${isEditing
                  ? 'border-gold/30 bg-gold/[0.04]'
                  : 'border-white/6 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04]'
                }
              `}
            >
              {isEditing ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/8">
                    <h4 className="text-xs font-display font-bold text-gold uppercase tracking-wider">
                      Edit Profile
                    </h4>
                    <button onClick={cancelEdit} className="text-white/30 hover:text-white/60">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80 select-none">
                      <input
                        type="checkbox"
                        checked={form.isPubmat}
                        onChange={(e) => setForm({ ...form, isPubmat: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-white/20 text-gold focus:ring-gold/30 bg-white/5"
                      />
                      <span className="text-[11px] text-white/70">Pubmat Member</span>
                    </label>
                  </div>

                  <FormField label="Name" htmlFor={`edit-name-${i}`} required>
                    <input id={`edit-name-${i}`} type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputStyles} required />
                  </FormField>

                  <FormField label="Position / Title" htmlFor={`edit-pos-${i}`} required>
                    <input id={`edit-pos-${i}`} type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputStyles} required />
                  </FormField>

                  {!form.isPubmat ? (
                    <FormField label="Role Group">
                      <Select
                        value={form.roleGroup}
                        onChange={(val) => setForm({ ...form, roleGroup: val as RoleGroup })}
                        options={roleGroupOptions}
                      />
                    </FormField>
                  ) : (
                    <FormField label="Pubmat Role Specialty">
                      <input
                        type="text"
                        value={form.pubmatRole}
                        onChange={(e) => setForm({ ...form, pubmatRole: e.target.value })}
                        placeholder="e.g. Graphic Designer, Videographer"
                        className={inputStyles}
                      />
                    </FormField>
                  )}

                  <FormField label="Department / Year Section" htmlFor={`edit-dept-${i}`}>
                    <input id={`edit-dept-${i}`} type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={inputStyles} />
                  </FormField>

                  <FormField label="Assigned Email (@antiquespride.edu.ph)" htmlFor={`edit-email-${i}`}>
                    <input id={`edit-email-${i}`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@antiquespride.edu.ph" className={inputStyles} />
                  </FormField>

                  <FormField label="Photo">
                    <FileUpload accept="image/*" label="Change photo" value={formImage} preview={formImagePreview} onChange={handleImageChange} maxSizeMB={3} />
                  </FormField>

                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={saveEdit} disabled={savingEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-[#0D1117] font-bold text-[11px] hover:bg-[#FFA726] transition-colors disabled:opacity-50">
                      <Save size={12} /> {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-[11px] text-white/40 border border-white/8 hover:text-white/60 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/15 flex items-center justify-center font-display font-bold text-sm text-gold/60 flex-shrink-0 overflow-hidden mt-0.5">
                    {officer.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={officer.image} alt={officer.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(officer.name)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[9px] text-gold/70 font-bold uppercase tracking-[0.15em] block leading-tight">
                        {officer.position}
                      </span>
                      {officer.isPubmat && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 text-[8px] font-mono uppercase tracking-wider border border-purple-500/20">
                          Pubmat
                        </span>
                      )}
                    </div>

                    <h4 className="font-display font-bold text-sm text-white leading-tight truncate mt-0.5">
                      {officer.name}
                    </h4>
                    <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mt-0.5">
                      {officer.department}
                    </span>

                    {officer.email ? (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono text-emerald-400/90 bg-emerald-400/[0.06] border border-emerald-400/15 px-2 py-0.5 rounded w-fit max-w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="truncate">{officer.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono text-white/25 bg-white/[0.02] border border-white/6 px-2 py-0.5 rounded w-fit">
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>No SSO email</span>
                      </div>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/25 p-1 rounded-lg">
                          <button
                            onClick={() => handleDelete(officer)}
                            disabled={deletingId === officer.id}
                            className="px-2 py-1 bg-red-500 text-white font-bold text-[10px] rounded hover:bg-red-600 transition-colors"
                            title="Confirm delete"
                          >
                            {deletingId === officer.id ? '...' : 'Del'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-1 text-white/40 hover:text-white text-[10px]"
                            title="Cancel"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(realIndex)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white/80 bg-white/[0.05] border border-white/10 hover:text-gold hover:border-gold/40 hover:bg-gold/10 transition-all shadow-sm"
                            title="Edit profile"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(officer.id || officer.name)}
                            className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/10 border border-white/6 hover:border-red-500/20 transition-all"
                            title="Delete officer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-white/30">No members found matching the criteria.</p>
        </div>
      )}
    </div>
  )
}
