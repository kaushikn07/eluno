import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkInventory } from "@/lib/inventory";

export async function POST(request: Request) {
  const orderData = await request.json();

  // Generate order number
  const orderNumber = `ELN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;

  // Get lens catalog for SLA
  const { data: catalog } = await supabase
    .from("lens_catalog")
    .select("*")
    .eq("id", orderData.lens_catalog_id)
    .single();

  // Check inventory
  const inventoryResult = await checkInventory(orderData);

  const slaDays =
    catalog.sla_days +
    (inventoryResult.fulfilment_mode === "sourcing_required" ? 3 : 0);
  const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      ...orderData,
      order_number: orderNumber,
      fulfilment_mode: inventoryResult.fulfilment_mode,
      status: "inventory_check",
      sla_deadline: slaDeadline,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });

  // Log initial status
  await supabase.from("order_status_log").insert({
    order_id: order.id,
    from_status: null,
    to_status: "inventory_check",
    changed_by: "system",
    version_at_change: order.version,
  });

  return NextResponse.json(order);
}
