"use client";

import { useState, type ComponentType } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FabAction {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}

export function Fab({ actions }: { actions: FabAction[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-5 bottom-[88px] z-[100] flex flex-col items-end gap-3 lg:hidden">
      {open &&
        actions.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              action.onClick();
              setOpen(false);
            }}
            className="animate-slide-up-fade flex items-center gap-2 rounded-full bg-surface-card px-4 py-2 text-sm font-medium text-text-secondary shadow-lg"
          >
            {action.label}
            <action.icon className="size-4" />
          </button>
        ))}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        className={cn(
          "flex size-14 items-center justify-center rounded-full text-white shadow-[0_4px_20px_rgba(79,70,229,0.4)] transition-all duration-[250ms] hover:scale-[1.08]",
          open ? "rotate-45 bg-danger" : "bg-primary"
        )}
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
