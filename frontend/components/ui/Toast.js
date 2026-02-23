/**
 * Toast — Minimal notification system.
 * Usage: import { toast } from "@/components/ui/Toast";
 *        toast.success("Done!"); / toast.error("Oops");
 */
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styles = {
  success: "border-emerald-800/30 text-emerald-400",
  error: "border-red-800/30 text-red-400",
  info: "border-sky-800/30 text-sky-400",
};

let _addToast = () => {};

/** Imperative toast API */
export const toast = {
  success: (message) => _addToast("success", message),
  error: (message) => _addToast("error", message),
  info: (message) => _addToast("info", message),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  _addToast = addToast;

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={addToast}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3",
                "bg-[#130007]/95 backdrop-blur-md shadow-lg shadow-black/30",
                "animate-slide-down",
                styles[t.type]
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="text-sm text-foreground">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-2 p-0.5 text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
