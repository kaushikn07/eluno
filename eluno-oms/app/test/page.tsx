"use client";

import { useState } from "react";

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function runTATScan() {
    setLoading(true);
    setResult("Running AI Scan... (This takes a few seconds)");
    try {
      const res = await fetch("/api/tat-scan", { method: "POST" });
      const data = await res.json();
      setResult(
        `✅ Success! Scanned ${data.scanned} orders. Check your Supabase 'orders' table for 'breach_risk_score' updates!`,
      );
    } catch (e) {
      setResult("❌ Error running scan. Check terminal logs.");
    }
    setLoading(false);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">TAT & AI Testing Zone</h1>
      <p className="text-gray-600 mb-6">
        Click the button below to manually trigger the Gemini AI prediction
        engine. In production, this runs via Vercel Cron every 15 minutes.
      </p>

      <button
        onClick={runTATScan}
        disabled={loading}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Scanning..." : "Run TAT Scan & AI Prediction"}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-white border rounded-lg shadow-sm">
          {result}
        </div>
      )}
    </div>
  );
}
