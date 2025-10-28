import { useEffect, useState } from 'react';
import type { Participant } from '../types';

// 役割プリセット（画像の例に合わせて）
const ROLE_PRESETS = [
  { key: 'local_gov',  label: '自治体（防災課）',         icon: '🏠',     color: '#ea580c' },
  { key: 'fire_police',label: '消防／警察',               icon: '🚒／🚓', color: '#ef4444' },
  { key: 'hospital',   label: '病院',                     icon: '🚑',     color: '#0ea5e9' },
  { key: 'city_office',label: '恵那市役所（総務課）',     icon: '🏢',     color: '#6366f1' },
  { key: 'volunteer',  label: 'ボランティア団体',         icon: '🧑‍🤝‍🧑', color: '#16a34a' },
  { key: 'ict',        label: 'ICT（情報通信技術）担当',  icon: '🌐',     color: '#0ea5e9' },
] as const;
type RoleKey = typeof ROLE_PRESETS[number]['key'];

export default function ParticipantsPanel({ scenarioId }: { scenarioId: string }) {
  const [items, setItems] = useState<Participant[]>([]);
  const [name, setName] = useState('');
  const [roleKey, setRoleKey] = useState<RoleKey | ''>('');
  const [icon, setIcon] = useState('例：🚑');
  const [color, setColor] = useState('#ef4444');
  const [err, setErr] = useState<string | null>(null);
  const disabled = !name.trim() || !roleKey;

  async function refresh() {
    try {
      const res = await fetch(`/api/participants?scenarioId=${encodeURIComponent(scenarioId)}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setItems(data.items as Participant[]);
      setErr(null);
    } catch {
      setErr('参加者の取得に失敗しました');
    }
  }
  useEffect(() => { refresh(); /* シナリオ切替時に再取得 */ }, [scenarioId]);

  // 役割選択時に推奨アイコン/色を自動セット
  function handleRoleChange(v: string) {
    setRoleKey(v as RoleKey);
    const p = ROLE_PRESETS.find(r => r.key === v);
    if (p) { setIcon(p.icon); setColor(p.color); }
  }

  async function add() {
    if (disabled) return;
    try {
      const preset = ROLE_PRESETS.find(r => r.key === roleKey)!;
      await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,           // ★ シナリオに紐づけて追加
          name: name.trim(),
          role: preset.label,
          icon,
          color,
        }),
      });
      setName(''); setRoleKey(''); // 入力リセット
      refresh();
    } catch {
      setErr('参加者の追加に失敗しました');
    }
  }

  async function remove(id: string) {
    try {
      await fetch(`/api/participants/${id}`, { method: 'DELETE' });
      refresh();
    } catch {
      setErr('参加者の削除に失敗しました');
    }
  }

  return (
    <div className="card p-2">
      <div className="section-title">参加者</div>

      <div className="mb-2 text-xs" style={{ color:'#555' }}>
        所属/役割を選ぶと、推奨のアイコンと色が自動設定されます。
      </div>

      <div className="flex gap-2 items-end mb-3" style={{ flexWrap:'wrap' }}>
        <div>
          <div className="text-xs">名前</div>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="例：山田" />
        </div>

        <div>
          <div className="text-xs">所属/役割</div>
          <select className="input" value={roleKey} onChange={e=>handleRoleChange(e.target.value)}>
            <option value="">選択してください</option>
            {ROLE_PRESETS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <div className="text-xs">アイコン</div>
          <input className="input" value={icon} onChange={e=>setIcon(e.target.value)} style={{ width:64, textAlign:'center' }} />
        </div>

        <div>
          <div className="text-xs">色</div>
          <input className="input" type="color" value={color} onChange={e=>setColor(e.target.value)} />
        </div>

        <button className="btn primary" onClick={add} disabled={disabled}>追加</button>
      </div>

      {err && <div className="error-inline" style={{ color:'#b91c1c', marginBottom:8 }}>{err}</div>}

      <ul className="space-y-1">
        {items.map(p => (
          <li key={p.id} className="row">
            <span className="pill" style={{ borderColor: p.color || '#ccc', color: p.color || '#111' }}>
              <span style={{ marginRight: 6 }}>{p.icon ?? '👤'}</span>
              {p.name}{p.role ? `（${p.role}）` : ''}
            </span>
            <button className="link" onClick={() => remove(p.id)}>削除</button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm opacity-70">（参加者がいません）</li>}
      </ul>
    </div>
  );
}
