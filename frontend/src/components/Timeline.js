import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from 'react';
const kindJa = { disaster: '災害', shelter: '避難所', misinfo: '誤情報', decision: '意思決定', poi: '施設' };
const categoryJa = { earthquake: '地震', heavy_rain: '豪雨', landslide: '土砂災害', flood: '洪水', typhoon: '台風', other: 'その他' };
const channelStyle = {
    action: { color: '#2563eb', icon: '🛠️', label: '行動' },
    report: { color: '#16a34a', icon: '📣', label: '通報' },
    damage: { color: '#dc2626', icon: '💥', label: '被害' },
    request: { color: '#a855f7', icon: '🤝', label: '要請' },
};
const placeJa = {
    Iinsendacho: '飯地町', Iisendacho: '飯地町', Ena: '恵那',
    'Ena Elementary': '恵那小学校', 'Ena Elementary School': '恵那小学校',
    'Elementary School': '小学校', 'Nakano River': '中野川',
};
function toJaTitle(title, kind, category) {
    const rules = [
        { re: /^Earthquake\b/i, ja: '地震' },
        { re: /^Evacuation Center Opened\b/i, ja: '避難所開設' },
        { re: /^Misinformation flagged\b/i, ja: '誤情報を検知' },
        { re: /^Decision to issue advisories\b/i, ja: '避難情報の発令判断' },
        { re: /^Decision\b/i, ja: '意思決定' },
        { re: /^Approve\b/i, ja: '承認' },
    ];
    let out = title.trim();
    for (const r of rules) {
        if (r.re.test(out)) {
            out = out.replace(r.re, r.ja);
            break;
        }
    }
    if (out === title) {
        const head = category && categoryJa[category] ? categoryJa[category] : (kind && kindJa[kind] ? kindJa[kind] : '');
        if (head)
            out = `${head} ${out}`;
    }
    out = out.replace(/\(([^)]+)\)/g, (_m, inner) => {
        const ja = inner.split(/,\s*|\s*\/\s*|\s*;\s*|\s+/).filter(Boolean).map((w) => placeJa[w] ?? w).join('・');
        return `（${ja}）`;
    });
    return out;
}
function formatDay(ymd) {
    if (!ymd)
        return '';
    const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const w = '日月火水木金土'[dt.getDay()];
    return `${y}年${m}月${d}日（${w}）`;
}
export default function Timeline({ pins, selectedId, onSelect, onDelete, // ★ onDelete追加
 }) {
    const scenario = useMemo(() => pins.filter((p) => p.time).slice().sort((a, b) => {
        const ad = (a.date ?? '').localeCompare(b.date ?? '');
        return ad !== 0 ? ad : a.time.localeCompare(b.time);
    }), [pins]);
    const grouped = useMemo(() => {
        const m = new Map();
        for (const p of scenario) {
            const k = p.date ?? 'unknown';
            (m.get(k) ?? m.set(k, []).get(k)).push(p);
        }
        return Array.from(m.entries());
    }, [scenario]);
    const rowRefs = useRef({});
    useEffect(() => { const el = selectedId ? rowRefs.current[selectedId] : null; el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [selectedId]);
    return (_jsxs("aside", { style: { paddingRight: 8 }, children: [_jsx("h2", { className: "timeline-title", children: "\u30BF\u30A4\u30E0\u30E9\u30A4\u30F3" }), grouped.map(([day, rows]) => (_jsxs("div", { children: [_jsx("div", { className: "tl-date-head", children: formatDay(day) }), _jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }, children: rows.map((p) => {
                            const label = toJaTitle(p.title, p.kind, p.category);
                            const cat = p.category ? categoryJa[p.category] : '';
                            const chs = p.channel ? channelStyle[p.channel] : undefined;
                            const active = selectedId === p.id;
                            return (_jsxs("li", { ref: (el) => { rowRefs.current[p.id] = el; }, className: active ? 'tl-row active' : 'tl-row', style: { borderLeft: chs ? `6px solid ${chs.color}` : undefined, position: 'relative' }, children: [_jsxs("button", { onClick: () => onSelect(p.id), className: "tl-card", "aria-selected": active, children: [_jsxs("div", { className: "tl-title", children: [p.time, " ", label] }), _jsxs("div", { className: "tl-type", children: [cat, chs && _jsx("span", { style: { marginLeft: 8 }, title: chs.label, children: chs.icon })] })] }), _jsx("button", { title: "\u524A\u9664", onClick: (e) => { e.stopPropagation(); onDelete(p.id); }, style: {
                                            position: 'absolute',
                                            right: 6, top: 6,
                                            border: '1px solid #ccc',
                                            background: '#fff',
                                            borderRadius: 6,
                                            padding: '2px 6px',
                                            cursor: 'pointer',
                                            opacity: .7
                                        }, onMouseEnter: e => e.currentTarget.style.opacity = '1', onMouseLeave: e => e.currentTarget.style.opacity = '.7', children: "\uD83D\uDDD1" })] }, p.id));
                        }) })] }, day))), grouped.length === 0 && _jsx("div", { className: "tl-empty", children: "\uFF08\u8868\u793A\u3059\u308B\u30A4\u30D9\u30F3\u30C8\u304C\u3042\u308A\u307E\u305B\u3093\uFF09" })] }));
}
