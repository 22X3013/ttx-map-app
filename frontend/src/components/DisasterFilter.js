import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { categoryLabel } from "../styles/legend";
const ALL = ["earthquake", "heavy_rain", "landslide", "flood", "typhoon", "other"];
export default function DisasterFilter({ selected, onChange, }) {
    function toggle(cat) {
        onChange(selected.includes(cat) ? selected.filter(c => c !== cat) : [...selected, cat]);
    }
    function allOn(v) { onChange(v ? [...ALL] : []); }
    return (_jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [_jsx("span", { className: "text-sm opacity-70", children: "\u707D\u5BB3\u30AB\u30C6\u30B4\u30EA:" }), ALL.map(cat => (_jsx("button", { className: `px-2 py-1 rounded border text-sm ${selected.includes(cat) ? "bg-black text-white" : "bg-white"}`, onClick: () => toggle(cat), children: categoryLabel[cat] }, cat))), _jsx("button", { className: "ml-2 text-xs underline", onClick: () => allOn(true), children: "\u5168\u9078\u629E" }), _jsx("button", { className: "text-xs underline", onClick: () => allOn(false), children: "\u5168\u89E3\u9664" })] }));
}
