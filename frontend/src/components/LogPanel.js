import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
function fmtTime(iso) {
    try {
        const d = new Date(iso);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }
    catch {
        return iso;
    }
}
function describe(item) {
    const p = item.payload || {};
    switch (item.action) {
        case 'イベント作成':
            return `「${p.title ?? '無題'}」を作成（${p.category ?? 'その他'} / ${p.kind ?? 'イベント'}）`;
        case 'マーカークリック':
            return `地図上の「${p.title ?? '（無題）'}」を選択`;
        default:
            return item.action;
    }
}
export default function LogPanel({ logs }) {
    const [showDebug, setShowDebug] = useState(false);
    const list = useMemo(() => logs ?? [], [logs]);
    return (_jsxs("div", { style: { borderLeft: '1px solid #e5e7eb', height: '100vh', overflow: 'auto', padding: 10, background: '#fff' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, children: [_jsx("div", { style: { fontWeight: 700 }, children: "\u30ED\u30B0" }), _jsxs("label", { style: { fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("input", { type: "checkbox", checked: showDebug, onChange: e => setShowDebug(e.target.checked) }), "\u30C7\u30D0\u30C3\u30B0\u8868\u793A\uFF08\u8A73\u7D30\uFF09"] })] }), list.length === 0 && _jsx("div", { style: { opacity: .6, fontSize: 12 }, children: "\uFF08\u30ED\u30B0\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\uFF09" }), _jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }, children: list.map(it => (_jsxs("li", { style: { border: '1px solid #eee', borderRadius: 8, padding: '8px 10px', background: '#fafafa' }, children: [_jsxs("div", { style: { fontSize: 12, color: '#6b7280' }, children: [fmtTime(it.time), "\u30FB", it.actor] }), _jsx("div", { style: { fontSize: 14, marginTop: 2 }, children: describe(it) }), showDebug && it.payload && (_jsxs("details", { style: { marginTop: 6 }, children: [_jsx("summary", { style: { cursor: 'pointer', fontSize: 12, color: '#6b7280' }, children: "payload" }), _jsx("pre", { style: { fontSize: 12, margin: 0, background: '#fff', border: '1px solid #eee', borderRadius: 6, padding: 8, overflow: 'auto' }, children: JSON.stringify(it.payload, null, 2) })] }))] }, it.id))) })] }));
}
