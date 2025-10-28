import { useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import Timeline from './components/Timeline';
import AddEventForm, { DraftEvent } from './components/AddEventForm';
import LogPanel from './components/LogPanel';
import ScenarioSelect from './components/ScenarioSelect';
import TimeControl from './components/TimeControl';
import { fetchPOIs } from './osm/fetchPOIs';
import { Pin } from './types';
import ParticipantsPanel from './components/ParticipantsPanel';

// ---- 型 ----
type LogItem = {
  id: string;
  time: string;
  actor: string;
  action: string;
  payload?: Record<string, any>;
};

// ---- 定数 ----
const EVENTS_FALLBACK = '/events.json';
const POI_CACHE_KEY = 'ena_pois_v1';
const POI_TTL_MS = 24 * 60 * 60 * 1000;
const UNDO_DURATION = 60 * 1000; // ★ 1分保持（ミリ秒）

function parseHHMM(t?: string) {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const CATEGORY_OPTIONS = [
  { key: 'earthquake', label: '地震' },
  { key: 'heavy_rain', label: '豪雨' },
  { key: 'landslide', label: '土砂災害' },
  { key: 'flood', label: '洪水' },
  { key: 'typhoon', label: '台風' },
  { key: 'other', label: 'その他' },
] as const;
type CategoryKey = typeof CATEGORY_OPTIONS[number]['key'];

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normalizePin(p: Pin): Pin {
  const kind = p.kind ?? (p.type === 'poi' ? 'poi' : 'disaster');
  const category =
    p.category ??
    (p.type === 'earthquake'
      ? 'earthquake'
      : p.type === 'landslide'
      ? 'landslide'
      : p.type === 'shelter'
      ? 'other'
      : p.type === 'misinfo'
      ? 'other'
      : p.type === 'decision'
      ? 'other'
      : 'other');
  const channel = p.channel ?? 'action';
  const date = p.date ?? todayYMD();
  return { ...p, kind, category, channel, date };
}

export default function App() {
  const [scenarioId, setScenarioId] = useState('default');
  const [events, setEvents] = useState<Pin[]>([]);
  const [pois, setPois] = useState<Pin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState({ events: false, pois: false });
  const [error, setError] = useState<{ events?: string; pois?: string }>({});
  const [undoStack, setUndoStack] = useState<{ event: Pin; timer: number }[]>([]); // ★Undo用

  const [enabledCats, setEnabledCats] = useState<Record<CategoryKey, boolean>>(() =>
    CATEGORY_OPTIONS.reduce(
      (acc, o) => ((acc[o.key as CategoryKey] = true), acc),
      {} as Record<CategoryKey, boolean>
    )
  );

  const [adding, setAdding] = useState(false);
  const [draftPos, setDraftPos] = useState<{ lat: number; lng: number } | null>(null);
  const [replay, setReplay] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(13 * 60);

  // --- イベント取得 ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading((s) => ({ ...s, events: true }));
      try {
        const r = await fetch(`/api/events?scenarioId=${encodeURIComponent(scenarioId)}`);
        if (!r.ok) throw new Error();
        const data: Pin[] = await r.json();
        if (!cancelled) setEvents(data);
      } catch {
        if (scenarioId === 'default') {
          const r2 = await fetch(EVENTS_FALLBACK);
          const data2: Pin[] = await r2.json();
          if (!cancelled) setEvents(data2);
        } else {
          if (!cancelled) setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading((s) => ({ ...s, events: false }));
      }
    })();
    return () => { cancelled = true; };
  }, [scenarioId]);

  // --- POI取得 ---
  useEffect(() => {
    (async () => {
      try {
        const cacheRaw = localStorage.getItem(POI_CACHE_KEY);
        if (cacheRaw) {
          const cache = JSON.parse(cacheRaw) as { at: number; data: Pin[] };
          if (Date.now() - cache.at < POI_TTL_MS) {
            setPois(cache.data);
            return;
          }
        }
        const data = await fetchPOIs();
        setPois(data);
        localStorage.setItem(POI_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
      } catch (e: any) {
        setError((e0) => ({ ...e0, pois: String(e?.message || e) }));
      }
    })();
  }, []);

  // --- ログ取得 ---
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const r = await fetch('/api/logs');
        if (!r.ok) throw new Error();
        const data: LogItem[] = await r.json();
        setLogs(data.slice().reverse());
      } catch {}
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // --- 時刻範囲 ---
  const [minMinute, maxMinute] = useMemo(() => {
    const times = events.map((e) => e.time).filter(Boolean) as string[];
    if (!times.length) return [13 * 60, 18 * 60];
    const mins = times.map(parseHHMM);
    return [Math.min(...mins), Math.max(...mins)];
  }, [events]);

  // --- フィルタリング ---
  const pins = useMemo(() => {
    const merged = [...events, ...pois].map(normalizePin);
    merged.sort((a, b) => parseHHMM(a.time) - parseHHMM(b.time));
    return merged;
  }, [events, pois]);

  const filteredPins = useMemo(() => {
    const enabled = new Set(Object.entries(enabledCats).filter(([_, v]) => v).map(([k]) => k));
    const result = pins.filter((p) => !p.category || enabled.has(p.category as string));
    if (!replay) return result;
    return result.filter((p) => !p.time || parseHHMM(p.time) <= currentMinute);
  }, [pins, enabledCats, replay, currentMinute]);

  // --- イベント追加 ---
  async function saveNewEvent(data: DraftEvent) {
    const payload = { ...data, scenarioId };
    const res = await fetch('/api/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`保存に失敗 (${res.status})`);
    const created: Pin = await res.json();
    setEvents((prev) => [...prev, created]);
    setAdding(false); setDraftPos(null); setSelectedId(created.id);
  }

  // --- 削除 + Undo対応 ---
  async function deleteEvent(id: string) {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    const ok = confirm(`イベント「${target.title}」を削除しますか？`);
    if (!ok) return;

    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('削除に失敗しました'); return; }

    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);

    // ★ Undoスタックに入れる（1分間保持）
    const timer = window.setTimeout(() => {
      setUndoStack((prev) => prev.filter((u) => u.event.id !== id));
    }, UNDO_DURATION);
    setUndoStack((prev) => [...prev, { event: target, timer }]);

    // ログ追加
    await fetch('/api/logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor: 'User', action: 'イベント削除', payload: { id } }),
    });
  }

  async function undoDelete() {
    const last = undoStack.at(-1);
    if (!last) return;
    clearTimeout(last.timer);
    setUndoStack((prev) => prev.slice(0, -1));

    // サーバーに再登録
    const res = await fetch('/api/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(last.event),
    });
    const restored = await res.json();
    setEvents((prev) => [...prev, restored]);
    alert(`イベント「${restored.title}」を元に戻しました。`);
  }

  // --- UI ---
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 280px', height: '100vh' }}>
      {/* 再生バー */}
      <div
        style={{
          position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(255,255,255,0.95)', border: '1px solid #ddd',
          borderRadius: 10, padding: '8px 12px', boxShadow: '0 2px 10px rgba(0,0,0,.06)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <span style={{ fontWeight: 600 }}>再生</span>
        <button onClick={() => setCurrentMinute((p) => Math.max(p - 10, minMinute))}>⏪ -10分</button>
        <TimeControl minutesRange={[minMinute, maxMinute]} value={currentMinute} onChange={setCurrentMinute} />
        <button onClick={() => setCurrentMinute((p) => Math.min(p + 10, maxMinute))}>+10分 ⏩</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={replay} onChange={(e) => setReplay(e.target.checked)} />
          <span>時刻で表示を制限</span>
        </label>
      </div>

      {/* 左 */}
      <div style={{ padding: 10, overflow: 'auto' }}>
        <ScenarioSelect value={scenarioId} onChange={setScenarioId} />

        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>表示フィルター</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {CATEGORY_OPTIONS.map((opt) => (
              <label key={opt.key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={!!enabledCats[opt.key as CategoryKey]}
                  onChange={(e) => setEnabledCats((p) => ({ ...p, [opt.key]: e.target.checked }))}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <ParticipantsPanel scenarioId={scenarioId} />
        </div>

        <div style={{ marginTop: 10 }}>
          <button
            className="btn primary"
            onClick={() => { setAdding(true); setDraftPos(null); }}
            title="地図をクリックして位置を選択"
          >
            ＋ イベント追加
          </button>
          {adding && <span style={{ marginLeft: 8 }}>地図をクリックで位置選択</span>}

          <Timeline
            pins={filteredPins}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              const target = pins.find((p) => p.id === id);
              if (replay && target?.time) setCurrentMinute(parseHHMM(target.time));
            }}
            onDelete={deleteEvent} // ★ 削除対応
          />
        </div>
      </div>

      {/* 地図 */}
      <div className="map-wrap" style={{ position: 'relative' }}>
        <MapView
          pins={filteredPins}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMapClick={(lat, lng) => adding && setDraftPos({ lat, lng })}
          draft={draftPos}
        />
      </div>

      <LogPanel logs={logs} />

      {adding && draftPos && (
        <AddEventForm
          draft={draftPos}
          onCancel={() => { setAdding(false); setDraftPos(null); }}
          onSave={saveNewEvent}
        />
      )}

      {/* ★ Undoボタン（右下に60秒間表示） */}
      {undoStack.length > 0 && (
        <div
          style={{
            position: 'fixed', bottom: 20, right: 20,
            background: '#333', color: '#fff', padding: '10px 16px',
            borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,.3)',
            cursor: 'pointer', fontWeight: 600, zIndex: 2000,
          }}
          onClick={undoDelete}
        >
          ↩️ 削除を元に戻す（1分以内）
        </div>
      )}
    </div>
  );
}
