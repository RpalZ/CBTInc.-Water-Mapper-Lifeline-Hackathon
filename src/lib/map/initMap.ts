import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

export const initMapLibre = () => {
  if (typeof window !== 'undefined') {
    // Register PMTiles
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    // Enable Arabic/RTL support
    // Using a reliable CDN for the RTL plugin
    if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
        maplibregl.setRTLTextPlugin(
        'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
        (error) => {
            if (error) console.error('Failed to load RTL plugin:', error);
        },
        true // Lazy load
        );
    }
  }
};
