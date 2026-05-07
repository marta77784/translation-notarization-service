"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export function dispatchToast(message: string, type: ToastType = "info") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("legaldocs:toast", { detail: { message, type } }));
  }
}

export function dispatchNotification() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("legaldocs:notification"));
  }
}

const ICONS = {
  success: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const STYLES: Record<ToastType, string> = {
  success: "bg-emerald-700 text-white",
  error: "bg-red-600 text-white",
  info: "bg-slate-900 text-white",
};

export default function Toast() {
  const [toasts, setToasts] = useState<(ToastItem & { visible: boolean })[]>([]);

  useEffect(() => {
    function handler(e: Event) {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type, visible: false }]);
      setTimeout(() => {
        setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: true } : t));
      }, 10);
      setTimeout(() => {
        setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: false } : t));
      }, 3800);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    }
    window.addEventListener("legaldocs:toast", handler);
    return () => window.removeEventListener("legaldocs:toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium max-w-sm transition-all duration-300 ${STYLES[toast.type]} ${
            toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {ICONS[toast.type]}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
