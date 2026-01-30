## 2026-01-30_fix-react-state-update-on-unmounted-component

**Task:** Resolve "Can't perform a React state update on a component that hasn't mounted yet" error in `LifelineMap.tsx`.

**Changes Made:**
- Introduced a `mounted` `useRef` to track if the `LifelineMap` component is currently mounted.
- Modified the main map initialization `useEffect` to set `mounted.current = true` on component mount and `mounted.current = false` in its cleanup function.
- Added checks for `mounted.current` before calling `setMapLoaded(true)`, `setMapError()`, and `setHoverInfo(null)` within asynchronous `maplibregl` callbacks (e.g., `map.once('load')` and `map.on('mousemove')`), ensuring state updates only occur if the component is still mounted.

**Verification:**
- The changes address the core issue of state updates on unmounted components. The application should no longer throw the specified React error.