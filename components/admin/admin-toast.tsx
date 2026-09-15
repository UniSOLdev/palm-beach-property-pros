"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
  undo?: () => Promise<void>;
};

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
  toastWithUndo: (message: string, undo: () => Promise<void>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const toastWithUndo = useCallback((message: string, undo: () => Promise<void>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-2), { id, kind: "success", message, undo }]);
    window.setTimeout(() => dismiss(id), 8000);
  }, [dismiss]);

  const value = useMemo(() => ({ toast, toastWithUndo }), [toast, toastWithUndo]);

  const kindClass: Record<ToastKind, string> = {
    success: "bg-leaf/90 text-white",
    error: "bg-red-700 text-white",
    info: "bg-navy text-white",
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed left-4 right-4 top-20 z-[60] mx-auto flex max-w-md flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lift ${kindClass[t.kind]}`}
          >
            <span>{t.message}</span>
            {t.undo ? (
              <button
                type="button"
                className="shrink-0 rounded-lg bg-white/20 px-2 py-1 text-xs font-bold uppercase tracking-wide hover:bg-white/30"
                onClick={() => {
                  void t.undo?.().then(() => {
                    dismiss(t.id);
                    toast("Undone", "info");
                  });
                }}
              >
                Undo
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (_message: string, _kind?: ToastKind) => {
        /* no-op outside provider */
      },
      toastWithUndo: (_message: string, _undo: () => Promise<void>) => {
        /* no-op outside provider */
      },
    };
  }
  return ctx;
}
