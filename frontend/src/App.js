import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import Timeline from './components/Timeline';
import AddEventForm from './components/AddEventForm';
import LogPanel from './components/LogPanel';
import ScenarioSelect from './components/ScenarioSelect';
import TimeControl from './components/TimeControl';
import { fetchPOIs } from './osm/fetchPOIs';
import ParticipantsPanel from './components/ParticipantsPanel';
// ---- 定数 ----
const EVENTS_FALLBACK = '/events.json';
const POI_CACHE_KEY = 'ena_pois_v1';
const POI_TTL_MS = 24 * 60 * 60 * 1000;
const UNDO_DURATION = 60 * 1000; // ★ 1分保持（ミリ秒）
function parseHHMM(t) {
    if (!t)
        return Number.MAX_SAFE_INTEGER;
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
];
function todayYMD() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function normalizePin(p) {
    const kind = p.kind ?? (p.type === 'poi' ? 'poi' : 'disaster');
    const category = p.category ??
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
    const [events, setEvents] = useState([]);
    const [pois, setPois] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState({ events: false, pois: false });
    const [error, setError] = useState({});
    const [undoStack, setUndoStack] = useState([]); // ★Undo用
    const [enabledCats, setEnabledCats] = useState(() => CATEGORY_OPTIONS.reduce((acc, o) => ((acc[o.key] = true), acc), {}));
    const [adding, setAdding] = useState(false);
    const [draftPos, setDraftPos] = useState(null);
    const [replay, setReplay] = useState(false);
    const [currentMinute, setCurrentMinute] = useState(13 * 60);
    // --- イベント取得 ---
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading((s) => ({ ...s, events: true }));
            try {
                const r = await fetch(`/api/events?scenarioId=${encodeURIComponent(scenarioId)}`);
                if (!r.ok)
                    throw new Error();
                const data = await r.json();
                if (!cancelled)
                    setEvents(data);
            }
            catch {
                if (scenarioId === 'default') {
                    const r2 = await fetch(EVENTS_FALLBACK);
                    const data2 = await r2.json();
                    if (!cancelled)
                        setEvents(data2);
                }
                else {
                    if (!cancelled)
                        setEvents([]);
                }
            }
            finally {
                if (!cancelled)
                    setLoading((s) => ({ ...s, events: false }));
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
                    const cache = JSON.parse(cacheRaw);
                    if (Date.now() - cache.at < POI_TTL_MS) {
                        setPois(cache.data);
                        return;
                    }
                }
                const data = await fetchPOIs();
                setPois(data);
                localStorage.setItem(POI_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
            }
            catch (e) {
                setError((e0) => ({ ...e0, pois: String(e?.message || e) }));
            }
        })();
    }, []);
    // --- ログ取得 ---
    useEffect(() => {
        const timer = setInterval(async () => {
            try {
                const r = await fetch('/api/logs');
                if (!r.ok)
                    throw new Error();
                const data = await r.json();
                setLogs(data.slice().reverse());
            }
            catch { }
        }, 5000);
        return () => clearInterval(timer);
    }, []);
    // --- 時刻範囲 ---
    const [minMinute, maxMinute] = useMemo(() => {
        const times = events.map((e) => e.time).filter(Boolean);
        if (!times.length)
            return [13 * 60, 18 * 60];
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
        const result = pins.filter((p) => !p.category || enabled.has(p.category));
        if (!replay)
            return result;
        return result.filter((p) => !p.time || parseHHMM(p.time) <= currentMinute);
    }, [pins, enabledCats, replay, currentMinute]);
    // --- イベント追加 ---
    async function saveNewEvent(data) {
        const payload = { ...data, scenarioId };
        const res = await fetch('/api/events', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (!res.ok)
            throw new Error(`保存に失敗 (${res.status})`);
        const created = await res.json();
        setEvents((prev) => [...prev, created]);
        setAdding(false);
        setDraftPos(null);
        setSelectedId(created.id);
    }
    // --- 削除 + Undo対応 ---
    async function deleteEvent(id) {
        const target = events.find((e) => e.id === id);
        if (!target)
            return;
        const ok = confirm(`イベント「${target.title}」を削除しますか？`);
        if (!ok)
            return;
        const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            alert('削除に失敗しました');
            return;
        }
        setEvents((prev) => prev.filter((e) => e.id !== id));
        if (selectedId === id)
            setSelectedId(null);
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
        if (!last)
            return;
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
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '320px 1fr 280px', height: '100vh' }, children: [_jsxs("div", { style: {
                    position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000, background: 'rgba(255,255,255,0.95)', border: '1px solid #ddd',
                    borderRadius: 10, padding: '8px 12px', boxShadow: '0 2px 10px rgba(0,0,0,.06)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }, children: [_jsx("span", { style: { fontWeight: 600 }, children: "\u518D\u751F" }), _jsx("button", { onClick: () => setCurrentMinute((p) => Math.max(p - 10, minMinute)), children: "\u23EA -10\u5206" }), _jsx(TimeControl, { minutesRange: [minMinute, maxMinute], value: currentMinute, onChange: setCurrentMinute }), _jsx("button", { onClick: () => setCurrentMinute((p) => Math.min(p + 10, maxMinute)), children: "+10\u5206 \u23E9" }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("input", { type: "checkbox", checked: replay, onChange: (e) => setReplay(e.target.checked) }), _jsx("span", { children: "\u6642\u523B\u3067\u8868\u793A\u3092\u5236\u9650" })] })] }), _jsxs("div", { style: { padding: 10, overflow: 'auto' }, children: [_jsx(ScenarioSelect, { value: scenarioId, onChange: setScenarioId }), _jsxs("div", { style: { marginTop: 8 }, children: [_jsx("div", { style: { fontWeight: 700, marginBottom: 6 }, children: "\u8868\u793A\u30D5\u30A3\u30EB\u30BF\u30FC" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }, children: CATEGORY_OPTIONS.map((opt) => (_jsxs("label", { style: { display: 'flex', gap: 6, alignItems: 'center' }, children: [_jsx("input", { type: "checkbox", checked: !!enabledCats[opt.key], onChange: (e) => setEnabledCats((p) => ({ ...p, [opt.key]: e.target.checked })) }), _jsx("span", { children: opt.label })] }, opt.key))) })] }), _jsx("div", { style: { marginTop: 10 }, children: _jsx(ParticipantsPanel, { scenarioId: scenarioId }) }), _jsxs("div", { style: { marginTop: 10 }, children: [_jsx("button", { className: "btn primary", onClick: () => { setAdding(true); setDraftPos(null); }, title: "\u5730\u56F3\u3092\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u4F4D\u7F6E\u3092\u9078\u629E", children: "\uFF0B \u30A4\u30D9\u30F3\u30C8\u8FFD\u52A0" }), adding && _jsx("span", { style: { marginLeft: 8 }, children: "\u5730\u56F3\u3092\u30AF\u30EA\u30C3\u30AF\u3067\u4F4D\u7F6E\u9078\u629E" }), _jsx(Timeline, { pins: filteredPins, selectedId: selectedId, onSelect: (id) => {
                                    setSelectedId(id);
                                    const target = pins.find((p) => p.id === id);
                                    if (replay && target?.time)
                                        setCurrentMinute(parseHHMM(target.time));
                                }, onDelete: deleteEvent })] })] }), _jsx("div", { className: "map-wrap", style: { position: 'relative' }, children: _jsx(MapView, { pins: filteredPins, selectedId: selectedId, onSelect: setSelectedId, onMapClick: (lat, lng) => adding && setDraftPos({ lat, lng }), draft: draftPos }) }), _jsx(LogPanel, { logs: logs }), adding && draftPos && (_jsx(AddEventForm, { draft: draftPos, onCancel: () => { setAdding(false); setDraftPos(null); }, onSave: saveNewEvent })), undoStack.length > 0 && (_jsx("div", { style: {
                    position: 'fixed', bottom: 20, right: 20,
                    background: '#333', color: '#fff', padding: '10px 16px',
                    borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,.3)',
                    cursor: 'pointer', fontWeight: 600, zIndex: 2000,
                }, onClick: undoDelete, children: "\u21A9\uFE0F \u524A\u9664\u3092\u5143\u306B\u623B\u3059\uFF081\u5206\u4EE5\u5185\uFF09" }))] }));
}
