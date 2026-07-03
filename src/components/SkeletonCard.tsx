/** Skeleton for a KPI card (número grande + label) */
export function SkeletonKPI() {
  return (
    <div className="card p-5">
      <div className="skeleton w-9 h-9 rounded-lg mb-4" />
      <div className="skeleton skeleton-kpi mb-2" />
      <div className="skeleton skeleton-line w-28" />
      <div className="skeleton skeleton-sm w-20 mt-1.5" />
    </div>
  );
}

/** Skeleton for a generic content card */
export function SkeletonCard({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton skeleton-title mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-line" style={{ width: `${[100, 88, 72, 60][i] ?? 55}%` }} />
      ))}
    </div>
  );
}

/** Skeleton for a table row set */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton skeleton-sm w-full rounded-none" style={{ height: '36px', borderRadius: 0 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="skeleton skeleton-line w-28" />
          <div className="skeleton skeleton-line w-40" />
          <div className="skeleton skeleton-line w-20" />
          <div className="skeleton skeleton-sm w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}
