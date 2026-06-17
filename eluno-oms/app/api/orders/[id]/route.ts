import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server"; // 👈 CHANGED IMPORT
import { addDays } from "date-fns";
import { analyzeOrderRisk } from "@/lib/breach-engine";
import { VALID_TRANSITIONS } from "@/lib/workflow";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  // 1. Parse incoming payload from the Modal
  const { status, remark, expected_version } = await request.json();

  // 2. Fetch the current order (join with lens_catalog so the AI engine has context)
  const { data: order, error: fetchError } = await supabaseAdmin // 👈 CHANGED
    .from("orders")
    .select("*, lens_catalog(*)")
    .eq("id", params.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // 3. STRICT AUDIT TRAIL VALIDATION
  // Ensure the user is only moving to a valid next step defined in workflow.ts
  const allowedNextStatuses = VALID_TRANSITIONS[order.status] || [];
  if (!allowedNextStatuses.includes(status)) {
    return NextResponse.json(
      {
        error: `Invalid transition: Cannot move from '${order.status}' to '${status}'.`,
      },
      { status: 400 },
    );
  }

  // 4. RUN AI/MATH ENGINE AGAINST THE *NEW* STATE
  // We pass a temporary object with the updated status so the AI calculates against the new reality
  const updatedOrderState = { ...order, status, updated_at: new Date() };
  const analysis = await analyzeOrderRisk(updatedOrderState);

  // 5. CALCULATE ANCHORED DELAYS (Prevents infinite compounding)
  // We calculate the *total* required delay from the original promised date
  let requiredTotalDelay = Math.max(
    order.total_delay_days || 0,
    analysis.autoDelayDays || 0,
  );

  // If moving to qc_fail, enforce a minimum +2 days penalty on top of existing delays
  if (status === "qc_fail") {
    requiredTotalDelay = Math.max(
      requiredTotalDelay,
      (order.total_delay_days || 0) + 2,
    );
  }

  // Anchor the new expected date strictly to the promised date + total required delay
  const newExpectedDate = addDays(
    new Date(order.promised_delivery_date),
    requiredTotalDelay,
  );

  // 6. EXECUTE OPTIMISTIC-LOCKING UPDATE
  const { data, error } = await supabaseAdmin // 👈 CHANGED
    .from("orders")
    .update({
      status,
      expected_delivery_date: newExpectedDate.toISOString(),
      total_delay_days: requiredTotalDelay,
      breach_risk_score: analysis.score,
      breach_reason: analysis.reason,
      breach_method: analysis.method,
      updated_at: new Date().toISOString(),
      version: order.version + 1, // Bump version for optimistic locking
    })
    .eq("id", params.id)
    .eq("version", expected_version) // Enforce optimistic lock
    .is("deleted_at", null)
    .select()
    .single();

  // 7. HANDLE CONCURRENCY CONFLICTS
  if (error || !data) {
    return NextResponse.json(
      {
        error: "Conflict: Order was updated by another user. Please refresh.",
      },
      { status: 409 },
    );
  }

  // 8. LOG TO AUDIT TRAIL
  // The 'remark' from the modal popup is saved here for managers to review
  await supabaseAdmin.from("order_status_log").insert({
    // 👈 CHANGED
    order_id: params.id,
    from_status: order.status,
    to_status: status,
    changed_by: "dashboard_user",
    delay_reason: remark,
    version_at_change: data.version,
  });

  // 9. HANDLE QC FAIL RE-ORDER LOOP
  if (status === "qc_fail") {
    await handleQCFail(data);
  }

  return NextResponse.json(data);
}

// ==========================================
// QC FAIL RE-ORDER LOGIC
// ==========================================
async function handleQCFail(order: any) {
  const newFailCount = order.qc_fail_count + 1;

  // If we haven't hit the maximum allowed re-orders yet...
  if (newFailCount < order.max_reorder_attempts) {
    // Find the root parent ID (or use current ID if this is the first failure)
    const parentOrderId = order.parent_order_id || order.id;

    // Fetch catalog to get base SLA days for the fresh re-order
    const { data: catalog } = await supabaseAdmin // 👈 CHANGED
      .from("lens_catalog")
      .select("*")
      .eq("id", order.lens_catalog_id)
      .single();

    // A re-order gets a FRESH promised and expected date starting from TODAY
    const freshPromised = addDays(new Date(), catalog?.sla_days || 3);

    // Insert the new re-order row
    await supabaseAdmin.from("orders").insert({
      // 👈 CHANGED
      order_number: `${order.order_number}-R${newFailCount}`,
      source: order.source,
      store_location: order.store_location,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      frame_id: order.frame_id,
      lens_catalog_id: order.lens_catalog_id,
      sph_right: order.sph_right,
      cyl_right: order.cyl_right,
      axis_right: order.axis_right,
      sph_left: order.sph_left,
      cyl_left: order.cyl_left,
      axis_left: order.axis_left,
      pd: order.pd,
      add_power: order.add_power,
      fulfilment_mode: order.fulfilment_mode,
      status: "lens_cutting", // Restart the manufacturing process
      promised_delivery_date: freshPromised.toISOString(),
      expected_delivery_date: freshPromised.toISOString(),
      is_reorder: true,
      parent_order_id: parentOrderId, // Always points to the ROOT order
      qc_fail_count: newFailCount,
      max_reorder_attempts: order.max_reorder_attempts,
    });
  } else {
    // If we hit the cap, stop the loop and escalate to a human manager
    await supabaseAdmin // 👈 CHANGED
      .from("orders")
      .update({ status: "qc_escalated" })
      .eq("id", order.id);
  }
}
