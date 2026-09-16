import { registerSW } from 'virtual:pwa-register';

const API_CACHE = 'flowdeck-api';

export function registerOfflineSupport(): void {
  if ('serviceWorker' in navigator) {
    registerSW({ immediate: true });
  }
}

export async function clearOfflineCache(): Promise<void> {
  if ('caches' in window) {
    await caches.delete(API_CACHE);
  }
}
