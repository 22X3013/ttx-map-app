import { useState } from 'react';
import type { Pin, EventKind, DisasterCategory, Channel } from '../types';

export type DraftEvent = {
  lat: number; lng: number;
  date: string; time: string; title: string;
  kind: EventKind; category: DisasterCategory; channel: Channel;
  note?: string;
};

const KIND_OPTS: { key: EventKind; label: string }[] = [
  { key: 'disaster', label: '災害イベント' },
  { key: 'shelter',  label: '避難所' },
  { key: 'misinfo',  label: '誤情報' },
  { key: 'decision', label: '意思決定' },
  { key: 'poi',      label: '施設/POI' },
];

const CAT_OPTS: { key: DisasterCategory; label: string }[] = [
  { key: 'earthquake', label: '地震' },
  { key: 'heavy_rain', label: '豪雨' },
  { key: 'landslide',  label: '土砂災害' },
  { key: 'flood',      label: '洪水' },
  { key: 'typhoon',    label: '台風' },
  { key: 'other',      label: 'その他' },
];

const CH_OPTS: { key: Channel; label: string }[] = [
  { key: 'action',  label: '行動' },
  { key: 'report',  label: '通報' },
  { key: 'damage',  label: '被害' },
  { key: 'request', label: '要請' },
];

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear(); const m = `${d.getMonth() + 1}`.padStart(2, '0'); const da = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${da}`;
}

export default function AddEventForm({
  draft, onCancel, onSave,
}: {
  draft: { lat: number; lng: number };
  onCancel: () => void;
  onSave: (data: DraftEvent) => Promise<void>;
}) {
  const [date, setDate] = useState<string>(todayYMD());
  const [time, setTime] = useState('13:40');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<EventKind>('disaster');
  const [category, setCategory] = useState<DisasterCategory>('earthquake');
  const [channel, setChannel] = useState<Channel>('action');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const disabled = saving || !title || !time || !date;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      await onSave({ lat: draft.lat, lng: draft.lng, date, time, title, kind, category, channel, note });
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally { setSaving(false); }
  }

  return (
    <div className="drawer">
      <div className="drawer-header">
        <div className="drawer-title">イベント追加</div>
        <button className="btn ghost" onClick={onCancel}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="row"><label>日付</label><input type="date" value={date} onChange={(e)=>setDate(e.target.value)} required /></div>
        <div className="row"><label>時刻</label><input type="time" value={time} onChange={(e)=>setTime(e.target.value)} required /></div>
        <div className="row"><label>件名</label><input type="text" placeholder="例：避難情報の発令判断" value={title} onChange={(e)=>setTitle(e.target.value)} required /></div>
        <div className="row"><label>種類</label><select value={kind} onChange={(e)=>setKind(e.target.value as EventKind)}>{KIND_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}</select></div>
        <div className="row"><label>カテゴリ</label><select value={category} onChange={(e)=>setCategory(e.target.value as DisasterCategory)}>{CAT_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}</select></div>
        <div className="row"><label>チャンネル</label><select value={channel} onChange={(e)=>setChannel(e.target.value as Channel)}>{CH_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}</select></div>
        <div className="row"><label>備考</label><textarea rows={3} value={note} onChange={(e)=>setNote(e.target.value)} /></div>
        <div className="hint">位置: {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</div>
        {err && <div className="error-inline">保存エラー: {err}</div>}
        <div className="actions">
          <button type="button" className="btn" onClick={onCancel}>キャンセル</button>
          <button type="submit" className="btn primary" disabled={disabled}>{saving ? '保存中...' : '保存'}</button>
        </div>
      </form>
    </div>
  );
}
