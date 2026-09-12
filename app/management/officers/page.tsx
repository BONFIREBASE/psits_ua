'use client'

import { useState } from 'react'
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
  PenLine,
  Camera,
  Star,
} from 'lucide-react'
import {
  officers as initialOfficers,
  pubmatTeam as initialPubmat,
  type Officer,
  type PubmatMember,
} from '@/data/officers'
import FormField, { inputStyles } from '../_components/FormField'
import Select from '../_components/Select'
import FileUpload from '../_components/FileUpload'
import { useToast } from '../_components/Toast'

/* ─── Types & Constants ─── */

type RoleGroup = Officer['roleGroup']
type Section = 'officers' | 'pubmat'

const officerTabs: { key: RoleGroup | 'All'; label: string; icon: typeof Award }[] = [
  { key: 'All', label: 'All', icon: UsersIcon },
  { key: 'Executive', label: 'Executive', icon: Award },
  { key: 'Secretariat & Finance', label: 'Secretariat & Finance', icon: ShieldCheck },
  { key: 'Operations & PR', label: 'Operations & PR', icon: BookOpen },
  { key: 'Year Representatives', label: 'Year Reps', icon: UsersIcon },
]

const pubmatRoles: PubmatMember['role'][] = [
  'Writer',
  'Graphic Designer',
  'Photographer',
  'Photographer / Videographer / Editor',
]

const pubmatTabs: { key: string; label: string; icon: typeof PenLine }[] = [
  { key: 'All', label: 'All', icon: Palette },
  { key: 'Writer', label: 'Writers', icon: PenLine },
  { key: 'Graphic Designer', label: 'Designers', icon: Palette },
  { key: 'Photographer', label: 'Photo / Video', icon: Camera },
]

/* ─── Helpers ─── */

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

/* ─── Main Page ─── */

export default function OfficersManagementPage() {
  const [section, setSection] = useState<Section>('officers')

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Section Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/6 w-fit">
        <button
          onClick={() => setSection('officers')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${section === 'officers'
              ? 'bg-gold/15 text-gold shadow-sm'
              : 'text-white/40 hover:text-white/65'
            }
          `}
        >
          <UsersIcon size={15} />
          Officers
        </button>
        <button
          onClick={() => setSection('pubmat')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${section === 'pubmat'
              ? 'bg-gold/15 text-gold shadow-sm'
              : 'text-white/40 hover:text-white/65'
            }
          `}
        >
          <Palette size={15} />
          Pubmat Team
        </button>
      </div>

      {section === 'officers' ? <OfficersSection /> : <PubmatSection />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   OFFICERS SECTION
   ═══════════════════════════════════════════════════ */

function OfficersSection() {
  const { toast } = useToast()
  const [officersList, setOfficersList] = useState<Officer[]>(initialOfficers)
  const [activeTab, setActiveTab] = useState<RoleGroup | 'All'>('All')
  const [search, setSearch] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const [editForm, setEditForm] = useState({ name: '', position: '', department: '' })
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  const filtered = officersList.filter((o) => {
    const matchesTab = activeTab === 'All' || o.roleGroup === activeTab
    const matchesSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.position.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  function startEdit(index: number) {
    const officer = officersList[index]
    setEditForm({ name: officer.name, position: officer.position, department: officer.department })
    setEditImage(null)
    setEditImagePreview(officer.image || null)
    setEditingIndex(index)
    setShowAdd(false)
  }

  function cancelEdit() {
    setEditingIndex(null)
    setEditForm({ name: '', position: '', department: '' })
    setEditImage(null)
    setEditImagePreview(null)
  }

  function saveEdit() {
    if (editingIndex === null) return
    const updated = [...officersList]
    updated[editingIndex] = {
      ...updated[editingIndex],
      name: editForm.name,
      position: editForm.position,
      department: editForm.department,
      image: editImagePreview || updated[editingIndex].image,
    }
    setOfficersList(updated)
    cancelEdit()
    console.log('[Management] Officer updated:', updated[editingIndex])
    toast('Officer updated successfully. (Placeholder)')
  }

  function startAdd() {
    setShowAdd(true)
    setEditingIndex(null)
    setEditForm({ name: '', position: '', department: '' })
    setEditImage(null)
    setEditImagePreview(null)
  }

  function saveAdd() {
    if (!editForm.name || !editForm.position) return
    const newOfficer: Officer = {
      name: editForm.name,
      position: editForm.position,
      roleGroup: activeTab !== 'All' ? activeTab : 'Executive',
      department: editForm.department || 'BSIT · CCIS',
      image: editImagePreview || undefined,
    }
    setOfficersList([...officersList, newOfficer])
    setShowAdd(false)
    setEditForm({ name: '', position: '', department: '' })
    setEditImage(null)
    setEditImagePreview(null)
    console.log('[Management] Officer added:', newOfficer)
    toast('Officer added successfully. (Placeholder)')
  }

  function handleImageChange(file: File | null) {
    setEditImage(file)
    setEditImagePreview(file ? URL.createObjectURL(file) : null)
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">
            Officers
          </h1>
          <p className="text-sm text-white/35 mt-1">
            Manage officer names, positions, and profile images.
          </p>
        </div>
        <button
          onClick={startAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit"
        >
          <Plus size={16} />
          <span>Add Officer</span>
        </button>
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
          placeholder="Search officers..."
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
          <div className="grid sm:grid-cols-3 gap-4">
            <FormField label="Name" htmlFor="add-name" required>
              <input id="add-name" type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full name" className={inputStyles} />
            </FormField>
            <FormField label="Position" htmlFor="add-position" required>
              <input id="add-position" type="text" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} placeholder="e.g. President" className={inputStyles} />
            </FormField>
            <FormField label="Department" htmlFor="add-dept">
              <input id="add-dept" type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} placeholder="BSIT · CCIS" className={inputStyles} />
            </FormField>
          </div>
          <FormField label="Profile Image">
            <FileUpload accept="image/*" label="Upload profile image" value={editImage} preview={editImagePreview} onChange={handleImageChange} maxSizeMB={3} />
          </FormField>
          <div className="flex gap-2">
            <button onClick={saveAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors">
              <Save size={13} /> Save
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
                <div className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/15 flex items-center justify-center font-display font-bold text-sm text-gold/60 flex-shrink-0 overflow-hidden">
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
                  </div>
                  <button
                    onClick={() => startEdit(realIndex)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-white/25 border border-white/6 hover:text-gold hover:border-gold/25 hover:bg-gold/[0.04] transition-all opacity-0 group-hover:opacity-100"
                  >
                    Edit
                  </button>
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
    </>
  )
}

/* ═══════════════════════════════════════════════════
   PUBMAT TEAM SECTION
   ═══════════════════════════════════════════════════ */

function PubmatSection() {
  const { toast } = useToast()
  const [membersList, setMembersList] = useState<PubmatMember[]>(initialPubmat)
  const [activeTab, setActiveTab] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const [editForm, setEditForm] = useState({
    name: '',
    role: '' as PubmatMember['role'] | '',
    isLead: false,
  })
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  const filtered = membersList.filter((m) => {
    const matchesTab =
      activeTab === 'All' ||
      m.role === activeTab ||
      (activeTab === 'Photographer' &&
        (m.role === 'Photographer' || m.role === 'Photographer / Videographer / Editor'))
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  function startEdit(index: number) {
    const member = membersList[index]
    setEditForm({ name: member.name, role: member.role, isLead: member.isLead })
    setEditImage(null)
    setEditImagePreview(member.image || null)
    setEditingIndex(index)
    setShowAdd(false)
  }

  function cancelEdit() {
    setEditingIndex(null)
    setEditForm({ name: '', role: '', isLead: false })
    setEditImage(null)
    setEditImagePreview(null)
  }

  function saveEdit() {
    if (editingIndex === null || !editForm.role) return
    const updated = [...membersList]
    updated[editingIndex] = {
      ...updated[editingIndex],
      name: editForm.name,
      role: editForm.role as PubmatMember['role'],
      isLead: editForm.isLead,
      image: editImagePreview || updated[editingIndex].image,
    }
    setMembersList(updated)
    cancelEdit()
    console.log('[Management] Pubmat member updated:', updated[editingIndex])
    toast('Pubmat member updated successfully. (Placeholder)')
  }

  function startAdd() {
    setShowAdd(true)
    setEditingIndex(null)
    setEditForm({ name: '', role: '', isLead: false })
    setEditImage(null)
    setEditImagePreview(null)
  }

  function saveAdd() {
    if (!editForm.name || !editForm.role) return
    const newMember: PubmatMember = {
      name: editForm.name,
      role: editForm.role as PubmatMember['role'],
      isLead: editForm.isLead,
      image: editImagePreview || undefined,
    }
    setMembersList([...membersList, newMember])
    setShowAdd(false)
    setEditForm({ name: '', role: '', isLead: false })
    setEditImage(null)
    setEditImagePreview(null)
    console.log('[Management] Pubmat member added:', newMember)
    toast('Pubmat member added successfully. (Placeholder)')
  }

  function handleImageChange(file: File | null) {
    setEditImage(file)
    setEditImagePreview(file ? URL.createObjectURL(file) : null)
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">
            Pubmat Team
          </h1>
          <p className="text-sm text-white/35 mt-1">
            Manage the Publications &amp; Multimedia team members, roles, and images.
          </p>
        </div>
        <button
          onClick={startAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit"
        >
          <Plus size={16} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {pubmatTabs.map((tab) => (
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
          placeholder="Search members..."
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
        />
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="border border-gold/20 rounded-xl bg-gold/[0.03] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-white">Add New Pubmat Member</h3>
            <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Name" htmlFor="add-pm-name" required>
              <input id="add-pm-name" type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full name" className={inputStyles} />
            </FormField>
            <FormField label="Role" required>
              <Select
                id="add-pm-role"
                value={editForm.role}
                onChange={(val) => setEditForm({ ...editForm, role: val as PubmatMember['role'] })}
                placeholder="Select role"
                options={pubmatRoles.map((r) => ({ value: r, label: r }))}
              />
            </FormField>
          </div>
          <FormField label="Profile Image">
            <FileUpload accept="image/*" label="Upload profile image" value={editImage} preview={editImagePreview} onChange={handleImageChange} maxSizeMB={3} />
          </FormField>
          {/* Lead Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${editForm.isLead ? 'bg-gold/40' : 'bg-white/10'}`}
              onClick={() => setEditForm({ ...editForm, isLead: !editForm.isLead })}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${editForm.isLead ? 'left-[22px] bg-gold' : 'left-0.5 bg-white/40'}`} />
            </div>
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
              Team Lead
            </span>
          </label>
          <div className="flex gap-2">
            <button onClick={saveAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors">
              <Save size={13} /> Save
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-lg text-xs text-white/40 border border-white/8 hover:text-white/60 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Members Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((member, i) => {
          const realIndex = membersList.indexOf(member)
          const isEditing = editingIndex === realIndex

          return (
            <div
              key={`${member.name}-${i}`}
              className={`
                group relative border rounded-xl overflow-hidden transition-all duration-300
                ${isEditing
                  ? 'border-gold/30 bg-gold/[0.04]'
                  : 'border-white/6 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04]'
                }
              `}
            >
              {isEditing ? (
                /* Edit Mode */
                <div className="p-4 space-y-3">
                  <FormField label="Name" htmlFor={`edit-pm-name-${i}`}>
                    <input id={`edit-pm-name-${i}`} type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputStyles} />
                  </FormField>
                  <FormField label="Role">
                    <Select
                      id={`edit-pm-role-${i}`}
                      value={editForm.role}
                      onChange={(val) => setEditForm({ ...editForm, role: val as PubmatMember['role'] })}
                      options={pubmatRoles.map((r) => ({ value: r, label: r }))}
                    />
                  </FormField>
                  <FormField label="Photo">
                    <FileUpload accept="image/*" label="Upload photo" value={editImage} preview={editImagePreview} onChange={handleImageChange} maxSizeMB={3} />
                  </FormField>
                  {/* Lead Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group/lead">
                    <div
                      className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${editForm.isLead ? 'bg-gold/40' : 'bg-white/10'}`}
                      onClick={() => setEditForm({ ...editForm, isLead: !editForm.isLead })}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${editForm.isLead ? 'left-[22px] bg-gold' : 'left-0.5 bg-white/40'}`} />
                    </div>
                    <span className="text-xs text-white/50 group-hover/lead:text-white/70 transition-colors">
                      Team Lead
                    </span>
                  </label>
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
                /* Display Mode */
                <div className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/15 flex items-center justify-center font-display font-bold text-sm text-gold/60 flex-shrink-0 overflow-hidden">
                    {member.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono text-[9px] text-gold/70 font-bold uppercase tracking-[0.15em]">
                        {member.role}
                      </span>
                      {member.isLead && (
                        <Star size={10} className="text-gold fill-gold/30 flex-shrink-0" />
                      )}
                    </div>
                    <h4 className="font-display font-bold text-sm text-white leading-tight truncate">
                      {member.name}
                    </h4>
                    <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mt-0.5">
                      {member.isLead ? 'Team Lead' : 'Pubmat Team'}
                    </span>
                  </div>
                  <button
                    onClick={() => startEdit(realIndex)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-white/25 border border-white/6 hover:text-gold hover:border-gold/25 hover:bg-gold/[0.04] transition-all opacity-0 group-hover:opacity-100"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-white/30">No pubmat members found.</p>
        </div>
      )}
    </>
  )
}
