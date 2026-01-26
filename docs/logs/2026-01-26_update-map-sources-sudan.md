# Map Source Update - Sudan

## Changes
- **Component:** `src/components/LifelineMap.tsx`
  - Updated map center to Khartoum `[32.5599, 15.5007]`.
  - Replaced single `doha` source with 5 split Sudan sources: `sudan1` to `sudan5`.
  - Configured 5 sets of layers (`water-N`, `roads-N`) to render the split tiles.
  - Fixed lint errors (`any` type, synchronous state update).

## Context
- The Sudan map data is split into 5 PMTiles files (`sudan_1.pmtiles` ... `sudan_5.pmtiles`).
