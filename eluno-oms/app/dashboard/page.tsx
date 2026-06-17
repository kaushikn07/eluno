"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OrdersTable from "@/components/OrdersTable";
import Filters from "@/components/Filters";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        },
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

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Eluno Order Management</h1>
      <Filters filters={filters} setFilters={setFilters} />
      <OrdersTable orders={orders} onRefresh={fetchOrders} />
    </div>
  );
}
