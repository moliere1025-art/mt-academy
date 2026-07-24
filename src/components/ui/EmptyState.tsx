import React from "react";
import { cn } from "../../lib/utils";
import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-5">
        {icon || <InboxIcon className="w-6 h-6 text-ink-muted/50" />}
      </div>
      <h4 className="text-[17px] font-semibold text-ink tracking-tight mb-1.5">{title}</h4>
      {description && (
        <p className="text-[14px] text-ink-muted leading-relaxed max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { EmptyState };
