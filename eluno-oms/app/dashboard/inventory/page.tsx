"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Package } from "lucide-react";

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("lens_inventory")
        .select("*, lens_catalog(lens_type, index, coating)")
        .order("qty_in_stock", { ascending: true });
      if (data) setInventory(data);
    }
    fetch();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Lens Inventory
        </h1>
        <p className="text-slate-500 mt-1">
          Monitor stock levels and power ranges.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item) => {
          const isLow = item.qty_in_stock <= item.reorder_threshold;
          const percentage = Math.min(
            (item.qty_in_stock / (item.reorder_threshold * 3)) * 100,
            100,
          );
          return (
            <div
              key={item.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${isLow ? "bg-red-50" : "bg-indigo-50"}`}
                  >
                    <Package
                      className={isLow ? "text-red-600" : "text-indigo-600"}
                      size={18}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 capitalize">
                      {item.lens_catalog?.lens_type}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Index {item.lens_catalog?.index} •{" "}
                      {item.lens_catalog?.coating}
                    </p>
                  </div>
                </div>
                {isLow && <AlertCircle className="text-red-500" size={18} />}
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {item.qty_in_stock}
                  </span>
                  <span className="text-xs text-slate-500">units</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${isLow ? "bg-red-500" : "bg-indigo-600"}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                Sph: {item.sph_min} to {item.sph_max} | Cyl: {item.cyl_min} to{" "}
                {item.cyl_max}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
