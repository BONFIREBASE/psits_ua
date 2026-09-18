'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  X,
  Save,
  Plus,
  Award,
  ShieldCheck,
  BookOpen,
  Users as UsersIcon,
} from 'lucide-react'
import {
  officers as initialOfficers,
  type Officer,
} from '@/data/officers'
import FormField, { inputStyles } from '../_components/FormField'
import FileUpload from '../_components/FileUpload'
import { useToast } from '../_components/Toast'
import { getOfficers } from '@/lib/supabase'
import { createOfficerAction, updateOfficerEmailAction } from './actions'
import { useAuth } from '../_context/auth-context'

/* ─── Types & Constants ─── */

type RoleGroup = Officer['roleGroup']

const officerTabs: { key: RoleGroup | 'All'; label: string; icon: typeof Award }[] = [
  { key: 'All', label: 'All', icon: UsersIcon },
  { key: 'Executive', label: 'Executive', icon: Award },
  { key: 'Secretariat & Finance', label: 'Secretariat & Finance', icon: ShieldCheck },
  { key: 'Operations & PR', label: 'Operations & PR', icon: BookOpen },
  { key: 'Year Representatives', label: 'Year Reps', icon: UsersIcon },
]

interface OfficerWithMeta extends Officer {
  id?: string
  email?: string
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
  const isAdmin = user?.role === 'admin'

  const [officersList, setOfficersList] = useState<OfficerWithMeta[]>(initialOfficers)
  const [activeTab, setActiveTab] = useState<RoleGroup | 'All'>('All')
  const [search, setSearch] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [savingAdd, setSavingAdd] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const dbOfficers = await getOfficers()
        if (dbOfficers && dbOfficers.length > 0) {
          const mapped: OfficerWithMeta[] = dbOfficers
            .filter((o) => !o.is_pubmat)
            .map((o) => ({
              id: o.id,
              name: o.name,
              position: o.position,
              roleGroup: o.role_group as RoleGroup,
              department: o.year_section,
              email: o.email || undefined,
              image: o.image_url || undefined,
            }))
          if (mapped.length > 0) {
            setOfficersList(mapped)
          }
        }
      } catch {}
    }
    load()
  }, [])

  const [editForm, setEditForm] = useState({ name: '', position: '', department: '', email: '' })
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  const filtered = officersList.filter((o) => {
    const matchesTab = activeTab === 'All' || o.roleGroup === activeTab
    const matchesSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.position.toLowerCase().includes(search.toLowerCase()) ||
      (o.email && o.email.toLowerCase().includes(search.toLowerCase()))
    return matchesTab && matchesSearch
  })

  function startEdit(index: number) {
    const officer = officersList[index]
    setEditForm({
      name: officer.name,
      position: officer.position,
      department: officer.department,
      email: officer.email || '',
    })
    setEditImage(null)
    setEditImagePreview(officer.image || null)
    setEditingIndex(index)
    setShowAdd(false)
  }

  function cancelEdit() {
    setEditingIndex(null)
    setEditForm({ name: '', position: '', department: '', email: '' })
    setEditImage(null)
    setEditImagePreview(null)
  }

  async function saveEdit() {
    if (editingIndex === null) return
    const target = officersList[editingIndex]

    if (editForm.email && !editForm.email.endsWith('@antiquespride.edu.ph')) {
      toast('Email must end with @antiquespride.edu.ph')
      return
    }

    if (target.id && editForm.email !== (target.email || '')) {
      const res = await updateOfficerEmailAction(target.id, editForm.email)
      if (!res.success) {
        toast(res.error || 'Failed to update officer email')
        return
      }
    }

    const updated = [...officersList]
    updated[editingIndex] = {
      ...target,
      name: editForm.name,
      position: editForm.position,
      department: editForm.department,
      email: editForm.email || undefined,
      image: editImagePreview || target.image,
    }
    setOfficersList(updated)
    cancelEdit()
    toast('Officer profile & assigned email updated successfully!')
  }

  function startAdd() {
    setShowAdd(true)
    setEditingIndex(null)
    setEditForm({ name: '', position: '', department: '', email: '' })
    setEditImage(null)
    setEditImagePreview(null)
  }

  async function saveAdd() {
    if (!editForm.name || !editForm.position) return
    if (editForm.email && !editForm.email.endsWith('@antiquespride.edu.ph')) {
      toast('Email must end with @antiquespride.edu.ph')
      return
    }

    setSavingAdd(true)
    try {
      const formData = new FormData()
      formData.append('name', editForm.name)
      formData.append('position', editForm.position)
      formData.append('roleGroup', activeTab !== 'All' ? activeTab : 'Executive')
      formData.append('yearSection', editForm.department || 'BSIT · CCIS')
      formData.append('email', editForm.email)
      formData.append('isPubmat', 'false')
      if (editImage) formData.append('photo', editImage)

      const res = await createOfficerAction(formData)
      if (!res.success) {
        toast(res.error || 'Failed to add officer')
        return
      }

      const createdId = (res.data as { id?: string })?.id
      const createdImg = (res.data as { image_url?: string })?.image_url

      const newOfficer: OfficerWithMeta = {
        id: createdId,
        name: editForm.name,
        position: editForm.position,
        roleGroup: activeTab !== 'All' ? activeTab : 'Executive',
        department: editForm.department || 'BSIT · CCIS',
        email: editForm.email || undefined,
        image: createdImg || editImagePreview || undefined,
      }
      setOfficersList([...officersList, newOfficer])
      setShowAdd(false)
      setEditForm({ name: '', position: '', department: '', email: '' })
      setEditImage(null)
      setEditImagePreview(null)
      toast('Officer created and email assigned successfully!')
    } finally {
      setSavingAdd(false)
    }
  }

  function handleImageChange(file: File | null) {
    setEditImage(file)
    setEditImagePreview(file ? URL.createObjectURL(file) : null)
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">
            Officers Directory
          </h1>
          <p className="text-sm text-white/35 mt-1">
            Manage officer directory, assign institutional emails, and configure portal access.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit"
          >
            <Plus size={16} />
            <span>Add Officer</span>
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
            <h3 className="text-sm font-display font-bold text-white">Add New Officer</h3>
            <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Name" htmlFor="add-name" required>
              <input id="add-name" type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full name" className={inputStyles} />
            </FormField>
            <FormField label="Position" htmlFor="add-position" required>
              <input id="add-position" type="text" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} placeholder="e.g. President" className={inputStyles} />
            </FormField>
            <FormField label="Department" htmlFor="add-dept">
              <input id="add-dept" type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} placeholder="BSIT · CCIS" className={inputStyles} />
            </FormField>
            <FormField label="Assigned Email" htmlFor="add-email">
              <input id="add-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="name@antiquespride.edu.ph" className={inputStyles} />
            </FormField>
          </div>
          <FormField label="Profile Image">
            <FileUpload accept="image/*" label="Upload profile image" value={editImage} preview={editImagePreview} onChange={handleImageChange} maxSizeMB={3} />
          </FormField>
          <div className="flex gap-2">
            <button onClick={saveAdd} disabled={savingAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors disabled:opacity-50">
              <Save size={13} /> {savingAdd ? 'Saving...' : 'Save Officer'}
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

          return (
            <div
              key={`${officer.name}-${i}`}
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
                  <FormField label="Name" htmlFor={`edit-name-${i}`}>
                    <input id={`edit-name-${i}`} type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputStyles} />
                  </FormField>
                  <FormField label="Position" htmlFor={`edit-pos-${i}`}>
                    <input id={`edit-pos-${i}`} type="text" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} className={inputStyles} />
                  </FormField>
                  <FormField label="Department" htmlFor={`edit-dept-${i}`}>
                    <input id={`edit-dept-${i}`} type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className={inputStyles} />
                  </FormField>
                  <FormField label="Assigned Email (@antiquespride.edu.ph)" htmlFor={`edit-email-${i}`}>
                    <input id={`edit-email-${i}`} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="name@antiquespride.edu.ph" className={inputStyles} />
                  </FormField>
                  <FormField label="Photo">
                    <FileUpload accept="image/*" label="Upload photo" value={editImage} preview={editImagePreview} onChange={handleImageChange} maxSizeMB={3} />
                  </FormField>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-[#0D1117] font-bold text-[11px] hover:bg-[#FFA726] transition-colors">
                      <Save size={12} /> Save
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
                    <span className="font-mono text-[9px] text-gold/70 font-bold uppercase tracking-[0.15em] block mb-0.5">
                      {officer.position}
                    </span>
                    <h4 className="font-display font-bold text-sm text-white leading-tight truncate">
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
                  {isAdmin && (
                    <button
                      onClick={() => startEdit(realIndex)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-white/25 border border-white/6 hover:text-gold hover:border-gold/25 hover:bg-gold/[0.04] transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-white/30">No officers found.</p>
        </div>
      )}
    </div>
  )
}
