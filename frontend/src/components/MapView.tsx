import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import { Pin } from '../types';

// ---- 初期表示 ----
const defaultCenter = { lat: 35.438, lng: 137.407 };
const defaultZoom = 11.8;

// ---- カテゴリ色 ----
const categoryColor: Record<string, string> = {
  earthquake: '#ef4444', heavy_rain: '#0284c7', landslide: '#ea580c',
  flood: '#0ea5e9', typhoon: '#22c55e', other: '#6b7280',
};

// ---- ラベル ----
const kindJa: Record<string, string> = { disaster:'災害', shelter:'避難所', misinfo:'誤情報', decision:'意思決定', poi:'施設' };
const categoryJa: Record<string, string> = { earthquake:'地震', heavy_rain:'豪雨', landslide:'土砂災害', flood:'洪水', typhoon:'台風', other:'その他' };

// ---- イベント名の日本語変換 ----
function translateTitle(title: string): string {
  if (title.includes('Evacuation Center Opened')) return '避難所開設';
  if (title.includes('Misinformation')) return '誤情報が発生';
  if (title.includes('Earthquake')) return '地震発生';
  if (title.includes('Flood')) return '洪水発生';
  if (title.includes('Landslide')) return '土砂災害発生';
  if (title.includes('Ena Elementary')) return '恵那小学校';
  return title; // それ以外はそのまま
}

// ---- 絵文字生成 ----
function pinEmoji(p: Pin): string {
  if (p.kind === 'shelter') return '🏠';
  if (p.kind === 'misinfo') return '⚠️';
  if (p.kind === 'decision') return '📢';
  if (p.kind === 'poi') {
    const t = (p.title || '').toLowerCase();
    if (t.includes('school') || t.includes('小学校')) return '🏫';
    if (t.includes('hospital') || t.includes('病院')) return '🏥';
    if (t.includes('police') || t.includes('警察')) return '🚓';
    if (t.includes('fire') || t.includes('消防')) return '🚒';
    return '📍';
  }
  switch (p.category) {
    case 'earthquake': return '💥';
    case 'heavy_rain': return '🌧️';
    case 'landslide':  return '🏔️';
    case 'flood':      return '🌊';
    case 'typhoon':    return '🌀';
    default: return '📍';
  }
}

// ---- 絵文字アイコン ----
function emojiIcon(emoji: string, color: string, size = 22, selected = false): DivIcon {
  const ring = selected ? `box-shadow:0 0 0 3px rgba(37,99,235,.4);` : '';
  const html = `
    <div style="
      display:inline-flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50%;
      background:#fff;border:2px solid ${color}; ${ring}
      font-size:${Math.round(size*0.72)}px;line-height:1"> ${emoji} </div>`;
  return L.divIcon({ className:'ttx-emoji-pin', html, iconSize:[size,size], iconAnchor:[size/2,size/2] });
}

// ---- 選択ピンに自動ズーム ----
function FlyToSelected({ selected }: { selected?: Pin }) {
  const map = useMap();
  useEffect(() => {
    if (selected)
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [selected, map]);
  return null;
}

// ---- 地図クリック ----
function MapClickCatcher({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick?.(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// ---- リセットボタン ----
function ResetControl({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    const Reset = L.Control.extend({
      options: { position: 'topright' as L.ControlPosition },
      onAdd() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const a = L.DomUtil.create('a', '', div);
        a.innerHTML = '↺'; a.href = '#'; a.title = '地図をリセット';
        a.style.width = '28px'; a.style.height = '28px';
        a.style.lineHeight = '28px'; a.style.textAlign = 'center';
        a.style.fontSize = '16px';
        L.DomEvent.on(a, 'click', (ev) => {
          L.DomEvent.preventDefault(ev);
          L.DomEvent.stopPropagation(ev);
          map.setView([center.lat, center.lng], zoom);
        });
        return div;
      },
    });
    const ctrl = new (Reset as any)();
    ctrl.addTo(map);
    return () => { map.removeControl(ctrl); };
  }, [map, center, zoom]);
  return null;
}

// ---- 恵那市境界 ----
function EnaBoundary() {
  const [boundary, setBoundary] = useState<any | null>(null);
  useEffect(() => {
    fetch('/ena_boundary.geojson')
      .then((res) => res.json())
      .then(setBoundary)
      .catch(() => console.warn('境界データ読み込み失敗'));
  }, []);
  if (!boundary) return null;
  return (
    <GeoJSON
      data={boundary}
      style={{
        color: '#000000',
        weight: 2.5,
        fillOpacity: 0.05,
      }}
    />
  );
}

// ---- 恵那市内施設（種類＋境界内のみ）----
function EnaFacilities() {
  const [facilities, setFacilities] = useState<any | null>(null);
  const [boundary, setBoundary] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/ena_facilities.geojson').then((res) => res.json()),
      fetch('/ena_boundary.geojson').then((res) => res.json())
    ])
      .then(([facilitiesData, boundaryData]) => {
        setFacilities(facilitiesData);
        setBoundary(boundaryData);
      })
      .catch(() => console.warn('施設または境界データ読み込み失敗'));
  }, []);

  if (!facilities || !boundary) return null;

  const boundaryLayer = L.geoJSON(boundary);
  const insideFeatures = facilities.features.filter((f: any) => {
    const [lng, lat] = f.geometry.coordinates;
    const point = L.latLng(lat, lng);
    return boundaryLayer.getLayers().some((layer) => {
      const poly = layer as L.Polygon;
      return poly.getBounds().contains(point);
    });
  });

  return (
    <GeoJSON
      data={{ ...facilities, features: insideFeatures }}
      pointToLayer={(feature, latlng) => {
        const type = feature.properties?.type;
        let color = '#000';
        let emoji = '📍';
        switch (type) {
          case '学校': color = '#3b82f6'; emoji = '🏫'; break;
          case '病院': color = '#ef4444'; emoji = '🏥'; break;
          case '避難所': color = '#22c55e'; emoji = '🏠'; break;
          case '市役所': color = '#000000'; emoji = '🏢'; break;
        }
        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'facility-icon',
            html: `<div style="
              background:#fff;
              border:2px solid ${color};
              border-radius:50%;
              width:24px;height:24px;
              display:flex;align-items:center;justify-content:center;
              font-size:15px;box-shadow:0 0 3px rgba(0,0,0,0.25);
            ">${emoji}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        });
      }}
      onEachFeature={(feature, layer) => {
        layer.bindPopup(`${feature.properties.name}（${feature.properties.type}）`);
      }}
    />
  );
}

// ---- 凡例（左下固定・目立たせる）----
function Legend() {
  const items = [
    ['🏫', '学校（青）'],
    ['🏥', '病院（赤）'],
    ['🏠', '避難所（緑）'],
    ['🏢', '市役所（黒）'],
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 15, left: 15,
      background: 'rgba(255,255,255,0.92)',
      border: '1px solid #999',
      borderRadius: 8, padding: '8px 12px',
      fontSize: 13, boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>凡例</div>
      {items.map(([em, label]) => (
        <div key={label} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 17 }}>{em}</span><span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ---- メイン ----
export default function MapView({
  pins, selectedId, onSelect, onMapClick, draft,
}: {
  pins: Pin[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  draft?: { lat: number; lng: number } | null;
}) {
  const selected = useMemo(() => pins.find((p) => p.id === selectedId), [pins, selectedId]);

  async function logClick(p: Pin) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: 'User',
          action: 'マーカークリック',
          payload: { id: p.id, title: translateTitle(p.title), kind: p.kind, category: p.category, channel: p.channel, type: p.type },
        }),
      });
    } catch {}
  }

  // 📍「その他」カテゴリのピンを除外してスッキリ
  const visiblePins = pins.filter((p) => p.category !== 'other');

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <MapContainer center={[defaultCenter.lat, defaultCenter.lng]} zoom={defaultZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <EnaBoundary />
        <EnaFacilities />
        <ResetControl center={defaultCenter} zoom={defaultZoom} />
        {selected && <FlyToSelected selected={selected} />}
        <MapClickCatcher onMapClick={onMapClick} />

        {visiblePins.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={emojiIcon(pinEmoji(p), categoryColor[p.category || 'other'], 22)}
            eventHandlers={{ click: () => { onSelect?.(p.id); logClick(p); } }}
          >
            <Popup>
              <div style={{ fontWeight: 700 }}>{translateTitle(p.title)}</div>
              <div style={{ fontSize: 12, color: '#555' }}>
                {p.category ? `${categoryJa[p.category]} ` : ''}{p.kind ? `／ ${kindJa[p.kind]}` : ''}
              </div>
            </Popup>
          </Marker>
        ))}

        {draft && (
          <Marker position={[draft.lat, draft.lng]} icon={emojiIcon('🟢', '#22c55e', 24, true)}>
            <Popup>新規イベントの位置</Popup>
          </Marker>
        )}
      </MapContainer>
      <Legend />
    </div>
  );
}
