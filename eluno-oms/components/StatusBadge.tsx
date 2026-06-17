"use client";

export default function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    order_placed: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      label: "Order Placed",
    },
    inventory_check: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      label: "Inventory Check",
    },
    lens_sourcing: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      label: "Sourcing",
    },
    lens_received: {
      bg: "bg-green-50",
      text: "text-green-700",
      label: "Received",
    },
    lens_cutting: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      label: "Cutting",
    },
    coating: { bg: "bg-purple-50", text: "text-purple-700", label: "Coating" },
    qc_pending: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      label: "QC Pending",
    },
    qc_pass: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      label: "QC Pass",
    },
    qc_fail: { bg: "bg-red-50", text: "text-red-700", label: "QC Fail" },
    qc_escalated: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Escalated",
    },
    assembly: { bg: "bg-cyan-50", text: "text-cyan-700", label: "Assembly" },
    dispatch: { bg: "bg-pink-50", text: "text-pink-700", label: "Dispatch" },
    delivered: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Delivered",
    },
  };

  const config = configs[status] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
