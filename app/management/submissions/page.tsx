"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Palette,
  Search,
  Filter,
  ExternalLink,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Loader2,
  Calendar,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../_context/auth-context";
import { supabase, supabaseAdmin } from "@/lib/supabase";

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
  status: "pending" | "approved" | "shortlisted" | "rejected";
  created_at: string;
}

export default function SubmissionsManagementPage() {
  const { user } = useAuth();
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
        // If table not yet queried or empty
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
    fetchSubmissions();
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
            <Palette className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-outfit">
              Polo Shirt Contest Entries
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Review design submissions uploaded by verified University of Antique students.
          </p>
        </div>

        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, or design title..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Status ({submissions.length})</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Grid of Submissions */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <p className="text-xs">Loading design submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 p-8">
          <Palette className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-300">No submissions found</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
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
              className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col group"
            >
              {/* Image Preview Container */}
              <div
                onClick={() => setSelectedSubmission(item)}
                className="relative aspect-[4/3] bg-zinc-950 cursor-pointer overflow-hidden border-b border-zinc-800"
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
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : item.status === "shortlisted"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : item.status === "rejected"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Submitter Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-white truncate">
                    {item.title || "Untitled Design"}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    By {item.student_name}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 truncate">
                    {item.student_email}
                  </p>

                  {item.student_course_year && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-zinc-800/60 text-[10px] font-medium text-zinc-400">
                      {item.student_course_year}
                    </span>
                  )}

                  {item.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-2 italic bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/60">
                      &quot;{item.description}&quot;
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-zinc-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Storage File</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateStatus(item.id, "shortlisted")}
                      disabled={updatingId === item.id || item.status === "shortlisted"}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, "approved")}
                      disabled={updatingId === item.id || item.status === "approved"}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      Approve
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {selectedSubmission.title || selectedSubmission.file_name}
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {selectedSubmission.student_name} ({selectedSubmission.student_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                <Image
                  src={selectedSubmission.file_url}
                  alt={selectedSubmission.title || "Full resolution design"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              {selectedSubmission.description && (
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1">
                    Design Concept & Symbolism
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {selectedSubmission.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 block">Section</span>
                  <span className="font-medium text-zinc-200">
                    {selectedSubmission.student_course_year || "N/A"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 block">Submitted At</span>
                  <span className="font-medium text-zinc-200">
                    {new Date(selectedSubmission.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 block">Status</span>
                  <span className="font-medium capitalize text-amber-400">
                    {selectedSubmission.status}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 block">File Storage Link</span>
                  <a
                    href={selectedSubmission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline font-medium truncate block"
                  >
                    Open Full Res
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
              <a
                href={selectedSubmission.file_url}
                target="_blank"
                download
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Mockup</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, "rejected")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, "shortlisted")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, "approved")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
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
