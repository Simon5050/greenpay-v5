export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="h-4 w-72 bg-slate-800/60 rounded" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-7 w-28 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      {/* Content rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 h-20" />
        ))}
      </div>
    </div>
  );
}
