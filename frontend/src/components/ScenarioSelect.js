import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export default function ScenarioSelect({ value, onChange, }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const r = await fetch('/api/scenarios');
                const data = await r.json();
                setItems(data);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    async function addScenario() {
        const name = prompt('新しいシナリオ名を入力してください', '演習シナリオ');
        if (!name)
            return;
        const r = await fetch('/api/scenarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (!r.ok)
            return alert('作成に失敗しました');
        const created = await r.json();
        setItems((prev) => [...prev, created]);
        onChange(created.id);
    }
    return (_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }, children: [_jsx("label", { style: { fontSize: 12, color: '#444' }, children: "\u30B7\u30CA\u30EA\u30AA\uFF1A" }), _jsx("select", { value: value, onChange: (e) => onChange(e.target.value), disabled: loading, style: { height: 30, borderRadius: 8, border: '1px solid #ddd', padding: '0 8px' }, children: items.length === 0 ? (_jsx("option", { value: "default", children: "default" })) : (items.map((s) => (_jsx("option", { value: s.id, children: s.name }, s.id)))) }), _jsx("button", { className: "btn", onClick: addScenario, children: "\uFF0B\u65B0\u898F" })] }));
}
