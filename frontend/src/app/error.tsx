"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GreenPay Error]", error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div>
        <h2 className="font-display font-bold text-xl text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {error.message?.slice(0, 200) ?? "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="text-slate-600 text-xs mt-2 font-mono">Digest: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="btn-primary py-2.5 px-6"
      >
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}
