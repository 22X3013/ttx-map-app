import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DBData, Event, Participant } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.resolve(__dirname, "../db/data.json");

const adapter = new JSONFile<DBData>(file);
export const db = new Low<DBData>(adapter, {
  scenarios: [],
  events: [],
  logs: [],
  participants: [],
});

export async function initDB() {
  await db.read();
  const base: DBData = { scenarios: [], events: [], logs: [], participants: [] };
  db.data = Object.assign(base, db.data || {});
  db.data.scenarios ||= [];
  db.data.events ||= [];
  db.data.logs ||= [];
  db.data.participants ||= [];
  await db.write();
}

/** 日付/時刻からISOを生成（ローカルタイム基準） */
export function toISO(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0).toISOString();
}

/** イベント検索用 */
export type EventQuery = {
  scenarioId?: string;
  category?: string; // カンマ区切り可
  channel?: string;  // カンマ区切り可
  dateFrom?: string;
  dateTo?: string;
};

export function queryEvents(q: EventQuery) {
  const scenarioId = q.scenarioId?.trim() || "default";
  const cats = q.category ? q.category.split(",") : null;
  const chs = q.channel ? q.channel.split(",") : null;
  const df = q.dateFrom;
  const dt = q.dateTo;

  return db.data!.events.filter((e) => {
    if (e.scenarioId !== scenarioId) return false;
    if (cats && !cats.includes(e.category)) return false;
    if (chs && !chs.includes(e.channel)) return false;
    if (df && e.date < df) return false;
    if (dt && e.date > dt) return false;
    return true;
  });
}

export function addEvent(ev: Event) {
  db.data!.events.push(ev);
}
// 既存の addEvent などの下あたりに追加
export function removeEvent(id: string) {
  const before = db.data!.events.length;
  db.data!.events = db.data!.events.filter(e => e.id !== id);
  return db.data!.events.length !== before; // true=削除された
}

// 参加者: ラッパ（現状未使用でも残してOK）
export function listParticipants() { return db.data!.participants; }
export function addParticipant(p: Participant) { db.data!.participants.push(p); }
export function removeParticipant(id: string) {
  const before = db.data!.participants.length;
  db.data!.participants = db.data!.participants.filter((x) => x.id !== id);
  return db.data!.participants.length !== before;
}
