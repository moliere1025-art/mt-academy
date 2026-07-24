import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight transition-colors",
  {
    variants: {
      variant: {
        default: "bg-black/5 text-ink/70",
        primary: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-[#946800]",
        danger: "bg-danger/10 text-danger",
        outline: "border border-black/10 text-ink/60",
        core: "bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        advanced: "bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
        mastery: "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        elite: "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/** 根据会员层级自动选择 Badge variant */
function MembershipBadge({ level, className }: { level?: string; className?: string }) {
  const variantMap: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    Core: "core",
    Advanced: "advanced",
    Mastery: "mastery",
    Elite: "elite",
  };
  const labelMap: Record<string, string> = {
    Core: "核心",
    Advanced: "进阶",
    Mastery: "精通",
    Elite: "认证",
  };
  return (
    <Badge variant={variantMap[level || "Core"] || "default"} className={className}>
      {labelMap[level || "Core"] || level || "核心"}
    </Badge>
  );
}

export { Badge, MembershipBadge, badgeVariants };
export default Badge;
