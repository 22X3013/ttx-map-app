import { useMemo, useState } from 'react';

export type LogItem = {
  id: string;
  time: string;   // ISO
  actor: string;  // User/Systemなど
  action: string; // 例: イベント作成 / マーカークリック
  payload?: Record<string, any>;
};

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const ss = String(d.getSeconds()).padStart(2,'0');
    return `${hh}:${mm}:${ss}`;
  } catch { return iso; }
}

function describe(item: LogItem) {
  const p = item.payload || {};
  switch (item.action) {
    case 'イベント作成':
      return `「${p.title ?? '無題'}」を作成（${p.category ?? 'その他'} / ${p.kind ?? 'イベント'}）`;
    case 'マーカークリック':
      return `地図上の「${p.title ?? '（無題）'}」を選択`;
    default:
      return item.action;
  }
}

export default function LogPanel({ logs }: { logs: LogItem[] }) {
  const [showDebug, setShowDebug] = useState(false);
  const list = useMemo(() => logs ?? [], [logs]);

  return (
    <div style={{ borderLeft:'1px solid #e5e7eb', height:'100vh', overflow:'auto', padding:10, background:'#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ fontWeight:700 }}>ログ</div>
        <label style={{ fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
          <input type="checkbox" checked={showDebug} onChange={e=>setShowDebug(e.target.checked)} />
          デバッグ表示（詳細）
        </label>
      </div>

      {list.length === 0 && <div style={{ opacity:.6, fontSize:12 }}>（ログはまだありません）</div>}

      <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:8 }}>
        {list.map(it => (
          <li key={it.id} style={{ border:'1px solid #eee', borderRadius:8, padding:'8px 10px', background:'#fafafa' }}>
            <div style={{ fontSize:12, color:'#6b7280' }}>{fmtTime(it.time)}・{it.actor}</div>
            <div style={{ fontSize:14, marginTop:2 }}>{describe(it)}</div>
            {showDebug && it.payload && (
              <details style={{ marginTop:6 }}>
                <summary style={{ cursor:'pointer', fontSize:12, color:'#6b7280' }}>payload</summary>
                <pre style={{ fontSize:12, margin:0, background:'#fff', border:'1px solid #eee', borderRadius:6, padding:8, overflow:'auto' }}>
{JSON.stringify(it.payload, null, 2)}
                </pre>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
