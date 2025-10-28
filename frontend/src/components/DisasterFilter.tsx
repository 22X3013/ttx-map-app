import { DisasterCategory } from "../types";
import { categoryLabel } from "../styles/legend";

const ALL: DisasterCategory[] = ["earthquake","heavy_rain","landslide","flood","typhoon","other"];

export default function DisasterFilter({
  selected, onChange,
}: { selected: DisasterCategory[]; onChange: (v: DisasterCategory[]) => void; }) {
  function toggle(cat: DisasterCategory) {
    onChange(selected.includes(cat) ? selected.filter(c => c !== cat) : [...selected, cat]);
  }
  function allOn(v: boolean) { onChange(v ? [...ALL] : []); }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm opacity-70">災害カテゴリ:</span>
      {ALL.map(cat => (
        <button
          key={cat}
          className={`px-2 py-1 rounded border text-sm ${selected.includes(cat) ? "bg-black text-white" : "bg-white"}`}
          onClick={() => toggle(cat)}
        >
          {categoryLabel[cat]}
        </button>
      ))}
      <button className="ml-2 text-xs underline" onClick={() => allOn(true)}>全選択</button>
      <button className="text-xs underline" onClick={() => allOn(false)}>全解除</button>
    </div>
  );
}
