import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const KIND_OPTS = [
    { key: 'disaster', label: '災害イベント' },
    { key: 'shelter', label: '避難所' },
    { key: 'misinfo', label: '誤情報' },
    { key: 'decision', label: '意思決定' },
    { key: 'poi', label: '施設/POI' },
];
const CAT_OPTS = [
    { key: 'earthquake', label: '地震' },
    { key: 'heavy_rain', label: '豪雨' },
    { key: 'landslide', label: '土砂災害' },
    { key: 'flood', label: '洪水' },
    { key: 'typhoon', label: '台風' },
    { key: 'other', label: 'その他' },
];
const CH_OPTS = [
    { key: 'action', label: '行動' },
    { key: 'report', label: '通報' },
    { key: 'damage', label: '被害' },
    { key: 'request', label: '要請' },
];
function todayYMD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const da = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${da}`;
}
export default function AddEventForm({ draft, onCancel, onSave, }) {
    const [date, setDate] = useState(todayYMD());
    const [time, setTime] = useState('13:40');
    const [title, setTitle] = useState('');
    const [kind, setKind] = useState('disaster');
    const [category, setCategory] = useState('earthquake');
    const [channel, setChannel] = useState('action');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);
    const disabled = saving || !title || !time || !date;
    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setErr(null);
        try {
            await onSave({ lat: draft.lat, lng: draft.lng, date, time, title, kind, category, channel, note });
        }
        catch (e) {
            setErr(String(e?.message || e));
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "drawer", children: [_jsxs("div", { className: "drawer-header", children: [_jsx("div", { className: "drawer-title", children: "\u30A4\u30D9\u30F3\u30C8\u8FFD\u52A0" }), _jsx("button", { className: "btn ghost", onClick: onCancel, children: "\u2715" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "form", children: [_jsxs("div", { className: "row", children: [_jsx("label", { children: "\u65E5\u4ED8" }), _jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), required: true })] }), _jsxs("div", { className: "row", children: [_jsx("label", { children: "\u6642\u523B" }), _jsx("input", { type: "time", value: time, onChange: (e) => setTime(e.target.value), required: true })] }), _jsxs("div", { className: "row", children: [_jsx("label", { children: "\u4EF6\u540D" }), _jsx("input", { type: "text", placeholder: "\u4F8B\uFF1A\u907F\u96E3\u60C5\u5831\u306E\u767A\u4EE4\u5224\u65AD", value: title, onChange: (e) => setTitle(e.target.value), required: true })] }), _jsxs("div", { className: "row", children: [_jsx("label", { children: "\u7A2E\u985E" }), _jsx("select", { value: kind, onChange: (e) => setKind(e.target.value), children: KIND_OPTS.map(o => _jsx("option", { value: o.key, children: o.label }, o.key)) })] }), _jsxs("div", { className: "row", children: [_jsx("label", { children: "\u30AB\u30C6\u30B4\u30EA" }), _jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), children: CAT_OPTS.map(o => _jsx("option", { value: o.key, children: o.label }, o.key)) })] }), _jsxs("div", { className: "row", children: [_jsx("label", { children: "\u30C1\u30E3\u30F3\u30CD\u30EB" }), _jsx("select", { value: channel, onChange: (e) => setChannel(e.target.value), children: CH_OPTS.map(o => _jsx("option", { value: o.key, children: o.label }, o.key)) })] }), _jsxs("div", { className: "row", children: [_jsx("label", { children: "\u5099\u8003" }), _jsx("textarea", { rows: 3, value: note, onChange: (e) => setNote(e.target.value) })] }), _jsxs("div", { className: "hint", children: ["\u4F4D\u7F6E: ", draft.lat.toFixed(5), ", ", draft.lng.toFixed(5)] }), err && _jsxs("div", { className: "error-inline", children: ["\u4FDD\u5B58\u30A8\u30E9\u30FC: ", err] }), _jsxs("div", { className: "actions", children: [_jsx("button", { type: "button", className: "btn", onClick: onCancel, children: "\u30AD\u30E3\u30F3\u30BB\u30EB" }), _jsx("button", { type: "submit", className: "btn primary", disabled: disabled, children: saving ? '保存中...' : '保存' })] })] })] }));
}
