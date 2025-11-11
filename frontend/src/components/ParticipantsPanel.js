import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
// 役割プリセット（画像の例に合わせて）
const ROLE_PRESETS = [
    { key: 'local_gov', label: '自治体（防災課）', icon: '🏠', color: '#ea580c' },
    { key: 'fire_police', label: '消防／警察', icon: '🚒／🚓', color: '#ef4444' },
    { key: 'hospital', label: '病院', icon: '🚑', color: '#0ea5e9' },
    { key: 'city_office', label: '恵那市役所（総務課）', icon: '🏢', color: '#6366f1' },
    { key: 'volunteer', label: 'ボランティア団体', icon: '🧑‍🤝‍🧑', color: '#16a34a' },
    { key: 'ict', label: 'ICT（情報通信技術）担当', icon: '🌐', color: '#0ea5e9' },
];
export default function ParticipantsPanel({ scenarioId }) {
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [roleKey, setRoleKey] = useState('');
    const [icon, setIcon] = useState('例：🚑');
    const [color, setColor] = useState('#ef4444');
    const [err, setErr] = useState(null);
    const disabled = !name.trim() || !roleKey;
    async function refresh() {
        try {
            const res = await fetch(`/api/participants?scenarioId=${encodeURIComponent(scenarioId)}`);
            if (!res.ok)
                throw new Error(String(res.status));
            const data = await res.json();
            setItems(data.items);
            setErr(null);
        }
        catch {
            setErr('参加者の取得に失敗しました');
        }
    }
    useEffect(() => { refresh(); /* シナリオ切替時に再取得 */ }, [scenarioId]);
    // 役割選択時に推奨アイコン/色を自動セット
    function handleRoleChange(v) {
        setRoleKey(v);
        const p = ROLE_PRESETS.find(r => r.key === v);
        if (p) {
            setIcon(p.icon);
            setColor(p.color);
        }
    }
    async function add() {
        if (disabled)
            return;
        try {
            const preset = ROLE_PRESETS.find(r => r.key === roleKey);
            await fetch('/api/participants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenarioId, // ★ シナリオに紐づけて追加
                    name: name.trim(),
                    role: preset.label,
                    icon,
                    color,
                }),
            });
            setName('');
            setRoleKey(''); // 入力リセット
            refresh();
        }
        catch {
            setErr('参加者の追加に失敗しました');
        }
    }
    async function remove(id) {
        try {
            await fetch(`/api/participants/${id}`, { method: 'DELETE' });
            refresh();
        }
        catch {
            setErr('参加者の削除に失敗しました');
        }
    }
    return (_jsxs("div", { className: "card p-2", children: [_jsx("div", { className: "section-title", children: "\u53C2\u52A0\u8005" }), _jsx("div", { className: "mb-2 text-xs", style: { color: '#555' }, children: "\u6240\u5C5E/\u5F79\u5272\u3092\u9078\u3076\u3068\u3001\u63A8\u5968\u306E\u30A2\u30A4\u30B3\u30F3\u3068\u8272\u304C\u81EA\u52D5\u8A2D\u5B9A\u3055\u308C\u307E\u3059\u3002" }), _jsxs("div", { className: "flex gap-2 items-end mb-3", style: { flexWrap: 'wrap' }, children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs", children: "\u540D\u524D" }), _jsx("input", { className: "input", value: name, onChange: e => setName(e.target.value), placeholder: "\u4F8B\uFF1A\u5C71\u7530" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs", children: "\u6240\u5C5E/\u5F79\u5272" }), _jsxs("select", { className: "input", value: roleKey, onChange: e => handleRoleChange(e.target.value), children: [_jsx("option", { value: "", children: "\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044" }), ROLE_PRESETS.map(r => _jsx("option", { value: r.key, children: r.label }, r.key))] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs", children: "\u30A2\u30A4\u30B3\u30F3" }), _jsx("input", { className: "input", value: icon, onChange: e => setIcon(e.target.value), style: { width: 64, textAlign: 'center' } })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs", children: "\u8272" }), _jsx("input", { className: "input", type: "color", value: color, onChange: e => setColor(e.target.value) })] }), _jsx("button", { className: "btn primary", onClick: add, disabled: disabled, children: "\u8FFD\u52A0" })] }), err && _jsx("div", { className: "error-inline", style: { color: '#b91c1c', marginBottom: 8 }, children: err }), _jsxs("ul", { className: "space-y-1", children: [items.map(p => (_jsxs("li", { className: "row", children: [_jsxs("span", { className: "pill", style: { borderColor: p.color || '#ccc', color: p.color || '#111' }, children: [_jsx("span", { style: { marginRight: 6 }, children: p.icon ?? '👤' }), p.name, p.role ? `（${p.role}）` : ''] }), _jsx("button", { className: "link", onClick: () => remove(p.id), children: "\u524A\u9664" })] }, p.id))), items.length === 0 && _jsx("li", { className: "text-sm opacity-70", children: "\uFF08\u53C2\u52A0\u8005\u304C\u3044\u307E\u305B\u3093\uFF09" })] })] }));
}
