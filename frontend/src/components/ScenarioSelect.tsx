import { useEffect, useState } from 'react';

export type Scenario = { id: string; name: string; createdAt: string };

export default function ScenarioSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [items, setItems] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/scenarios');
        const data: Scenario[] = await r.json();
        setItems(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addScenario() {
    const name = prompt('新しいシナリオ名を入力してください', '演習シナリオ');
    if (!name) return;
    const r = await fetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) return alert('作成に失敗しました');
    const created: Scenario = await r.json();
    setItems((prev) => [...prev, created]);
    onChange(created.id);
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <label style={{ fontSize: 12, color: '#444' }}>シナリオ：</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        style={{ height: 30, borderRadius: 8, border: '1px solid #ddd', padding: '0 8px' }}
      >
        {items.length === 0 ? (
          <option value="default">default</option>
        ) : (
          items.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))
        )}
      </select>
      <button className="btn" onClick={addScenario}>＋新規</button>
    </div>
  );
}
