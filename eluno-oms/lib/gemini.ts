import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function predictBreachRisk(orderData: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Analyze this eyewear order and predict breach risk:
Order: ${JSON.stringify(orderData)}
Current stage: ${orderData.status}
Time elapsed: ${orderData.timeInStage} hours
Is reorder: ${orderData.is_reorder}
Store load: ${orderData.storeLoad} active orders

Return JSON: { "breach_probability": 0.0-1.0, "predicted_completion_date": "ISO date", "recommended_action": "string" }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      breach_probability: 0.5,
      predicted_completion_date: null,
      recommended_action: "Review manually",
    };
  }
}
