"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OrdersTable from "@/components/OrdersTable";
import Filters from "@/components/Filters";
import { Package, AlertTriangle, Clock } from "lucide-react";

export default function OrdersDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        fetchOrders,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters]);

  async function fetchOrders() {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data);
  }

  const activeCount = orders.filter((o) => o.status !== "delivered").length;
  const breachCount = orders.filter((o) => o.breach_risk_score >= 0.7).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Active Orders
        </h1>
        <p className="text-slate-500 mt-1">
          Monitor and manage ongoing manufacturing workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Package className="text-indigo-600" size={18} />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Total Active
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="text-red-600" size={18} />
            </div>
            <span className="text-sm font-medium text-slate-500">
              High Breach Risk
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{breachCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="text-amber-600" size={18} />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Pending QC
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {orders.filter((o) => o.status === "qc_pending").length}
          </p>
        </div>
      </div>

      <Filters filters={filters} setFilters={setFilters} />
      <OrdersTable orders={orders} onRefresh={fetchOrders} />
    </div>
  );
}
