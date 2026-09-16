import { FiWifiOff } from 'react-icons/fi';

import useOnlineStatus from '@/hooks/useOnlineStatus';

export default function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
    >
      <FiWifiOff />
      You are offline. Showing saved data, and changes are paused until you reconnect.
    </div>
  );
}
