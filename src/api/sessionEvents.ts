import type { TokenPair } from '@/utils/storage';

type RefreshedListener = (tokens: TokenPair) => void;
type ExpiredListener = () => void;

let refreshedListener: RefreshedListener = () => undefined;
let expiredListener: ExpiredListener = () => undefined;

export const sessionEvents = {
  onRefreshed(listener: RefreshedListener) {
    refreshedListener = listener;
  },
  onExpired(listener: ExpiredListener) {
    expiredListener = listener;
  },
  refreshed(tokens: TokenPair) {
    refreshedListener(tokens);
  },
  expired() {
    expiredListener();
  }
};
