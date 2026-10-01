import { useSyncExternalStore } from "react";

// Returns true if the user is on macOS, false otherwise and during SSR.
// useSyncExternalStore reads navigator.platform on the client without setState or useEffect.
const subscribe = () => () => {};
const getSnapshot = () => navigator.platform.toUpperCase().includes("MAC");
const getServerSnapshot = () => false;

export const useIsMac = (): boolean => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
