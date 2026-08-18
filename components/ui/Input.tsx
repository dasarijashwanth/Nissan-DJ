import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const FIELD_CLASSES = cn(
  "block w-full rounded-lg border border-black/[0.08] bg-surface-page px-3 py-2 text-sm text-text-primary",
  "placeholder:text-text-muted",
  "focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600",
  "disabled:opacity-50 disabled:cursor-not-allowed"
);

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(FIELD_CLASSES, error && "border-red-400 focus:ring-red-500 focus:border-red-500", className)}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(FIELD_CLASSES, "min-h-20 resize-none", error && "border-red-400 focus:ring-red-500 focus:border-red-500", className)}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(FIELD_CLASSES, "cursor-pointer", error && "border-red-400 focus:ring-red-500 focus:border-red-500", className)}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
