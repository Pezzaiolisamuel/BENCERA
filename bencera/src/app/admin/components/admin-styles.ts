import type { CSSProperties } from "react";

type AdminStyles = {
  card: CSSProperties;
  label: CSSProperties;
  input: CSSProperties;
  textarea: CSSProperties;
  button: CSSProperties;
  softButton: CSSProperties;
};

export const adminStyles: AdminStyles = {
  card: {
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 18,
    boxShadow: "0 18px 60px rgba(0,0,0,0.08)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  label: {
    fontSize: 12,
    fontWeight: 650,
    opacity: 0.8,
    letterSpacing: 0.2,
  },
  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "0 12px",
    outline: "none",
    background: "rgba(255,255,255,0.9)",
    width: "100%",
  },
  textarea: {
    minHeight: 110,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "10px 12px",
    outline: "none",
    resize: "vertical",
    background: "rgba(255,255,255,0.9)",
    width: "100%",
  },
  button: {
    height: 44,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 750,
    background: "black",
    color: "white",
    padding: "0 14px",
  },
  softButton: {
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    cursor: "pointer",
    fontWeight: 650,
    background: "rgba(255,255,255,0.8)",
    padding: "0 14px",
  },
};
