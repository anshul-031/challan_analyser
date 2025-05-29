"use client";

import { useState, useCallback } from 'react';

type ToastType = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const toast = useCallback(({ title, description, variant = "default" }: Omit<ToastType, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((currentToasts) => [...currentToasts, { id, title, description, variant }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((t) => t.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts
  };
}

export type { ToastType };