"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Clock, BrainCircuit, Calculator } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function BreachesDashboard() {
  const [breaches, setBreaches] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("orders")
        .select("*, lens_catalog(lens_type, index)")
        .is("deleted_at", null)
        .neq("status", "delivered")
        .or("breach_risk_score.gte.0.6,expected_delivery_date.lte.now")
        .order("breach_risk_score", { ascending: false });
      if (data) setBreaches(data);
    }
    fetch();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Breach Risk Center
        </h1>
        <p className="text-slate-500 mt-1">
          AI-analyzed orders at risk of missing SLA deadlines.
        </p>
      </div>

      {breaches.length === 0 ? (
        <div className="bg-green-50 border border-green-100 text-green-800 p-12 rounded-xl text-center">
          <p className="font-semibold">
            All systems nominal. No high-risk orders detected.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {breaches.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-slate-900">
                    {order.order_number}
                  </span>
                  <span className="bg-red-50 text-red-700 text-xs font-bold px-2 py-1 rounded-full border border-red-100">
                    {Math.round((order.breach_risk_score || 0) * 100)}% RISK
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {order.breach_method === "hybrid_ai" ? (
                      <>
                        <BrainCircuit size={12} className="text-indigo-600" />{" "}
                        AI Analyzed
                      </>
                    ) : (
                      <>
                        <Calculator size={12} /> Math Rule
                      </>
                    )}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  {order.lens_catalog?.lens_type} ({order.lens_catalog?.index})
                  • Stuck in{" "}
                  <span className="font-semibold text-slate-900">
                    {order.status.replace(/_/g, " ")}
                  </span>
                </p>
                {order.breach_reason && (
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-900 italic">
                    "{order.breach_reason}"
                  </div>
                )}
              </div>
              <div className="text-right flex flex-col justify-center md:border-l md:border-slate-100 md:pl-6">
                <div className="flex items-center justify-end gap-1 text-amber-600 text-sm font-medium mb-1">
                  <Clock size={14} />{" "}
                  {formatDistanceToNow(new Date(order.expected_delivery_date), {
                    addSuffix: true,
                  })}
                </div>
                <div className="text-xs text-slate-400">
                  Expected:{" "}
                  {new Date(order.expected_delivery_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
