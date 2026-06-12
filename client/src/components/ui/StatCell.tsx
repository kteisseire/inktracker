/* A single divided stat figure (label + machined mono value). Shared by Dashboard & Stats. */
export function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-3 py-4 sm:px-4 text-center">
      <p className="text-[0.7rem] uppercase tracking-[0.12em] text-ink-500">{label}</p>
      <p className="ink-num text-xl sm:text-2xl text-ink-100 mt-1.5">{value}</p>
    </div>
  );
}
