"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DISMISS_KEY = "sentratrack-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-40 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg lg:bottom-4 lg:left-64 lg:right-4">
      <Download className="size-5 shrink-0 text-indigo-600" />
      <p className="flex-1 text-sm text-slate-700">Add SentraTrack to your home screen for quick access.</p>
      <Button size="sm" onClick={install}>
        Install
      </Button>
      <button onClick={dismiss} aria-label="Dismiss" className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
        <X className="size-4" />
      </button>
    </div>
  );
}
