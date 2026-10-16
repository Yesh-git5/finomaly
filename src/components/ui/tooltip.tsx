import React, { type ReactNode } from 'react';

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  return <div className="relative inline-block">{children}</div>;
}

export function TooltipTrigger({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <button type="button" {...props}>{children}</button>;
}

export function TooltipContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md ${className}`}>
      {children}
    </div>
  );
}
