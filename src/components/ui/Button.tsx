import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-[17px] font-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:pointer-events-none disabled:opacity-50 font-sans active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-apple-blue text-white hover:bg-apple-blue/90",
        primary: "bg-apple-blue text-white hover:bg-apple-blue/90",
        secondary: "bg-ink text-surface hover:bg-ink/90",
        outline: "border border-apple-blue bg-transparent text-apple-blue hover:bg-apple-blue/5 rounded-pill",
        ghost: "hover:bg-black/5 text-ink",
        link: "text-apple-blue underline-offset-4 hover:underline",
        pill: "bg-transparent text-[#0066cc] border border-[#0066cc] rounded-pill px-4 py-1 hover:bg-[#0066cc]/5",
      },
      size: {
        default: "h-10 px-[15px] py-[8px]",
        sm: "h-8 px-3 text-[14px]",
        lg: "h-12 px-8 text-[18px]",
        xl: "h-14 px-10 text-[21px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  view?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button;
