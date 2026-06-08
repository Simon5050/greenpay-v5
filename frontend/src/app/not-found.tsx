import Link from "next/link";
import { Leaf, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center text-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-forest-600/10 border border-forest-500/20 flex items-center justify-center">
        <Leaf className="w-10 h-10 text-forest-400 opacity-50" />
      </div>
      <div>
        <p className="font-mono text-forest-400 text-sm mb-2">404</p>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Page not found</h2>
        <p className="text-slate-400 text-sm">
          The page you're looking for doesn't exist. It may have moved or the URL is incorrect.
        </p>
      </div>
      <Link href="/" className="btn-primary py-2.5 px-6">
        <Home className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}
