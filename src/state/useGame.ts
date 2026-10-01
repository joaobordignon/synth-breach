import { useSyncExternalStore } from "react";
import { store } from "../engine/gameStore";

// Subscribe a React component to the game store. The store mutates in place
// and bumps a version counter on every state change; useSyncExternalStore
// re-renders subscribers. Components read whatever they need off `store`
// directly after calling this.
let version = 0;
const bump = () => {
  version += 1;
};
store.onStateChange(bump);

export function useGame(): number {
  return useSyncExternalStore(
    (cb) => store.onStateChange(cb),
    () => version,
  );
}
