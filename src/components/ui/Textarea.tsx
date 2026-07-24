import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink/70 tracking-tight">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg border bg-surface text-[15px] text-ink leading-relaxed",
            "placeholder:text-ink-muted/40",
            "outline-none transition-all duration-200 resize-none",
            "focus:border-primary focus:ring-2 focus:ring-primary/10",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-alt",
            error ? "border-danger/60 focus:border-danger focus:ring-danger/10" : "border-outline",
            className
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-danger font-medium">{error}</p>}
        {hint && !error && <p className="text-[12px] text-ink-muted">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
export default Textarea;
