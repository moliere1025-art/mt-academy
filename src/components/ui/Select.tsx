import * as React from "react";
import { cn } from "../../lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink/70 tracking-tight">
            {label}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg border bg-surface text-[15px] text-ink",
            "outline-none transition-all duration-200 appearance-none",
            "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
            "bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10",
            "focus:border-primary focus:ring-2 focus:ring-primary/10",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-alt",
            error ? "border-danger/60" : "border-outline",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[12px] text-danger font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
export default Select;
