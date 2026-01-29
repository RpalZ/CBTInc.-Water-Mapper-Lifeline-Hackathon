# OSRM Routing Documentation Index

## 📚 Complete Documentation Set

### For First-Time Users
1. **[OSRM_SETUP_COMPLETE.md](./OSRM_SETUP_COMPLETE.md)** ⭐ START HERE
   - What was built and why
   - How to test it
   - Quick next steps

2. **[ROUTING_QUICK_REF.md](./ROUTING_QUICK_REF.md)** 
   - Common usage patterns
   - Code snippets
   - Debugging guide

### For Developers
3. **[ROUTING_IMPLEMENTATION.md](./ROUTING_IMPLEMENTATION.md)**
   - Complete technical architecture
   - Module-by-module breakdown
   - Data flow and lifecycle
   - Future enhancement ideas

4. **[ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)**
   - Visual architecture diagrams
   - Data flow sequences
   - Component responsibilities
   - Performance characteristics

### For Database Integration
5. **[DATABASE_MIGRATION_ROUTING.md](./DATABASE_MIGRATION_ROUTING.md)**
   - Suggested table schemas
   - Step-by-step migration guide
   - Code examples for each phase
   - Rollout checklist

---

## 🎯 Quick Navigation by Task

### "I want to understand what was built"
→ Read: [OSRM_SETUP_COMPLETE.md](./OSRM_SETUP_COMPLETE.md)

### "How do I use this in my code?"
→ Read: [ROUTING_QUICK_REF.md](./ROUTING_QUICK_REF.md)

### "How does this work internally?"
→ Read: [ROUTING_IMPLEMENTATION.md](./ROUTING_IMPLEMENTATION.md) + [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)

### "I want to connect this to a database"
→ Read: [DATABASE_MIGRATION_ROUTING.md](./DATABASE_MIGRATION_ROUTING.md)

### "I need to debug an issue"
→ Read: [ROUTING_QUICK_REF.md#debugging](./ROUTING_QUICK_REF.md) + browser console

### "I need to change the styling"
→ Edit: `src/lib/map/routeLayer.ts` paint properties

---

## 📁 Source Files

### Routing Logic
- `src/lib/routing/osrm.ts` — OSRM API wrapper
- `src/lib/routing/routeSource.ts` — Endpoint provider
- `src/lib/map/routeLayer.ts` — MapLibre layer management

### Integration
- `src/components/LifelineMap.tsx` — Updated component (routes on line 75+)

---

## 🔍 Key Concepts

### Stateless Routing
The `osrm.ts` module has **zero dependencies** on your application state. It's a pure function that takes coordinates and returns a route. This makes it:
- Easy to test
- Easy to replace (swap for GraphHopper, etc.)
- Easy to reuse elsewhere

### Database-Agnostic
The `routeSource.ts` module is the **only place** where data sources are defined. When you add a database:
- Update only `routeSource.ts`
- No changes to `osrm.ts`, `routeLayer.ts`, or `LifelineMap.tsx`
- This is called "separation of concerns"

### MapLibre Independent
The `routeLayer.ts` module works with **any** GeoJSON data. You could:
- Use it for hiking trails
- Use it for public transportation
- Use it for delivery routes
- Use it for anything with geometry

### Error Graceful
- OSRM API down? Falls back to empty route
- Geolocation denied? Uses hardcoded coordinates
- Browser old? Geolocation unsupported—still works
- No external auth keys = no auth failures

---

## ✅ Implementation Checklist

- [x] OSRM service module created
- [x] Route source module created (with hardcoded + geolocation)
- [x] MapLibre layer helpers created
- [x] Integration into LifelineMap complete
- [x] TypeScript compilation passes
- [x] All functions documented with JSDoc
- [x] Error handling implemented
- [x] Architecture documented
- [x] Quick reference guide created
- [x] Database migration guide created
- [x] Architecture diagrams created

---

## 🧪 Testing Checklist

Before committing:
- [ ] Map loads without errors
- [ ] Route visible (blue line with markers)
- [ ] Console shows route distance/duration
- [ ] Sensor markers display correctly
- [ ] Geolocation works (or graceful fallback)
- [ ] Manual override works: `setRouteEndpoints(start, end)`
- [ ] Browser DevTools console is clean (no errors)

---

## 📊 Module Sizes

| File | Size | Purpose |
|------|------|---------|
| osrm.ts | ~70 LOC | OSRM API wrapper |
| routeSource.ts | ~95 LOC | Coordinate provider |
| routeLayer.ts | ~155 LOC | MapLibre management |
| LifelineMap.tsx | +65 LOC | Component integration |
| **Total** | **~385 LOC** | Core routing implementation |
| Documentation | ~2500 LOC | 6+ guides |

---

## 🔗 External References

- **OSRM API:** https://router.project-osrm.org/
  - REST API documentation
  - Try interactive demo
  
- **MapLibre GL JS:** https://maplibre.org/
  - Layer reference
  - Paint properties
  
- **GeoJSON Spec:** https://geojson.org/
  - Feature format
  - Coordinate order (lon,lat)

---

## 🚀 Next Steps

### Immediate (Today)
1. Test the map loads with a route visible
2. Check console for distance/duration logs
3. Read [OSRM_SETUP_COMPLETE.md](./OSRM_SETUP_COMPLETE.md)

### Short Term (This Sprint)
1. Integrate with your design team for styling feedback
2. Test on different devices/browsers
3. Set up performance monitoring

### Medium Term (Next Sprint)
1. Start database schema design (see [DATABASE_MIGRATION_ROUTING.md](./DATABASE_MIGRATION_ROUTING.md))
2. Design UI for route endpoint selection
3. Plan caching strategy

### Long Term (Future)
1. Implement database queries
2. Add route alternatives/comparison
3. Add real-time traffic
4. Add turn-by-turn navigation
5. Consider local OSRM instance for production

---

## 💡 Tips & Tricks

### Testing Different Routes Programmatically
```typescript
import { setRouteEndpoints } from '@/lib/routing/routeSource';

// In browser console:
setRouteEndpoints(
  { lng: 51.5, lat: 25.3 },  // Start
  { lng: 51.6, lat: 25.4 }   // End
);
// Route updates immediately!
```

### Checking OSRM Response Directly
```javascript
// In browser console:
fetch('https://router.project-osrm.org/route/v1/driving/51.532,25.316;51.503,25.278?overview=full')
  .then(r => r.json())
  .then(d => console.log('Distance:', d.routes[0].distance, 'meters'))
```

### Viewing Route Data Structure
```typescript
import { fetchRoute } from '@/lib/routing/osrm';

const route = await fetchRoute(start, end);
console.log('Route structure:', route);
// {
//   type: 'Feature',
//   geometry: { type: 'LineString', coordinates: [[lng, lat], ...] },
//   properties: { distance: 12345, duration: 678 }
// }
```

### Adding Console Visibility to Route Layer
In `routeLayer.ts`, replace:
```typescript
export function updateRoute(...) {
```
With:
```typescript
export function updateRoute(...) {
  console.log('Updating route:', { route, startCoord, endCoord });
```

---

## 🆘 Help & Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| "Route source not found" | Ensure `initRouteLayer()` called before `updateRoute()` |
| Route not showing | Check browser console for errors; verify coordinates |
| Geolocation not working | Must be HTTPS (not HTTP); user must grant permission |
| OSRM API calls slow | Public API has rate limits; consider local instance |
| TypeScript errors | Run `npm run build` to check; should see no errors |

### Getting Help

1. **Stuck?** Check [ROUTING_QUICK_REF.md#debugging](./ROUTING_QUICK_REF.md)
2. **Need details?** Read [ROUTING_IMPLEMENTATION.md](./ROUTING_IMPLEMENTATION.md)
3. **Ready to code?** Start with [DATABASE_MIGRATION_ROUTING.md](./DATABASE_MIGRATION_ROUTING.md)

---

## 📝 Notes for Future Development

### Before You Modify Code
1. Read the corresponding documentation
2. Check the module's JSDoc comments
3. Understand the data flow in [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)
4. Test locally before committing

### When Adding Features
1. Keep modules single-responsibility
2. Maintain TypeScript types
3. Update documentation
4. Add unit tests for new functions
5. Test error cases

### When Removing/Refactoring
1. Check all usages: `grep -r "functionName" src/`
2. Update documentation
3. Update tests
4. Consider backwards compatibility

---

**Last Updated:** January 26, 2026  
**Status:** ✅ Implementation Complete  
**Ready for:** Development, Testing, Database Integration
