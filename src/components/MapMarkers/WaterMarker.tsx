'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import styles from './WaterMarker.module.css';

export interface WaterMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  water_amount?: number;
  location?: string;
  status?: 'active' | 'inactive' | 'alert';
  last_updated?: string;
  additional_notes?: string;
  device_id?: string;
  pressure_pa?: number;
  battery_voltage?: number;
}

interface WaterMarkerProps {
  data: WaterMarkerData;
  map: maplibregl.Map;
  onDetailClick?: (data: WaterMarkerData) => void;
  isExpanded?: boolean;
  onClose?: () => void;
}

export default function WaterMarker({
  data,
  map,
  onDetailClick,
  isExpanded,
  onClose,
}: WaterMarkerProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Create marker element with custom styling
  useEffect(() => {
    if (!map) return;

    // Clean up existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create marker container with custom HTML
    const markerElement = document.createElement('div');
    markerElement.className = styles.markerContainer;
    markerElement.innerHTML = `
      <div class="${styles.markerPin}">
        <svg class="${styles.markerIcon}" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.69C12 2.69 7 8 7 13c0 2.76 2.24 5 5 5s5-2.24 5-5c0-5-5-10.31-5-10.31z"/>
        </svg>
      </div>
    `;

    // Create popup for detail panel
    const popupElement = document.createElement('div');
    popupElement.className = styles.detailPanel;
    popupElement.innerHTML = `
      <div class="${styles.detailContent}">
        <div class="${styles.detailHeader}">
          <h3 class="${styles.detailTitle}">${data.location || 'Water Site'}</h3>
          <button class="${styles.closeButton}" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="${styles.detailBody}">
          <div class="${styles.detailRow}">
            <span class="${styles.detailLabel}">ID:</span>
            <span class="${styles.detailValue}">${data.id}</span>
          </div>
          <div class="${styles.detailRow}">
            <span class="${styles.detailLabel}">Amount of water:</span>
            <span class="${styles.detailValue}">${data.water_amount || 123} L</span>
          </div>
          <div class="${styles.detailRow}">
            <span class="${styles.detailLabel}">Location:</span>
            <span class="${styles.detailValue}">${data.location || 'Example Site'}</span>
          </div>
          <div class="${styles.detailRow}">
            <span class="${styles.detailLabel}">Status:</span>
            <span class="${styles.detailValue} ${styles.statusBadge} ${styles[`status-${data.status || 'inactive'}`]}">
              ${data.status || 'Placeholder'}
            </span>
          </div>
          <div class="${styles.detailRow}">
            <span class="${styles.detailLabel}">Last updated:</span>
            <span class="${styles.detailValue}">${data.last_updated || 'Placeholder date'}</span>
          </div>
          <div class="${styles.detailRow}">
            <span class="${styles.detailLabel}">Additional notes:</span>
            <span class="${styles.detailValue}">${data.additional_notes || 'Placeholder text'}</span>
          </div>
        </div>
      </div>
    `;

    const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
      .setDOMContent(popupElement);

    // Add close button handler
    const closeButton = popupElement.querySelector(`.${styles.closeButton}`);
    closeButton?.addEventListener('click', () => {
      popup.remove();
      setIsHovered(false);
      onClose?.();
    });

    popupRef.current = popup;

    // Create marker with event handlers
    const marker = new maplibregl.Marker({
      element: markerElement,
    })
      .setLngLat([data.longitude, data.latitude])
      .addTo(map);

    // Hover events
    markerElement.addEventListener('mouseenter', () => {
      setIsHovered(true);
      markerElement.classList.add(styles.active);
    });

    markerElement.addEventListener('mouseleave', () => {
      if (!isExpanded) {
        setIsHovered(false);
        markerElement.classList.remove(styles.active);
      }
    });

    // Click to expand detail panel
    markerElement.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.setLngLat([data.longitude, data.latitude]).addTo(map);
      onDetailClick?.(data);
    });

    markerRef.current = marker;

    return () => {
      marker.remove();
      popup.remove();
    };
  }, [map, data, isExpanded, onDetailClick, onClose]);

  // Handle expanded state
  useEffect(() => {
    if (isExpanded && popupRef.current && markerRef.current) {
      popupRef.current
        .setLngLat([data.longitude, data.latitude])
        .addTo(map);
      markerRef.current.getElement().classList.add(styles.active);
    } else if (!isExpanded && popupRef.current) {
      popupRef.current.remove();
      markerRef.current?.getElement().classList.remove(styles.active);
    }
  }, [isExpanded, data.longitude, data.latitude, map]);

  return null; // Marker is rendered directly on the map
}
