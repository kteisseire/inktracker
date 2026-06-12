/* Inline form error: alert-triangle icon + message, on the shared .ink-error surface.
   Pass className (e.g. "sheet-enter") for an optional entrance animation. */
export function ErrorAlert({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`ink-error ${className}`.trim()}>
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
