import { supabase } from "./supabase";
import { differenceInHours, differenceInDays } from "date-fns";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 1. Baseline hours allocated per stage in the standard SLA
const STAGE_BASELINES: Record<string, number> = {
  order_placed: 2,
  inventory_check: 4,
  lens_sourcing: 72,
  lens_received: 12,
  lens_cutting: 24, // Baseline: 1 day
  coating: 24,
  qc_pending: 12,
  qc_pass: 4,
  assembly: 12,
  dispatch: 24,
};

export async function analyzeOrderRisk(order: any) {
  const baselineHours = STAGE_BASELINES[order.status] || 24;
  const hoursInStage = differenceInHours(
    new Date(),
    new Date(order.updated_at),
  );
  const hoursUntilExpected = differenceInHours(
    new Date(order.expected_delivery_date),
    new Date(),
  );

  let deterministicScore = 0.0;
  let mathDelayDays = 0;

  // --- MATH PART 1: Stage Overrun ---
  // If cutting takes 2 days (48h) but baseline is 1 day (24h), overrun is 24h (1 day)
  if (hoursInStage > baselineHours) {
    const overrunHours = hoursInStage - baselineHours;
    deterministicScore += Math.min(overrunHours / 48, 0.4);
    mathDelayDays += Math.ceil(overrunHours / 24);
  }

  // --- MATH PART 2: Historical Lens/ Vendor Buffer ---
  // Look at past delivered orders for this exact lens type to find structural delays
  const { data: pastOrders } = await supabase
    .from("orders")
    .select("updated_at, promised_delivery_date, created_at")
    .eq("lens_catalog_id", order.lens_catalog_id)
    .eq("status", "delivered")
    .limit(30);

  let historicalBuffer = 0;
  if (pastOrders && pastOrders.length > 5) {
    const totalOverruns = pastOrders.reduce((acc, o) => {
      const promisedDays = differenceInDays(
        new Date(o.promised_delivery_date),
        new Date(o.created_at),
      );
      const actualDays = differenceInDays(
        new Date(o.updated_at),
        new Date(o.created_at),
      );
      return acc + Math.max(0, actualDays - promisedDays);
    }, 0);

    historicalBuffer = Math.ceil(totalOverruns / pastOrders.length);

    // If this lens historically always runs late by 2 days, and we haven't buffered it yet
    if (
      historicalBuffer > 0 &&
      (order.total_delay_days || 0) < historicalBuffer
    ) {
      mathDelayDays += historicalBuffer - (order.total_delay_days || 0);
      deterministicScore += 0.2;
    }
  }

  // --- MATH PART 3: Deadline Proximity ---
  if (hoursUntilExpected < 0) deterministicScore += 0.5;
  else if (hoursUntilExpected < 24) deterministicScore += 0.2;

  // If math score is extremely high, skip AI to save time
  if (deterministicScore >= 0.85) {
    return {
      score: Math.min(deterministicScore, 1.0),
      reason: `Critical delay: Stage overrun (+${Math.ceil((hoursInStage - baselineHours) / 24)}d) and historical lens buffer (+${historicalBuffer}d).`,
      method: "deterministic",
      autoDelayDays: mathDelayDays,
    };
  }

  // --- AI PART: Pattern Recognition ---
  try {
    const { count: storeLoad } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("store_location", order.store_location)
      .neq("status", "delivered")
      .is("deleted_at", null);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert supply chain risk analyst.
Analyze this order to predict SLA breach probability and required delivery date extension.

CURRENT ORDER:
- Lens: ${order.lens_catalog?.lens_type} (Index: ${order.lens_catalog?.index})
- Current Stage: ${order.status} (Stuck for ${hoursInStage}h, Baseline is ${baselineHours}h)
- Re-order chain: ${order.is_reorder ? "Yes" : "No"} (Attempt ${order.qc_fail_count})
- Hours until Expected Delivery: ${hoursUntilExpected}
- Total delay days already added: ${order.total_delay_days || 0}

HISTORICAL CONTEXT:
- Historical Breach Rate for this lens: ${pastOrders ? ((pastOrders.filter((o) => new Date(o.updated_at) > new Date(o.promised_delivery_date)).length / pastOrders.length) * 100).toFixed(1) : 0}%
- Average historical overrun for this lens: ${historicalBuffer} days
- Active orders at ${order.store_location}: ${storeLoad || 0}

Look for patterns. E.g., If historical buffer is 2 days, and current stage is cutting (which takes 2 days instead of 1), recommend pushing the date.

Return ONLY valid JSON:
{
  "breach_probability": 0.00,
  "reason": "Brief, specific reason based on patterns.",
  "auto_delay_days": 0 // Integer. How many TOTAL days to push the expected delivery date based on patterns.
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);

    const aiAnalysis = JSON.parse(text);

    let finalScore = deterministicScore;
    let finalDelayDays = mathDelayDays;

    if (pastOrders && pastOrders.length > 5) {
      finalScore =
        deterministicScore * 0.3 + aiAnalysis.breach_probability * 0.7;
      // AI can override the math delay if it spots a deeper pattern
      if (aiAnalysis.auto_delay_days > mathDelayDays) {
        finalDelayDays = aiAnalysis.auto_delay_days;
      }
    }

    return {
      score: Math.min(parseFloat(finalScore.toFixed(2)), 1.0),
      reason: aiAnalysis.reason,
      method: "hybrid_ai",
      autoDelayDays: finalDelayDays,
    };
  } catch (error) {
    return {
      score: deterministicScore,
      reason: `AI unavailable. Risk based on stage overrun (+${Math.ceil((hoursInStage - baselineHours) / 24)}d) and historical buffer.`,
      method: "deterministic",
      autoDelayDays: mathDelayDays,
    };
  }
}
