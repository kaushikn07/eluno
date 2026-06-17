import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { analyzeOrderRisk } from "@/lib/breach-engine";
import { addDays } from "date-fns";
import { sendWhatsAppAlert } from "@/lib/twilio";
import { sendEmailAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST() {
  const { data: activeOrders } = await supabaseAdmin
    .from("orders")
    .select("*, lens_catalog(*)")
    .is("deleted_at", null)
    .neq("status", "delivered")
    .neq("status", "qc_escalated");

  let updatedCount = 0;

  for (const order of activeOrders || []) {
    // 1. Analyze Risk & Calculate Auto-Delay
    const analysis = await analyzeOrderRisk(order);

    // 2. Calculate new Expected Date (Anti-Compounding Logic)
    let newExpectedDate = new Date(order.expected_delivery_date);
    let addedDays = 0;

    if (
      analysis.autoDelayDays > 0 &&
      analysis.autoDelayDays > (order.total_delay_days || 0)
    ) {
      addedDays = analysis.autoDelayDays - (order.total_delay_days || 0);
      newExpectedDate = addDays(
        new Date(order.promised_delivery_date),
        analysis.autoDelayDays,
      );
    }

    // 3. Update Database
    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        breach_risk_score: analysis.score,
        breach_reason: analysis.reason,
        breach_method: analysis.method,
        expected_delivery_date: newExpectedDate.toISOString(),
        total_delay_days: (order.total_delay_days || 0) + addedDays,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (!error) updatedCount++;

    // 4. FIXED: Send Alerts for EVERY breach (Removed 24h cooldown)
    if (analysis.score > 0.7) {
      await sendAlerts(order, analysis);
    }
  }

  return NextResponse.json({
    scanned: activeOrders?.length || 0,
    updated: updatedCount,
  });
}

async function sendAlerts(order: any, analysis: any) {
  const { data: recipients } = await supabaseAdmin
    .from("ops_team_members")
    .select("*")
    .or(`store_location.eq.${order.store_location},store_location.is.null`);

  // FIXED: Format dates clearly to show Promised SLA vs Expected
  const promisedDate = new Date(
    order.promised_delivery_date,
  ).toLocaleDateString();
  const expectedDate = new Date(
    order.expected_delivery_date,
  ).toLocaleDateString();

  const message =
    `⚠️ SLA BREACH ALERT\n\n` +
    `Order: ${order.order_number}\n` +
    `Risk Level: ${Math.round(analysis.score * 100)}%\n\n` +
    `📅 Original SLA (Promised): ${promisedDate}\n` +
    `⏳ Current Expected Date: ${expectedDate}\n\n` +
    `AI Reason: ${analysis.reason}`;

  for (const recipient of recipients || []) {
    // Send WhatsApp
    const whatsappSent = await sendWhatsAppAlert(
      recipient.whatsapp_number,
      message,
    );
    if (whatsappSent) {
      await supabaseAdmin.from("alerts_log").insert({
        order_id: order.id,
        recipient_id: recipient.id,
        channel: "whatsapp",
        breach_risk_score: analysis.score,
        message_body: message,
      });
    }

    // Send Email
    const emailSent = await sendEmailAlert(
      recipient.email,
      `SLA Breach Alert: ${order.order_number}`,
      `<pre style="font-family: sans-serif; white-space: pre-wrap;">${message}</pre>`,
    );
    if (emailSent) {
      await supabaseAdmin.from("alerts_log").insert({
        order_id: order.id,
        recipient_id: recipient.id,
        channel: "email",
        breach_risk_score: analysis.score,
        message_body: message,
      });
    }
  }
}
