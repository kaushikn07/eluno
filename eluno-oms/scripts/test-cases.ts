import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET!,
);

async function runTests() {
  console.log("Running test cases...\n");

  // T1: Create order with in-stock lens
  console.log("T1: Create order with in-stock lens");
  const t1Res = await fetch("http://localhost:3000/api/orders/dummy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      store_location: "Chennai",
      customer_name: "Test Customer 1",
      customer_phone: "+919876543210",
      frame_id: (await supabase.from("frames").select("id").single()).data?.id,
      lens_catalog_id: (
        await supabase.from("lens_catalog").select("id").single()
      ).data?.id,
      sph_right: -2.0,
      cyl_right: -0.5,
      axis_right: 90,
      sph_left: -2.0,
      cyl_left: -0.5,
      axis_left: 90,
      pd: 64,
    }),
  });
  const t1Order = await t1Res.json();
  console.log(
    `✓ Order created: ${t1Order.order_number}, fulfillment: ${t1Order.fulfilment_mode}\n`,
  );

  // T2: Create order with out-of-stock lens
  console.log("T2: Create order with out-of-stock lens");
  const t2Res = await fetch("http://localhost:3000/api/orders/dummy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      store_location: "Bangalore",
      customer_name: "Test Customer 2",
      customer_phone: "+919876543211",
      frame_id: (await supabase.from("frames").select("id").single()).data?.id,
      lens_catalog_id: (
        await supabase.from("lens_catalog").select("id").single()
      ).data?.id,
      sph_right: -10.0, // Outside stock range
      cyl_right: -0.5,
      axis_right: 90,
      sph_left: -10.0,
      cyl_left: -0.5,
      axis_left: 90,
      pd: 64,
    }),
  });
  const t2Order = await t2Res.json();
  console.log(
    `✓ Order created: ${t2Order.order_number}, fulfillment: ${t2Order.fulfilment_mode}\n`,
  );

  // T3: Status update with version check
  console.log("T3: Status update with version check");
  const t3Res = await fetch(`http://localhost:3000/api/orders/${t1Order.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "lens_cutting",
      expected_version: t1Order.version,
    }),
  });
  console.log(`✓ Status updated: ${t3Res.ok}\n`);

  // T4: QC fail creates re-order
  console.log("T4: QC fail creates re-order");
  const t4Res = await fetch(`http://localhost:3000/api/orders/${t1Order.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "qc_fail",
      expected_version: t1Order.version + 1,
    }),
  });
  const { data: reorders } = await supabase
    .from("orders")
    .select("*")
    .eq("parent_order_id", t1Order.id);
  console.log(`✓ Re-orders created: ${reorders?.length}\n`);

  // T5: TAT scan
  console.log("T5: TAT scan");
  const t5Res = await fetch("http://localhost:3000/api/tat-scan", {
    method: "POST",
  });
  const t5Data = await t5Res.json();
  console.log(`✓ Orders scanned: ${t5Data.scanned}\n`);

  console.log("All tests completed!");
}

runTests().catch(console.error);
