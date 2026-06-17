// lib/workflow.ts
export const VALID_TRANSITIONS: Record<string, string[]> = {
  order_placed: ["inventory_check"],
  inventory_check: ["lens_sourcing", "lens_cutting"], // sourcing if out of stock, cutting if in-house
  lens_sourcing: ["lens_received"],
  lens_received: ["lens_cutting"],
  lens_cutting: ["coating", "qc_fail"],
  coating: ["qc_pending", "qc_fail"],
  qc_pending: ["qc_pass", "qc_fail"],
  qc_pass: ["assembly"],
  assembly: ["dispatch"],
  dispatch: ["delivered"],
  qc_fail: [], // Terminal for this row (API spawns the re-order)
  qc_escalated: [], // Terminal
  delivered: [], // Terminal
};

export const STATUS_LABELS: Record<string, string> = {
  order_placed: "Order Placed",
  inventory_check: "Inventory Check",
  lens_sourcing: "Lens Sourcing",
  lens_received: "Lens Received",
  lens_cutting: "Lens Cutting",
  coating: "Coating",
  qc_pending: "QC Pending",
  qc_pass: "QC Pass",
  qc_fail: "QC Fail (Trigger Re-order)",
  assembly: "Assembly",
  dispatch: "Dispatch",
  delivered: "Delivered",
  qc_escalated: "QC Escalated",
};
