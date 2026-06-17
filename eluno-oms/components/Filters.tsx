"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface FiltersProps {
  filters: Record<string, string>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function Filters({ filters, setFilters }: FiltersProps) {
  const [lenses, setLenses] = useState<any[]>([]);

  // Fetch lens catalog to populate the dropdown dynamically
  useEffect(() => {
    async function fetchLenses() {
      const { data } = await supabase
        .from("lens_catalog")
        .select("id, lens_type, index, coating");
      if (data) setLenses(data);
    }
    fetchLenses();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      // If the user selects "All", remove the filter key entirely
      if (value === "") {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const statuses = [
    "order_placed",
    "inventory_check",
    "lens_sourcing",
    "lens_received",
    "lens_cutting",
    "coating",
    "qc_pending",
    "qc_pass",
    "qc_fail",
    "qc_escalated",
    "assembly",
    "dispatch",
    "delivered",
  ];

  const stores = ["Chennai", "Bangalore", "Online"];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end border border-gray-200">
      {/* Status Filter */}
      <div className="flex flex-col">
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
          Status
        </label>
        <select
          value={filters.status || ""}
          onChange={(e) => handleChange("status", e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 min-w-[160px]"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Store Filter */}
      <div className="flex flex-col">
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
          Store Location
        </label>
        <select
          value={filters.store || ""}
          onChange={(e) => handleChange("store", e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 min-w-[160px]"
        >
          <option value="">All Stores</option>
          {stores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Lens Type Filter */}
      <div className="flex flex-col">
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
          Lens Type
        </label>
        <select
          value={filters.lensType || ""}
          onChange={(e) => handleChange("lensType", e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 min-w-[200px]"
        >
          <option value="">All Lenses</option>
          {lenses.map((lens) => (
            <option key={lens.id} value={lens.id}>
              {lens.lens_type} • {lens.index} • {lens.coating}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Button */}
      <button
        onClick={clearFilters}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition border border-gray-300"
      >
        Clear All
      </button>
    </div>
  );
}
