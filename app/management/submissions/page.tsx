"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Palette,
  Search,
  Filter,
  ExternalLink,
  Download,
  Eye,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ManagementCardGridSkeleton } from "../_components/SkeletonPreloader";

interface PoloSubmission {
  id: string;
  student_name: string;
  student_email: string;
  student_avatar?: string | null;
  student_course_year?: string | null;
  title?: string | null;
  description?: string | null;
  file_url: string;
  file_key: string;
  file_name: string;
  file_size?: number | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function SubmissionsManagementPage() {
  const [submissions, setSubmissions] = useState<PoloSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<PoloSubmission | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("polo_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSubmissions(data as PoloSubmission[]);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const { data, error } = await supabase
          .from("polo_submissions")
          .select("*")
          .order("created_at", { ascending: false });

        if (active) {
          if (!error && data) {
            setSubmissions(data as PoloSubmission[]);
          } else {
            setSubmissions([]);
          }
        }
      } catch (err) {
        console.error("Error fetching submissions:", err);
        if (active) setSubmissions([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: PoloSubmission["status"]) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("polo_submissions")
        .update({ status: newStatus })
        .eq("id", id);

      if (!error) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
        if (selectedSubmission?.id === id) {
          setSelectedSubmission((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = submissions.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.student_name.toLowerCase().includes(q);
      const matchEmail = s.student_email.toLowerCase().includes(q);
      const matchTitle = s.title?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchTitle) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground-theme font-display">
              Polo Shirt Contest Entries
            </h1>
          </div>
          <p className="text-xs text-muted-foreground-theme">
            Review design submissions uploaded by verified University of Antique students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/management/submissions/voting"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/15 border border-gold/30 hover:bg-gold/25 text-xs text-gold transition-colors shrink-0 cursor-pointer shadow-xs font-medium"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Voting Analytics</span>
          </Link>

          <button
            onClick={fetchSubmissions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-theme border border-border-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs text-foreground-theme transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-theme border border-border-theme p-3 rounded-xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground-theme absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, or design title..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-black/30 border border-border-theme text-xs text-foreground-theme placeholder:text-muted-foreground-theme/50 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground-theme shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-black/30 border border-border-theme text-xs text-foreground-theme focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="all">All Status ({submissions.length})</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Grid of Submissions */}
      {loading ? (
        <ManagementCardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border-theme rounded-2xl bg-surface-theme shadow-xs p-8">
          <Palette className="w-10 h-10 text-muted-foreground-theme/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground-theme">No submissions found</p>
          <p className="text-xs text-muted-foreground-theme mt-1 max-w-sm mx-auto">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search query or status filter."
              : "No student polo designs have been submitted yet. Share the /polo-design link to start collecting concepts!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-surface-theme border border-border-theme rounded-xl overflow-hidden hover:border-gold/30 hover:shadow-xs transition-all flex flex-col group"
            >
              {/* Image Preview Container */}
              <div
                onClick={() => setSelectedSubmission(item)}
                className="relative aspect-[4/3] bg-slate-100 dark:bg-zinc-950 cursor-pointer overflow-hidden border-b border-border-theme"
              >
                <Image
                  src={item.file_url}
                  alt={item.title || "Design Mockup"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-[11px] text-white font-medium inline-flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Click to inspect</span>
                  </span>
                </div>

                {/* Status Badge */}
                <span
                  className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
                    item.status === "approved"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : item.status === "rejected"
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                      : "bg-slate-200 dark:bg-zinc-800/80 text-foreground-theme border border-border-theme"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Submitter Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground-theme truncate">
                    {item.title || "Untitled Design"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground-theme truncate mt-0.5">
                    By {item.student_name}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground-theme/70 truncate">
                    {item.student_email}
                  </p>

                  {item.student_course_year && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800/60 border border-border-theme text-[10px] font-medium text-muted-foreground-theme">
                      {item.student_course_year}
                    </span>
                  )}

                  {item.description && (
                    <p className="text-xs text-muted-foreground-theme line-clamp-2 mt-2 italic bg-slate-50 dark:bg-zinc-950/40 p-2 rounded-lg border border-border-theme">
                      &quot;{item.description}&quot;
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-border-theme flex items-center justify-between gap-2">
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-foreground-theme hover:text-foreground-theme inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Storage File</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateStatus(item.id, "approved")}
                      disabled={updatingId === item.id || item.status === "approved"}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, "rejected")}
                      disabled={updatingId === item.id || item.status === "rejected"}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white dark:bg-zinc-900 border border-border-theme rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-border-theme flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground-theme">
                  {selectedSubmission.title || selectedSubmission.file_name}
                </h2>
                <p className="text-[11px] text-muted-foreground-theme">
                  {selectedSubmission.student_name} ({selectedSubmission.student_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-muted-foreground-theme hover:text-foreground-theme p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-border-theme">
                <Image
                  src={selectedSubmission.file_url}
                  alt={selectedSubmission.title || "Full resolution design"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              {selectedSubmission.description && (
                <div className="bg-slate-50 dark:bg-zinc-950/60 border border-border-theme rounded-xl p-3.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground-theme/80 block mb-1">
                    Design Concept & Symbolism
                  </span>
                  <p className="text-xs text-foreground-theme leading-relaxed">
                    {selectedSubmission.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950/40 border border-border-theme">
                  <span className="text-[10px] text-muted-foreground-theme block">Section</span>
                  <span className="font-medium text-foreground-theme">
                    {selectedSubmission.student_course_year || "N/A"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950/40 border border-border-theme">
                  <span className="text-[10px] text-muted-foreground-theme block">Submitted At</span>
                  <span className="font-medium text-foreground-theme">
                    {new Date(selectedSubmission.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950/40 border border-border-theme">
                  <span className="text-[10px] text-muted-foreground-theme block">Status</span>
                  <span className="font-medium capitalize text-amber-600 dark:text-amber-400">
                    {selectedSubmission.status}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950/40 border border-border-theme">
                  <span className="text-[10px] text-muted-foreground-theme block">File Storage Link</span>
                  <a
                    href={selectedSubmission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium truncate block cursor-pointer"
                  >
                    Open Full Res
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border-theme flex items-center justify-between">
              <a
                href={selectedSubmission.file_url}
                target="_blank"
                download
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-foreground-theme inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Mockup</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, "rejected")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, "approved")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
