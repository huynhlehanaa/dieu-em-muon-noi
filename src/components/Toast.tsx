"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type,
  onClose,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  const icons = {
    success: "✓",
    error: "✗",
    info: "ℹ",
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 animate-slide-in-right"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div
        className={`${styles[type]} text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3 max-w-sm`}
      >
        <span
          className="text-lg font-black mt-0.5 flex-shrink-0"
          aria-hidden="true"
        >
          {icons[type]}
        </span>
        <p className="text-sm font-medium leading-relaxed flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors flex-shrink-0 text-xl leading-none mt-0.5"
          aria-label="Đóng thông báo"
        >
          ×
        </button>
      </div>
    </div>
  );
}
