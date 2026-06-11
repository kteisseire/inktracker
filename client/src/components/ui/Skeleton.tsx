/* Manuscript skeletons — faint ruled placeholder shapes matching the real layout.
   One shared animate-pulse (no shimmer-sweep gradients). */

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3.5 animate-pulse">
      <div className="h-4 w-4 rounded-sm bg-ink-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/5 rounded bg-ink-800" />
        <div className="h-2.5 w-1/4 rounded bg-ink-850" />
      </div>
      <div className="h-3.5 w-10 rounded bg-ink-800 shrink-0" />
    </div>
  );
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="ink-card divide-y divide-rule">
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`ink-card p-4 sm:p-5 animate-pulse space-y-3 ${className}`}>
      <div className="h-3 w-1/3 rounded bg-ink-850" />
      <div className="h-8 w-2/5 rounded bg-ink-800" />
    </div>
  );
}

export function SkeletonStatPanel() {
  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
      <SkeletonCard className="sm:col-span-1" />
      <div className="ink-card sm:col-span-2 grid grid-cols-3 divide-x divide-rule animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 space-y-2">
            <div className="h-2.5 w-2/3 rounded bg-ink-850" />
            <div className="h-6 w-1/2 rounded bg-ink-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
