"use client";

import { useCallback } from 'react';

interface MapPickerProps {
  value?: { lat: number; lng: number; altitude?: number } | null;
  onChange?: (coords: { lat: number; lng: number; altitude?: number }) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const update = useCallback((k: 'lat' | 'lng' | 'altitude', v: string) => {
    const parsed = v === '' ? undefined : Number(v);
    const next = {
      lat: value?.lat,
      lng: value?.lng,
      altitude: value?.altitude,
      [k]: parsed,
    } as unknown as { lat?: number; lng?: number; altitude?: number };

    // Only call when we have at least lat and lng numbers (or allow partial updates)
    onChange && onChange({ lat: next.lat ?? 0, lng: next.lng ?? 0, altitude: next.altitude });
  }, [onChange, value]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#e8eaed] p-4 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold text-[#74777f] uppercase">Latitude</label>
          <input
            type="number"
            step="any"
            className="w-full mt-2 px-3 py-2 rounded-md border border-[#eef0f2]"
            value={value?.lat ?? ''}
            onChange={(e) => update('lat', e.target.value)}
            placeholder="e.g. -25.9655"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#74777f] uppercase">Longitude</label>
          <input
            type="number"
            step="any"
            className="w-full mt-2 px-3 py-2 rounded-md border border-[#eef0f2]"
            value={value?.lng ?? ''}
            onChange={(e) => update('lng', e.target.value)}
            placeholder="e.g. 32.5832"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#74777f] uppercase">Altitude (m)</label>
          <input
            type="number"
            step="any"
            className="w-full mt-2 px-3 py-2 rounded-md border border-[#eef0f2]"
            value={value?.altitude ?? ''}
            onChange={(e) => update('altitude', e.target.value)}
            placeholder="optional"
          />
        </div>
      </div>
    </div>
  );
}
