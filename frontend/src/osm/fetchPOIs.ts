// frontend/src/osm/fetchPOIs.ts
import { Pin } from '../types';

const CENTER = { lat: 35.4527, lon: 137.4138 };
const RADIUS_M = 7000;
const OVERPASS = 'https://overpass-api.de/api/interpreter';

export async function fetchPOIs(): Promise<Pin[]> {
  const parts = [
    'node["amenity"="school"]',
    'node["amenity"="police"]',
    'node["amenity"="fire_station"]',
    'node["amenity"="hospital"]',
    'node["emergency"="assembly_point"]',
  ].map((p) => `${p}(around:${RADIUS_M},${CENTER.lat},${CENTER.lon});`).join('\n');

  const query = `[out:json][timeout:25];(${parts});out body;`;

  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ data: query }),
  });

  if (!res.ok) {
    console.warn('Overpass API error:', res.status);
    return [];
  }

  const json = await res.json();
  return (json.elements || []).map((el: any) => ({
    id: 'poi' + el.id,
    title: el.tags?.name || 'Unnamed POI',
    lat: el.lat,
    lng: el.lon,
    type: el.tags?.amenity || el.tags?.emergency || 'poi',
  }));
}
