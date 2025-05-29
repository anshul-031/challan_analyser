"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast-simple";
import type { ToastType } from "@/hooks/use-toast-simple";

interface ToastProps {
  title?: string;
  description?: string;
  onClose?: () => void;
  variant?: "default" | "destructive";
  className?: string;
}

export function Toast({ 
  title, 
  description, 
  onClose,
  variant = "default",
  className 
}: ToastProps) {
  return (
    <div className={cn(
      "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
      variant === "destructive" ? "border-destructive bg-destructive text-destructive-foreground" : "border bg-background text-foreground",
      className
    )}>
      <div className="grid gap-1">
        {title && <h4 className="text-sm font-semibold">{title}</h4>}
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      {onClose && (
        <button
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none group-hover:opacity-100"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}