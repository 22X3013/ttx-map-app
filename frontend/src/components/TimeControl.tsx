import { useEffect, useMemo, useRef, useState } from "react";

export default function TimeControl({
  minutesRange,
  value,
  onChange,
}: {
  minutesRange: [number, number];                 // [min, max] 分
  value: number;                                  // 現在の分
  onChange: (v: number | ((prev: number) => number)) => void; // ← 修正：ユニオン型
}) {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  const [minM, maxM] = minutesRange;
  const label = useMemo(() => {
    const h = Math.floor(value / 60).toString().padStart(2, "0");
    const m = (value % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }, [value]);

  useEffect(() => {
    if (!playing) {
      if (timer.current) { window.clearInterval(timer.current); timer.current = null; }
      return;
    }
    timer.current = window.setInterval(() => {
      onChange((prev: number) => {
        const next = prev + 1;
        return next > maxM ? minM : next;
      });
    }, 700);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [playing, minM, maxM, onChange]);

  return (
    <div style={{display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:8, alignItems:"center", padding:"8px 10px", border:"1px solid #ddd", borderRadius:8, background:"#fff"}}>
      <button className="btn" onClick={() => setPlaying(p => !p)}>
        {playing ? "一時停止" : "再生"}
      </button>
      <input
        type="range"
        min={minM}
        max={maxM}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span style={{fontFamily:"ui-monospace,monospace"}}>{label}</span>
      <button className="btn" onClick={() => onChange(minM)}>⏮︎</button>
    </div>
  );
}
