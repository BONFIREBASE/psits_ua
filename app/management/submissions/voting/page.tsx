"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  TrendingUp,
  Award,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Settings,
  ArrowLeft,
  Eye,
  Palette,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ============================================================================
// Types
// ============================================================================

interface VotingAnalytics {
  id: string;
  title: string | null;
  designer_name: string;
  designer_course_year: string | null;
  file_url: string;
  vote_count: number;
  vote_percentage: number;
  status: string;
  created_at: string;
}

interface VoterRecord {
  id: string;
  student_email: string;
  student_name: string;
  voted_at: string;
  submission_id: string;
  polo_submissions: {
    id: string;
    title: string | null;
    student_name: string;
    file_url: string;
  };
}

interface VotingConfig {
  voting_enabled: boolean;
  voting_start_date: string | null;
  voting_end_date: string | null;
  allow_vote_change: boolean;
}

interface AnalyticsData {
  config: VotingConfig;
  summary: {
    total_votes: number;
    total_submissions: number;
    submissions_with_votes: number;
    highest_votes: number;
    average_votes: number;
  };
  analytics: VotingAnalytics[];
  top_designs: Array<{
    rank: number;
    id: string;
    title: string | null;
    designer_name: string;
    vote_count: number;
    vote_percentage: number;
    file_url: string;
  }>;
  voters: VoterRecord[];
  timeline: Array<{ date: string; count: number }>;
}

// ============================================================================
// ============================================================================
// Vote Chart Color Palette (Vibrant, high-contrast, non-dark)
// ============================================================================
const VOTE_CHART_COLORS = [
  "#F59E0B", // Amber / Gold
  "#3B82F6", // Royal Blue
  "#10B981", // Emerald Green
  "#8B5CF6", // Violet
  "#EC4899", // Rose Pink
  "#06B6D4", // Electric Cyan
  "#F97316", // Bright Orange
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#84CC16", // Lime Green
];

// ============================================================================
// Pie / Donut Chart Component
// ============================================================================

function PieChart({ data }: { data: VotingAnalytics[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground-theme text-xs font-mono">
        No voting data available
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.vote_count - a.vote_count);
  const total = sortedData.reduce((sum, item) => sum + item.vote_count, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground-theme text-xs font-mono gap-2">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-border-theme flex items-center justify-center text-muted-foreground-theme">
          0
        </div>
        <p>No votes cast yet</p>
      </div>
    );
  }

  const activeItems = sortedData.filter((item) => item.vote_count > 0);
  const radius = 68;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="flex items-center justify-center p-6">
      <svg viewBox="0 0 200 200" className="w-full max-w-[280px] drop-shadow-xs">
        {/* Subtle background ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200/60 dark:text-white/[0.06]"
        />

        {/* If only 1 item has votes, draw full ring cleanly without arc collapse */}
        {activeItems.length === 1 ? (
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={VOTE_CHART_COLORS[0]}
            strokeWidth={strokeWidth}
            className="transition-all duration-300 hover:opacity-90 cursor-pointer"
          >
            <title>{`${activeItems[0].title || activeItems[0].designer_name}: ${activeItems[0].vote_count} votes (100.0%)`}</title>
          </circle>
        ) : (
          activeItems.map((item, index) => {
            const percentage = (item.vote_count / total) * 100;
            const strokeLength = (percentage / 100) * circumference;
            // Add subtle gap between slices
            const gap = activeItems.length > 1 ? 2.5 : 0;
            const dashLength = Math.max(1, strokeLength - gap);
            const strokeDash = `${dashLength} ${circumference - dashLength}`;
            const strokeOffset = -currentOffset;
            currentOffset += strokeLength;

            return (
              <circle
                key={item.id}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={VOTE_CHART_COLORS[index % VOTE_CHART_COLORS.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                strokeLinecap="butt"
                transform="rotate(-90 100 100)"
                className="transition-all duration-300 hover:opacity-85 cursor-pointer"
              >
                <title>{`${item.title || item.designer_name}: ${item.vote_count} votes (${percentage.toFixed(1)}%)`}</title>
              </circle>
            );
          })
        )}

        {/* Center counter text - uses theme CSS variables for light & dark mode */}
        <text
          x="100"
          y="95"
          textAnchor="middle"
          className="text-3xl font-extrabold font-display select-none pointer-events-none"
          style={{ fill: "var(--color-text, currentColor)" }}
        >
          {total}
        </text>
        <text
          x="100"
          y="112"
          textAnchor="middle"
          className="text-[10px] font-mono font-bold tracking-wider uppercase select-none pointer-events-none"
          style={{ fill: "var(--color-muted, #7A8394)" }}
        >
          {total === 1 ? "Vote Cast" : "Total Votes"}
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// Legend Component
// ============================================================================

function ChartLegend({ data }: { data: VotingAnalytics[] }) {
  const sortedData = [...data].sort((a, b) => b.vote_count - a.vote_count);

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground-theme text-xs font-mono">
        No designs available
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {sortedData.map((item, index) => {
        const color = VOTE_CHART_COLORS[index % VOTE_CHART_COLORS.length];
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-canvas-theme/50 transition-colors border border-transparent hover:border-border-theme/40"
          >
            <div
              className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground-theme truncate">
                {item.title || item.designer_name}
              </p>
              <p className="text-[10px] text-muted-foreground-theme truncate">
                {item.designer_name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-foreground-theme tabular-nums">
                {item.vote_count} {item.vote_count === 1 ? "vote" : "votes"}
              </p>
              <p className="text-[10px] text-muted-foreground-theme font-mono">
                {item.vote_percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function VotingAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState<VotingConfig>({
    voting_enabled: false,
    voting_start_date: null,
    voting_end_date: null,
    allow_vote_change: false,
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        setSessionToken(session.access_token);
      }
    }
    checkAuth();
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!sessionToken) return;

    setLoading(true);
    try {
      const res = await fetch("/api/submissions/polo/analytics", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
        setConfigForm(analyticsData.config);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (!sessionToken) return;
    let isCancelled = false;

    async function loadInitialData() {
      try {
        const res = await fetch("/api/submissions/polo/analytics", {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });

        if (res.ok && !isCancelled) {
          const analyticsData = await res.json();
          setData(analyticsData);
          setConfigForm(analyticsData.config);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching analytics:", err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, [sessionToken]);

  // Save voting configuration
  const handleSaveConfig = async () => {
    if (!sessionToken) return;

    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/submissions/polo/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(configForm),
      });

      if (res.ok) {
        await fetchAnalytics();
        setShowConfigModal(false);
      }
    } catch (err) {
      console.error("Error saving config:", err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Export results to PDF
  const handleExport = async () => {
    if (!data) return;

    // Create printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PSITS-UA Polo Shirt Design Contest - Voting Results</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: white;
            color: #000;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #F5A623;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 28px;
            color: #1a1a1a;
            margin-bottom: 8px;
            font-weight: 800;
          }
          .header p {
            color: #666;
            font-size: 14px;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }
          .stat-card {
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 16px;
            background: #f9f9f9;
          }
          .stat-card h3 {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .stat-card .value {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e5e5;
          }
          th {
            background: #f5f5f5;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
          }
          td {
            font-size: 14px;
            color: #1a1a1a;
          }
          .rank-badge {
            display: inline-block;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #F5A623;
            color: white;
            text-align: center;
            line-height: 28px;
            font-weight: 700;
            font-size: 13px;
          }
          .top-1 { background: #FFD700; }
          .top-2 { background: #C0C0C0; }
          .top-3 { background: #CD7F32; }
          .vote-bar {
            height: 24px;
            background: #F5A623;
            border-radius: 4px;
            display: inline-block;
            min-width: 2px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            color: #999;
            font-size: 11px;
          }
          @media print {
            body { padding: 20px; }
            .stat-card { break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎨 PSITS-UA Polo Shirt Design Contest</h1>
          <p>Official Voting Results - Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>Total Votes</h3>
            <div class="value">${data.summary.total_votes}</div>
          </div>
          <div class="stat-card">
            <h3>Total Designs</h3>
            <div class="value">${data.summary.total_submissions}</div>
          </div>
          <div class="stat-card">
            <h3>Highest Votes</h3>
            <div class="value">${data.summary.highest_votes}</div>
          </div>
          <div class="stat-card">
            <h3>Average Votes</h3>
            <div class="value">${data.summary.average_votes.toFixed(1)}</div>
          </div>
        </div>

        <h2 style="margin-bottom: 16px; font-size: 20px; color: #1a1a1a;">📊 Voting Results</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">Rank</th>
              <th>Design Title</th>
              <th>Designer</th>
              <th>Course/Year</th>
              <th style="text-align: right;">Votes</th>
              <th style="text-align: right;">Percentage</th>
              <th style="width: 150px;">Distribution</th>
            </tr>
          </thead>
          <tbody>
            ${data.analytics.map((item, index) => `
              <tr>
                <td>
                  <span class="rank-badge ${
                    index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''
                  }">${index + 1}</span>
                </td>
                <td style="font-weight: 600;">${item.title || 'Untitled'}</td>
                <td>${item.designer_name}</td>
                <td>${item.designer_course_year || 'N/A'}</td>
                <td style="text-align: right; font-weight: 600;">${item.vote_count}</td>
                <td style="text-align: right;">${item.vote_percentage.toFixed(1)}%</td>
                <td>
                  <div class="vote-bar" style="width: ${item.vote_percentage}%"></div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Philippine Society of Information Technology Students - University of Antique</p>
          <p>Official Contest Results • Confidential</p>
        </div>
      </body>
      </html>
    `;

    // Open print dialog for PDF export
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-8 w-48 bg-surface-theme animate-pulse rounded-lg" />
            <div className="h-4 w-64 bg-surface-theme animate-pulse rounded-lg" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="h-10 w-24 bg-surface-theme animate-pulse rounded-lg" />
            <div className="h-10 w-32 bg-surface-theme animate-pulse rounded-lg" />
            <div className="h-10 w-24 bg-surface-theme animate-pulse rounded-lg" />
          </div>
        </div>

        {/* Status Banner Skeleton */}
        <div className="h-16 bg-surface-theme animate-pulse rounded-xl" />

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-theme animate-pulse rounded-xl" />
          ))}
        </div>

        {/* Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="h-96 bg-surface-theme animate-pulse rounded-xl" />
          <div className="h-96 bg-surface-theme animate-pulse rounded-xl" />
        </div>

        {/* Top Designs Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-surface-theme animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-surface-theme animate-pulse rounded-xl" />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-40 bg-surface-theme animate-pulse rounded-lg" />
          <div className="h-64 bg-surface-theme animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground-theme">
          Failed to load analytics data
        </div>
      </div>
    );
  }

  const votingStatus = data.config.voting_enabled
    ? "Active"
    : "Inactive";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/management/submissions"
              className="text-muted-foreground-theme hover:text-foreground-theme transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground-theme font-display">
              Voting Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground-theme">
            Monitor vote counts, view statistics, and manage voting settings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-canvas-theme dark:bg-canvas-theme hover:bg-surface-theme dark:hover:bg-surface-theme text-foreground-theme border border-border-theme transition-colors text-xs sm:text-sm"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0D1117] transition-colors text-xs sm:text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>

          <button
            onClick={fetchAnalytics}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-canvas-theme dark:bg-canvas-theme hover:bg-surface-theme dark:hover:bg-surface-theme text-foreground-theme border border-border-theme transition-colors text-xs sm:text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border ${
        data.config.voting_enabled
          ? "bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/30"
          : "bg-orange-500/10 dark:bg-orange-500/10 border-orange-500/30"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {data.config.voting_enabled ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-orange-500 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground-theme">
                Voting Status: <span className={data.config.voting_enabled ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}>{votingStatus}</span>
              </p>
              {data.config.voting_start_date && data.config.voting_end_date && (
                <p className="text-xs text-muted-foreground-theme mt-0.5">
                  Period: {new Date(data.config.voting_start_date).toLocaleDateString()} - {new Date(data.config.voting_end_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/view"
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-theme dark:bg-surface-theme hover:bg-canvas-theme dark:hover:bg-canvas-theme text-foreground-theme border border-border-theme transition-colors text-xs whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            View Gallery
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface-theme dark:bg-surface-theme border border-border-theme rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-5 h-5 text-gold" />
            <span className="text-xs text-muted-foreground-theme font-mono">TOTAL</span>
          </div>
          <p className="text-2xl font-bold text-foreground-theme font-display">
            {data.summary.total_votes}
          </p>
          <p className="text-xs text-muted-foreground-theme mt-1">Votes Cast</p>
        </div>

        <div className="bg-surface-theme dark:bg-surface-theme border border-border-theme rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Palette className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-muted-foreground-theme font-mono">DESIGNS</span>
          </div>
          <p className="text-2xl font-bold text-foreground-theme font-display">
            {data.summary.submissions_with_votes}/{data.summary.total_submissions}
          </p>
          <p className="text-xs text-muted-foreground-theme mt-1">With Votes</p>
        </div>

        <div className="bg-surface-theme dark:bg-surface-theme border border-border-theme rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Award className="w-5 h-5 text-emerald-500" />
            <span className="text-xs text-muted-foreground-theme font-mono">HIGHEST</span>
          </div>
          <p className="text-2xl font-bold text-foreground-theme font-display">
            {data.summary.highest_votes}
          </p>
          <p className="text-xs text-muted-foreground-theme mt-1">Most Votes</p>
        </div>

        <div className="bg-surface-theme dark:bg-surface-theme border border-border-theme rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-muted-foreground-theme font-mono">AVERAGE</span>
          </div>
          <p className="text-2xl font-bold text-foreground-theme font-display">
            {data.summary.average_votes.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground-theme mt-1">Votes per Design</p>
        </div>
      </div>

      {/* Pie Chart and Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-theme border border-border-theme rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground-theme font-display mb-4">
            Vote Distribution
          </h2>
          <PieChart data={data.analytics} />
        </div>

        <div className="bg-surface-theme border border-border-theme rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground-theme font-display mb-4">
            Designs Ranking
          </h2>
          <ChartLegend data={data.analytics} />
        </div>
      </div>

      {/* Top 3 Designs */}
      {data.top_designs.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground-theme font-display mb-4">
            Top 3 Designs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.top_designs.map((design) => (
              <div
                key={design.id}
                className="bg-surface-theme border border-border-theme rounded-xl overflow-hidden hover:border-gold/30 transition-all"
              >
                <div className="relative aspect-[3/4] bg-canvas-theme">
                  <Image
                    src={design.file_url}
                    alt={design.title || "Design"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-2 left-2 bg-gold text-[#0D1117] px-3 py-1 rounded-full text-xs font-bold">
                    #{design.rank}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground-theme text-sm mb-1">
                    {design.title || "Untitled"}
                  </h3>
                  <p className="text-xs text-muted-foreground-theme mb-3">
                    {design.designer_name}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground-theme font-bold">
                      {design.vote_count} votes
                    </span>
                    <span className="text-muted-foreground-theme">
                      {design.vote_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voter List */}
      <div className="bg-surface-theme border border-border-theme rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground-theme font-display mb-4">
          Voter Records ({data.voters.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-theme">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground-theme uppercase">
                  Voter
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground-theme uppercase">
                  Voted For
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground-theme uppercase">
                  Designer
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground-theme uppercase">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody>
              {data.voters.map((voter) => (
                <tr
                  key={voter.id}
                  className="border-b border-border-theme/50 hover:bg-canvas-theme/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-foreground-theme font-medium text-xs">
                        {voter.student_name}
                      </p>
                      <p className="text-muted-foreground-theme text-[11px] font-mono">
                        {voter.student_email}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-foreground-theme text-xs">
                    {voter.polo_submissions?.title || "Untitled"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground-theme text-xs">
                    {voter.polo_submissions?.student_name}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground-theme text-xs font-mono">
                    {new Date(voter.voted_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-theme border border-border-theme rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-foreground-theme font-display mb-4">
              Voting Configuration
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-foreground-theme">
                  Enable Voting
                </label>
                <button
                  onClick={() =>
                    setConfigForm({
                      ...configForm,
                      voting_enabled: !configForm.voting_enabled,
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    configForm.voting_enabled ? "bg-gold" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      configForm.voting_enabled ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-foreground-theme">
                  Allow Vote Changes
                </label>
                <button
                  onClick={() =>
                    setConfigForm({
                      ...configForm,
                      allow_vote_change: !configForm.allow_vote_change,
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    configForm.allow_vote_change ? "bg-gold" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      configForm.allow_vote_change ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="text-sm text-foreground-theme block mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={
                    configForm.voting_start_date
                      ? new Date(configForm.voting_start_date)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      voting_start_date: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-canvas-theme border border-border-theme text-foreground-theme text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-foreground-theme block mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={
                    configForm.voting_end_date
                      ? new Date(configForm.voting_end_date)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      voting_end_date: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-canvas-theme border border-border-theme text-foreground-theme text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                disabled={isSavingConfig}
                className="flex-1 py-2.5 px-4 rounded-xl bg-canvas-theme hover:bg-canvas-theme/80 text-foreground-theme text-sm font-medium transition-colors border border-border-theme disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-light text-[#0D1117] text-sm font-bold transition-colors disabled:opacity-50"
              >
                {isSavingConfig ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
