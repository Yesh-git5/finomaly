import { useState, useEffect } from 'react';
import type { ToastProps } from '@/components/ui/toast';

type ToastItem = ToastProps & { id: string };

let listeners: Array<(toasts: ToastItem[]) => void> = [];
let memoryToasts: ToastItem[] = [];

export function toast(props: ToastProps) {
  const id = props.id || Math.random().toString(36).substring(2, 9);
  const newToast: ToastItem = { ...props, id };
  memoryToasts = [newToast, ...memoryToasts].slice(0, 3);
  listeners.forEach((listener) => listener(memoryToasts));

  setTimeout(() => {
    dismissToast(id);
  }, 4000);

  return { id };
}

function dismissToast(id?: string) {
  memoryToasts = id ? memoryToasts.filter((t) => t.id !== id) : [];
  listeners.forEach((listener) => listener(memoryToasts));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(memoryToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: dismissToast,
  };
}
