"use client";
import { useToken, TOKENS, type TokenSymbol } from "@/lib/token";
import { cn } from "@/lib/utils";

export function TokenSelector({ className }: { className?: string }) {
  const { symbol, setSymbol } = useToken();

  return (
    <div className={cn(
      "flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5",
      className
    )}>
      {(Object.keys(TOKENS) as TokenSymbol[]).map((sym) => {
        const t       = TOKENS[sym];
        const active  = symbol === sym;
        return (
          <button
            key={sym}
            onClick={() => setSymbol(sym)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-display font-medium transition-all",
              active
                ? `${t.bg} ${t.color} ${t.border} border`
                : "text-slate-400 hover:text-white border border-transparent"
            )}
          >
            <span>{t.flag}</span>
            <span>{sym}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Compact inline badge version (for page headers) ──────────────────────────
export function TokenBadge() {
  const { token } = useToken();
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
      token.bg, token.color, token.border
    )}>
      {token.flag} {token.symbol}
    </span>
  );
}
