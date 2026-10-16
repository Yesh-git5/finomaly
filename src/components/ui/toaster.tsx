import React from 'react';
import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(({ id, title, description }) => (
        <div
          key={id}
          className="pointer-events-auto flex items-start justify-between rounded-lg border border-border bg-card p-4 shadow-lg transition-all"
        >
          <div className="grid gap-1">
            {title && <div className="text-xs font-semibold">{title}</div>}
            {description && <div className="text-[11px] text-muted-foreground">{description}</div>}
          </div>
          <button
            onClick={() => dismiss(id)}
            className="ml-2 text-muted-foreground hover:text-foreground text-xs"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
