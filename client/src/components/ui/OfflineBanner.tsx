import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-900/80 text-amber-100 text-center text-sm py-2 px-4">
      Mode hors ligne — données en cache
    </div>
  );
}
