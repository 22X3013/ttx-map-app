import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
export default function TimeControl({ minutesRange, value, onChange, }) {
    const [playing, setPlaying] = useState(false);
    const timer = useRef(null);
    const [minM, maxM] = minutesRange;
    const label = useMemo(() => {
        const h = Math.floor(value / 60).toString().padStart(2, "0");
        const m = (value % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
    }, [value]);
    useEffect(() => {
        if (!playing) {
            if (timer.current) {
                window.clearInterval(timer.current);
                timer.current = null;
            }
            return;
        }
        timer.current = window.setInterval(() => {
            onChange((prev) => {
                const next = prev + 1;
                return next > maxM ? minM : next;
            });
        }, 700);
        return () => { if (timer.current)
            window.clearInterval(timer.current); };
    }, [playing, minM, maxM, onChange]);
    return (_jsxs("div", { style: { display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 8, alignItems: "center", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }, children: [_jsx("button", { className: "btn", onClick: () => setPlaying(p => !p), children: playing ? "一時停止" : "再生" }), _jsx("input", { type: "range", min: minM, max: maxM, value: value, onChange: (e) => onChange(Number(e.target.value)) }), _jsx("span", { style: { fontFamily: "ui-monospace,monospace" }, children: label }), _jsx("button", { className: "btn", onClick: () => onChange(minM), children: "\u23EE\uFE0E" })] }));
}
