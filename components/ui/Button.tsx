import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark focus-visible:outline-primary",
  secondary: "bg-black/[0.06] text-text-primary hover:bg-black/[0.1] focus-visible:outline-slate-400",
  outline: "border border-black/[0.08] text-text-secondary hover:bg-black/[0.04] focus-visible:outline-slate-400",
  ghost: "text-text-secondary hover:bg-black/[0.06] focus-visible:outline-slate-400",
  danger: "bg-danger text-white hover:opacity-90 focus-visible:outline-danger",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 active:scale-[0.98]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
