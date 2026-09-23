'use client';

/**
 * Click a map, get a coordinate.
 *
 * Leaflet was already a dependency and unused anywhere in the app. It is
 * imported dynamically because it reaches for `window` at module scope, which
 * throws during the server render of the dashboard page this sits on.
 *
 * There is no @types/leaflet in the project and adding a dependency for one
 * component is not worth it, so the handful of calls used here are typed
 * locally rather than pulled in wholesale.
 */

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { DEFAULT_CENTRE, round6, type LatLng } from '@/lib/geo';

/** Only the surface this component touches. */
interface LeafletMap {
  setView(centre: [number, number], zoom: number): LeafletMap;
  on(event: 'click', handler: (e: { latlng: { lat: number; lng: number } }) => void): void;
  remove(): void;
  invalidateSize(): void;
}
interface LeafletMarker {
  setLatLng(p: [number, number]): LeafletMarker;
  addTo(map: LeafletMap): LeafletMarker;
  remove(): void;
}

export default function MapPicker({
  value,
  centre,
  onPick,
}: {
  value: LatLng | null;
  /** Where to open when nothing is chosen yet — the city, not an answer. */
  centre: LatLng;
  onPick: (p: LatLng) => void;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const libRef = useRef<any>(null);

  /* The map is built once. onPick and the current value change on every
   * keystroke in the step around it, and rebuilding a Leaflet map on each of
   * those would drop the agent's zoom and pan. */
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = ((await import('leaflet')) as any).default ?? (await import('leaflet'));
      if (cancelled || !holder.current || mapRef.current) return;

      const start = value ?? centre ?? DEFAULT_CENTRE;
      const map: LeafletMap = L.map(holder.current, {
        // The map sits mid-form. Grabbing the wheel would trap a scrolling
        // agent inside it; ctrl+wheel and the +/- buttons still zoom.
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([start.lat, start.lng], value ? 16 : 12);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      map.on('click', (e) => {
        pickRef.current({ lat: round6(e.latlng.lat), lng: round6(e.latlng.lng) });
      });

      libRef.current = L;
      mapRef.current = map;

      // The card this sits in can still be laying out when the map builds, and
      // Leaflet measures once — without this the tiles come back grey.
      setTimeout(() => mapRef.current?.invalidateSize(), 80);
    })();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The pin follows the answer, whichever way it was given — clicked here, or
   * pasted as a Google Maps link in the field above. */
  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      // A divIcon, because Leaflet's default marker loads its PNG by a relative
      // path that a bundler rewrites — the classic silent broken-image marker.
      markerRef.current = L.marker([value.lat, value.lng], {
        icon: L.divIcon({ className: 'mp-pin', html: '<span></span>', iconSize: [20, 20] }),
      }).addTo(map);
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
    map.setView([value.lat, value.lng], 16);
  }, [value]);

  return (
    <div className="mp-wrap">
      <div ref={holder} className="mp-map" role="application" aria-label="Pick the property location" />
      <p className="mp-hint">
        Click the map to drop the pin, or paste a Google Maps link above. Buyers see an approximate
        area — the exact address is only shared when they enquire.
      </p>
    </div>
  );
}
