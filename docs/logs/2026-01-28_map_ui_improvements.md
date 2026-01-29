# Map UI Improvements and Persistence

**Date:** 2026-01-28

## Changes

1.  **"Points First" Visualization:**
    -   Implemented `renderInitialPoints()` to display depots and community locations immediately on map load, before any route calculation is performed.
    -   This allows users to see the problem space before triggering the solver.

2.  **Persistence Fixes:**
    -   Updated `useEffect` initialization logic to check `localStorage` for cached routes immediately.
    -   If cached routes exist, they are loaded instantly.
    -   If no cache exists, the initial points are rendered.
    -   This ensures map state persists across tab switches and navigation within the app.

3.  **UI Refactoring:**
    -   Moved the "Generate Fleet Routes" button **outside** the map container into a dedicated "Fleet Command" control bar above the map.
    -   Added a "Reset Map" button to the control bar to clear the cache and return to the initial state.
    -   Improved the button styling and added loading states.

4.  **Camera Control:**
    -   Disabled automatic camera centering (`fitBounds`) when loading cached routes or generating new ones, as requested ("when routing pls dont center the camera").
    -   Modified `updateRoute` in `src/lib/map/routeLayer.ts` to accept a `fitToView` parameter (default `true`, but passed as `false` for route updates).
    -   Initial point loading still centers the camera to ensure the user starts with a good view of the region.

## Technical Details

-   **Data Extraction:** Moved `DEPOTS` and `COMMUNITY_COORDS` constants out of the component scope to be reusable for initial rendering.
-   **State Logic:** `routesLoaded` state now correctly reflects whether full routes are displayed or just initial points.
-   **DOM Structure:** Wrapped the map and controls in a flex column layout for better spacing and positioning.
