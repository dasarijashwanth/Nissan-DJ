import { loginWithGoogle } from "@/app/(auth)/actions";

export function GoogleSignInButton() {
  return (
    <form action={loginWithGoogle}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-black/[0.08] bg-surface-card px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-black/[0.04]"
      >
        <svg className="size-4.5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.6-5.19 3.6-8.84z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.89-3.02c-1.08.72-2.45 1.15-4.05 1.15-3.12 0-5.76-2.1-6.7-4.93H1.28v3.11C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.3 14.3c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3V6.59H1.28A11.96 11.96 0 000 12c0 1.93.46 3.76 1.28 5.41z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.59l4.02 3.11c.94-2.83 3.58-4.93 6.7-4.93z"
          />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}
