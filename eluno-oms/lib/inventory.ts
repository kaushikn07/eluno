import { supabase } from "./supabase";

export async function checkInventory(order: any) {
  const { data: inventory, error } = await supabase
    .from("lens_inventory")
    .select("*, lens_catalog(*)")
    .eq("lens_catalog_id", order.lens_catalog_id)
    .gte("sph_max", Math.max(order.sph_right, order.sph_left))
    .lte("sph_min", Math.min(order.sph_right, order.sph_left))
    .gte("cyl_max", Math.max(order.cyl_right, order.cyl_left))
    .lte("cyl_min", Math.min(order.cyl_right, order.cyl_left))
    .gt("qty_in_stock", 0)
    .single();

  if (error || !inventory) {
    return { fulfilment_mode: "sourcing_required", stock_decremented: false };
  }

  const { data: updated, error: updateError } = await supabase
    .from("lens_inventory")
    .update({ qty_in_stock: inventory.qty_in_stock - 1 })
    .eq("id", inventory.id)
    .gt("qty_in_stock", 0)
    .select()
    .single();

  if (updateError || !updated) {
    return { fulfilment_mode: "sourcing_required", stock_decremented: false };
  }

  return { fulfilment_mode: "in_house", stock_decremented: true };
}
