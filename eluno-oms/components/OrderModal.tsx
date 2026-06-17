"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function OrderModal({ order, onClose, onUpdate }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!mounted) return null;

  console.log("🟣 Portal is attempting to render to document.body");

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "500px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          color: "black",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "16px",
            color: "#111",
          }}
        >
          🎉 UPDATE MODAL IS VISIBLE!
        </h2>
        <p style={{ marginBottom: "24px", color: "#555", lineHeight: "1.5" }}>
          If you can see this white box, the portal is working perfectly. The
          previous issue was Tailwind CSS failing to compile the{" "}
          <code>fixed</code> and <code>z-index</code> classes for this
          component.
        </p>
        <p style={{ marginBottom: "24px", fontSize: "14px" }}>
          Target Order:{" "}
          <strong style={{ color: "#4f46e5" }}>{order.order_number}</strong>
        </p>
        <button
          onClick={onClose}
          style={{
            backgroundColor: "#4f46e5",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Close This Test Modal
        </button>
      </div>
    </div>
  );

  // Teleport directly to the HTML body tag
  return createPortal(modalContent, document.body);
}
