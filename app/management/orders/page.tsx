"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Package,
  FileSpreadsheet,
  X,
  Phone,
  Mail,
  GraduationCap,
  Layers,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import type { MerchOrderRow, MerchOrderStatus, MerchPaymentStatus, PoloShirtSize } from "@/lib/supabase";
import FormField, { inputStyles, textareaStyles } from "../_components/FormField";
import { MerchOrdersTableSkeleton } from "../_components/SkeletonPreloader";

const STATUS_CONFIG: Record<
  MerchOrderStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  processing: {
    label: "Processing",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    icon: Clock,
  },
  ordered: {
    label: "Ordered (Production)",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    icon: Layers,
  },
  ready_for_pickup: {
    label: "Ready for Pick Up",
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
    icon: Package,
  },
  completed: {
    label: "Claimed / Completed",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/30",
    icon: X,
  },
};

export default function MerchOrdersManagementPage() {
  const [orders, setOrders] = useState<MerchOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<MerchOrderRow | null>(null);
  const [receiptImageLoading, setReceiptImageLoading] = useState(true);

  // Edit Order State
  const [editingOrder, setEditingOrder] = useState<MerchOrderRow | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MerchOrderRow>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Order State
  const [deletingOrder, setDeletingOrder] = useState<MerchOrderRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getSessionToken = useCallback(() => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("psits_mgmt_token") ||
      sessionStorage.getItem("psits_mgmt_token") ||
      ""
    );
  }, []);

  // Fetch all orders on demand (e.g. manual refresh)
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const token = getSessionToken();
    try {
      const res = await fetch("/api/merch/orders?all=true", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [getSessionToken]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("psits_mgmt_token") ||
          sessionStorage.getItem("psits_mgmt_token") ||
          ""
        : "";

    async function load() {
      try {
        const res = await fetch("/api/merch/orders?all=true", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle status update
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: MerchOrderStatus,
    paymentStatus?: "verified" | "pending_verification" | "rejected"
  ) => {
    setUpdatingId(orderId);
    const token = getSessionToken();
    try {
      const res = await fetch(`/api/merch/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          ...(paymentStatus ? { payment_status: paymentStatus } : {}),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
          );
          if (selectedReceiptOrder?.id === orderId) {
            setSelectedReceiptOrder((prev) => (prev ? { ...prev, ...data.order } : null));
          }
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    setIsDeleting(true);
    const token = getSessionToken();
    try {
      const res = await fetch(`/api/merch/orders/${orderId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setDeletingOrder(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete order.");
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("An unexpected error occurred while deleting the order.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setIsSavingEdit(true);
    setEditError(null);
    const token = getSessionToken();

    try {
      const res = await fetch(`/api/merch/orders/${editingOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save order changes.");
      }

      if (data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === editingOrder.id ? { ...o, ...data.order } : o))
        );
        if (selectedReceiptOrder?.id === editingOrder.id) {
          setSelectedReceiptOrder(data.order);
        }
        setEditingOrder(null);
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error saving changes.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = orders.length;
    const processing = orders.filter((o) => o.status === "processing").length;
    const ordered = orders.filter((o) => o.status === "ordered").length;
    const ready = orders.filter((o) => o.status === "ready_for_pickup").length;
    const completed = orders.filter((o) => o.status === "completed").length;
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, curr) => acc + (Number(curr.total_amount) || 475), 0);

    const sizeTallies: Record<PoloShirtSize, number> = {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
    };
    orders.forEach((o) => {
      if (o.status !== "cancelled" && sizeTallies[o.size] !== undefined) {
        sizeTallies[o.size]++;
      }
    });

    return { total, processing, ordered, ready, completed, totalRevenue, sizeTallies };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (sizeFilter !== "all" && order.size !== sizeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = order.student_name?.toLowerCase().includes(q);
        const matchEmail = order.student_email?.toLowerCase().includes(q);
        const matchCourse = order.course_year?.toLowerCase().includes(q);
        const matchId = order.id?.toLowerCase().includes(q);
        const matchContact = order.contact_number?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCourse && !matchId && !matchContact) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, sizeFilter, searchQuery]);

  // Export orders to CSV for tailoring manufacturing
  const handleExportCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      "Order ID",
      "Student Name",
      "Student Email",
      "Course & Section",
      "Contact Number",
      "Shirt Size",
      "Quantity",
      "Unit Price (PHP)",
      "Total (PHP)",
      "Order Status",
      "Payment Status",
      "Student Notes",
      "Date Placed",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${o.student_name.replace(/"/g, '""')}"`,
      `"${o.student_email}"`,
      `"${(o.course_year || "").replace(/"/g, '""')}"`,
      `"${(o.contact_number || "").replace(/"/g, '""')}"`,
      `"${o.size}"`,
      o.quantity,
      o.unit_price,
      o.total_amount,
      `"${o.status}"`,
      `"${o.payment_status}"`,
      `"${(o.notes || "").replace(/"/g, '""')}"`,
      `"${new Date(o.created_at).toLocaleString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PSITS_CCIS_Polo_Orders_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
              Merch Store Orders
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Monitor and manage official department polo shirt orders (AY 2026–2027 Winning Design:{" "}
            <span className="font-semibold text-slate-900 dark:text-white">NEXGEN TECHTORCH</span>).
            Verify payment receipts and update fulfillment pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-xs font-medium text-slate-900 dark:text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Download CSV size tally for tailor/manufacturing"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-xs font-medium text-slate-900 dark:text-white transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-medium font-mono uppercase">Total Orders</span>
            <ShoppingBag className="w-3.5 h-3.5 text-gold" />
          </div>
          {loading && orders.length === 0 ? (
            <div className="w-12 h-8 bg-slate-200 dark:bg-white/[0.08] rounded animate-pulse my-0.5" />
          ) : (
            <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">{metrics.total}</p>
          )}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">1 per student account</p>
        </div>

        <div className="bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-[11px] font-medium font-mono uppercase">Processing</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          {loading && orders.length === 0 ? (
            <div className="w-12 h-8 bg-amber-500/15 rounded animate-pulse my-0.5" />
          ) : (
            <p className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
              {metrics.processing}
            </p>
          )}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting verification</p>
        </div>

        <div className="bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-blue-500 mb-1">
            <span className="text-[11px] font-medium font-mono uppercase">In Production</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          {loading && orders.length === 0 ? (
            <div className="w-12 h-8 bg-blue-500/15 rounded animate-pulse my-0.5" />
          ) : (
            <p className="text-2xl font-bold font-display text-blue-600 dark:text-blue-400">
              {metrics.ordered}
            </p>
          )}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Sent to tailor</p>
        </div>

        <div className="bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-purple-500 mb-1">
            <span className="text-[11px] font-medium font-mono uppercase">Ready Pick Up</span>
            <Package className="w-3.5 h-3.5" />
          </div>
          {loading && orders.length === 0 ? (
            <div className="w-12 h-8 bg-purple-500/15 rounded animate-pulse my-0.5" />
          ) : (
            <p className="text-2xl font-bold font-display text-purple-600 dark:text-purple-400">
              {metrics.ready}
            </p>
          )}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">At PSITS office</p>
        </div>

        <div className="bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-500 mb-1">
            <span className="text-[11px] font-medium font-mono uppercase">Claimed</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          {loading && orders.length === 0 ? (
            <div className="w-12 h-8 bg-emerald-500/15 rounded animate-pulse my-0.5" />
          ) : (
            <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              {metrics.completed}
            </p>
          )}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Successfully received</p>
        </div>

        <div className="bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-gold mb-1">
            <span className="text-[11px] font-medium font-mono uppercase">Total Revenue</span>
            <span className="text-xs font-bold font-mono">₱</span>
          </div>
          {loading && orders.length === 0 ? (
            <div className="w-24 h-7 bg-gold/15 rounded animate-pulse my-0.5" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
              ₱{metrics.totalRevenue.toLocaleString()}
            </p>
          )}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">₱475 × {metrics.total - orders.filter(o => o.status === 'cancelled').length}</p>
        </div>
      </div>

      {/* Sizing Tally Bar */}
      <div className="bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Manufacturing Size Breakdown (Active Orders)
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Total Shirts: {metrics.total - orders.filter(o => o.status === 'cancelled').length}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2 pt-1">
          {(["XS", "S", "M", "L", "XL", "XXL"] as PoloShirtSize[]).map((sz) => (
            <div
              key={sz}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10"
            >
              <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{sz}</span>
              {loading && orders.length === 0 ? (
                <span className="w-6 h-5 bg-gold/20 rounded animate-pulse mt-0.5" />
              ) : (
                <span className="text-base font-extrabold font-display text-gold">
                  {metrics.sizeTallies[sz]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, institutional email, section, or order ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0a0e17] border border-black/10 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0a0e17] border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">All Status ({orders.length})</option>
              <option value="processing" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Processing ({metrics.processing})</option>
              <option value="ordered" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Ordered ({metrics.ordered})</option>
              <option value="ready_for_pickup" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Ready for Pickup ({metrics.ready})</option>
              <option value="completed" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Completed ({metrics.completed})</option>
              <option value="cancelled" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0a0e17] border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Size:</span>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">All Sizes</option>
              <option value="XS" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">XS</option>
              <option value="S" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">S</option>
              <option value="M" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">M</option>
              <option value="L" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">L</option>
              <option value="XL" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">XL</option>
              <option value="XXL" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">XXL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading && orders.length === 0 ? (
        <MerchOrdersTableSkeleton rows={6} />
      ) : (
        <div className="bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-xs">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
              <ShoppingBag className="w-8 h-8 opacity-40 text-gold" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">No merch orders found</p>
              <p className="text-xs max-w-sm">
                {searchQuery || statusFilter !== "all" || sizeFilter !== "all"
                  ? "No matching orders found with current filter criteria."
                  : "No students have placed polo shirt orders yet. Orders will appear here as soon as submitted."}
              </p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course & Section</th>
                  <th className="py-3 px-4 text-center">Size</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Pipeline Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-body">
                {filteredOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
                  const StatusIcon = cfg.icon;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white font-display text-[13px]">
                          {order.student_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{order.student_email}</span>
                        </div>
                        {order.contact_number && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{order.contact_number}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="mt-1 text-[11px] text-slate-700 dark:text-slate-300 italic bg-slate-100 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 p-1.5 rounded max-w-xs">
                            &ldquo;{order.notes}&rdquo;
                          </div>
                        )}
                      </td>

                      {/* Course / Year */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {order.course_year ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
                            <GraduationCap className="w-3 h-3" />
                            <span>{order.course_year}</span>
                          </span>
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-gold/15 text-gold border border-gold/30">
                          {order.size}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white text-[12px]">
                        ₱{order.total_amount || 475}
                      </td>

                      {/* Receipt */}
                      <td className="py-3 px-4 text-center">
                        {order.receipt_key &&
                        order.receipt_key !== "pending_upload" &&
                        order.receipt_url &&
                        order.receipt_url !== "/api/merch/orders/pending" ? (
                          <button
                            onClick={() => {
                              setSelectedReceiptOrder(order);
                              setReceiptImageLoading(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-white dark:bg-[#0a0e17] border border-black/10 dark:border-white/10 hover:border-gold text-slate-900 dark:text-white hover:text-gold transition-colors cursor-pointer shadow-xs"
                            title="Inspect uploaded payment receipt"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            Awaiting
                          </span>
                        )}
                      </td>

                      {/* Payment Verification Status */}
                      <td className="py-3 px-4">
                        {order.payment_status === "verified" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Pipeline Status Dropdown */}
                      <td className="py-3 px-4">
                        <div className="relative inline-flex items-center gap-1.5">
                          <StatusIcon className={`w-3.5 h-3.5 ${cfg.text} shrink-0`} />
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) =>
                              handleUpdateStatus(
                                order.id,
                                e.target.value as MerchOrderStatus,
                                e.target.value === "ordered" || e.target.value === "ready_for_pickup"
                                  ? "verified"
                                  : undefined
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} focus:outline-none cursor-pointer disabled:opacity-50`}
                          >
                            <option value="processing" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Processing</option>
                            <option value="ordered" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Ordered (Production)</option>
                            <option value="ready_for_pickup" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Ready for Pick Up</option>
                            <option value="completed" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Completed / Claimed</option>
                            <option value="cancelled" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOrder(order);
                              setEditFormData({
                                size: order.size,
                                quantity: order.quantity,
                                total_amount: order.total_amount,
                                course_year: order.course_year || "",
                                contact_number: order.contact_number || "",
                                notes: order.notes || "",
                                status: order.status,
                                payment_status: order.payment_status,
                              });
                              setEditError(null);
                            }}
                            className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:border-gold/50 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-900 dark:text-white transition-colors cursor-pointer"
                            title="Edit Order Details"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hover:text-gold" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(order)}
                            className="p-1.5 rounded-lg border border-rose-500/20 hover:border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/15 text-rose-500 transition-colors cursor-pointer"
                            title="Delete Order Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {order.payment_status !== "verified" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, order.status, "verified")
                              }
                              disabled={updatingId === order.id}
                              className="px-2 py-1 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                              title="Verify receipt payment"
                            >
                              Verify
                            </button>
                          )}
                          {order.status === "processing" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, "ordered", "verified")
                              }
                              disabled={updatingId === order.id}
                              className="px-2 py-1 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
                              title="Mark as sent to manufacturer"
                            >
                              Order
                            </button>
                          )}
                          {order.status === "ordered" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, "ready_for_pickup")
                              }
                              disabled={updatingId === order.id}
                              className="px-2 py-1 rounded text-[11px] font-mono font-medium bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 transition-colors cursor-pointer"
                              title="Mark as arrived at office ready for pickup"
                            >
                              Ready
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Receipt Preview Modal */}
      {selectedReceiptOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedReceiptOrder(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-[#0e1422] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#0a0e17]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Payment Receipt Verification</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
                      Size: {selectedReceiptOrder.size}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/60 font-mono mt-0.5">
                    Student: {selectedReceiptOrder.student_name} ({selectedReceiptOrder.student_email})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Image Viewer */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
              <div className="relative min-h-[300px] max-h-[480px] bg-slate-100 dark:bg-black/50 rounded-xl overflow-hidden flex items-center justify-center border border-black/10 dark:border-white/10">
                {receiptImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-gold" />
                  </div>
                )}
                {/* Image proxy URL */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/merch/orders/${selectedReceiptOrder.id}/receipt${
                    getSessionToken() ? `?token=${encodeURIComponent(getSessionToken())}` : ""
                  }`}
                  alt="Student Official Payment Receipt"
                  className="max-w-full max-h-[460px] object-contain rounded-lg"
                  onLoad={() => setReceiptImageLoading(false)}
                  onError={() => setReceiptImageLoading(false)}
                />
              </div>
            </div>

            {/* Modal Details & Quick Status Updater Footer */}
            <div className="px-5 py-4 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-slate-50 dark:bg-[#0a0e17]">
              <div className="text-xs font-mono text-slate-600 dark:text-white/70">
                <span>Amount Due: </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  ₱{selectedReceiptOrder.total_amount || 475}
                </span>
                <span className="mx-2">·</span>
                <span>Payment: </span>
                <span
                  className={
                    selectedReceiptOrder.payment_status === "verified"
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-amber-600 dark:text-amber-400 font-semibold"
                  }
                >
                  {selectedReceiptOrder.payment_status === "verified"
                    ? "Verified"
                    : "Pending Verification"}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedReceiptOrder.payment_status !== "verified" ? (
                  <button
                    onClick={() => {
                      handleUpdateStatus(
                        selectedReceiptOrder.id,
                        selectedReceiptOrder.status,
                        "verified"
                      );
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Mark Payment Verified
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleUpdateStatus(
                        selectedReceiptOrder.id,
                        selectedReceiptOrder.status,
                        "pending_verification"
                      );
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Unverify
                  </button>
                )}

                <button
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-medium bg-white dark:bg-[#121929] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setEditingOrder(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#0e1422] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#0a0e17]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Edit Order Details</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
                      #{editingOrder.id.slice(0, 8).toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/60 font-mono mt-0.5">
                    {editingOrder.student_name} ({editingOrder.student_email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1 font-mono text-xs scrollbar-minimal bg-white dark:bg-[#0e1422]">
                {editError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Size / Breakdown" required>
                    <input
                      type="text"
                      required
                      value={editFormData.size || ""}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, size: e.target.value }))}
                      placeholder="e.g. M or 2x M, 1x L"
                      className={inputStyles}
                    />
                  </FormField>

                  <FormField label="Quantity" required>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editFormData.quantity || 1}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value, 10) || 1;
                        setEditFormData((prev) => ({
                          ...prev,
                          quantity: qty,
                          total_amount: qty * 475,
                        }));
                      }}
                      className={inputStyles}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Total Amount (₱)" required>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={editFormData.total_amount || 475}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))
                      }
                      className={inputStyles}
                    />
                  </FormField>

                  <FormField label="Course & Section" required>
                    <input
                      type="text"
                      required
                      value={editFormData.course_year || ""}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, course_year: e.target.value }))}
                      placeholder="e.g. BSIT 2D"
                      className={inputStyles}
                    />
                  </FormField>
                </div>

                <FormField label="Contact Number">
                  <input
                    type="text"
                    value={editFormData.contact_number || ""}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, contact_number: e.target.value }))}
                    placeholder="e.g. 09123456789"
                    className={inputStyles}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Pipeline Status">
                    <select
                      value={editFormData.status || "processing"}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, status: e.target.value as MerchOrderStatus }))
                      }
                      className={`${inputStyles} cursor-pointer`}
                    >
                      <option value="processing" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Processing</option>
                      <option value="ordered" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Ordered (Production)</option>
                      <option value="ready_for_pickup" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Ready for Pick Up</option>
                      <option value="completed" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Completed / Claimed</option>
                      <option value="cancelled" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Cancelled</option>
                    </select>
                  </FormField>

                  <FormField label="Payment Status">
                    <select
                      value={editFormData.payment_status || "pending_verification"}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, payment_status: e.target.value as MerchPaymentStatus }))
                      }
                      className={`${inputStyles} cursor-pointer`}
                    >
                      <option value="pending_verification" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Pending Verification</option>
                      <option value="verified" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Verified</option>
                      <option value="rejected" className="bg-white dark:bg-[#0e1422] text-slate-900 dark:text-white">Rejected</option>
                    </select>
                  </FormField>
                </div>

                <FormField label="Order Note">
                  <textarea
                    rows={2}
                    value={editFormData.notes || ""}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Order note or special instructions"
                    className={textareaStyles}
                  />
                </FormField>
              </div>

              {/* Form Actions Pinned Footer */}
              <div className="px-5 py-4 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50 dark:bg-[#0a0e17]">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-[#0D1117] font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Dialog */}
      {deletingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDeletingOrder(null)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#0e1422] border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Delete Order #{deletingOrder.id.slice(0, 8).toUpperCase()}?
              </h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Student: <strong className="text-slate-900 dark:text-white">{deletingOrder.student_name}</strong> ({deletingOrder.student_email})
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will permanently delete this order from the database and remove any uploaded receipt from the vault. This action <span className="text-rose-500 font-bold">cannot be undone</span>.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingOrder(null)}
                className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 font-mono text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteOrder(deletingOrder.id)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
