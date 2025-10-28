// backend/src/server.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { db, initDB, toISO, queryEvents, addEvent } from "./db.js";
import type { Event, LogItem, Scenario, Participant } from "./types.js";

const app = express();

// --- Middlewares ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --- DB 初期化 ---
await initDB();

// default シナリオを保証
if (!db.data!.scenarios.find((s) => s.id === "default")) {
  db.data!.scenarios.push({
    id: "default",
    name: "default",
    createdAt: new Date().toISOString(),
  });
  await db.write();
}

// ヘルパー
function getScenarioId(q: unknown): string {
  const s = (q as any)?.scenarioId;
  return typeof s === "string" && s.trim() ? s : "default";
}

/* -------------------- Scenarios -------------------- */
app.get("/api/scenarios", (_req, res) => {
  res.json(db.data!.scenarios);
});

app.post("/api/scenarios", async (req, res) => {
  try {
    const name = (req.body?.name ?? "").toString().trim();
    if (!name) return res.status(400).json({ error: "name required" });

    const item: Scenario = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    db.data!.scenarios.push(item);
    await db.write();
    res.status(201).json(item);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

/* -------------------- Events -------------------- */
/**
 * GET /api/events
 * ?scenarioId=default&category=earthquake,heavy_rain&channel=action,report&dateFrom=2025-10-01&dateTo=2025-10-31
 */
app.get("/api/events", (req, res) => {
  const items = queryEvents({
    scenarioId: (req.query.scenarioId as string) || "default",
    category: (req.query.category as string) || undefined,
    channel: (req.query.channel as string) || undefined,
    dateFrom: (req.query.dateFrom as string) || undefined,
    dateTo: (req.query.dateTo as string) || undefined,
  }).sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));

  res.json(items);
});

/**
 * POST /api/events
 * body: { scenarioId?, date, time, title, kind, category, channel, lat, lng, note?, actors? }
 */
app.post("/api/events", async (req, res) => {
  try {
    const scenarioId = getScenarioId(req.body);
    const date = (req.body?.date ?? "").toString().trim();
    const time = (req.body?.time ?? "").toString().trim();
    const title = (req.body?.title ?? "").toString().trim();
    const kind = (req.body?.kind ?? "disaster").toString().trim();
    const category = (req.body?.category ?? "other").toString().trim();
    const channel = (req.body?.channel ?? "action").toString().trim();
    const lat = Number(req.body?.lat ?? NaN);
    const lng = Number(req.body?.lng ?? NaN);
    const note = (req.body?.note ?? "").toString();
    const actors = Array.isArray(req.body?.actors)
      ? (req.body.actors as any[]).map(String).filter(Boolean)
      : undefined; // ★ 実施者ID配列（任意）

    // 最低限のバリデーション
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "date (YYYY-MM-DD) required" });
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: "time (HH:mm) required" });
    if (!title) return res.status(400).json({ error: "title required" });
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: "lat/lng required" });

    const e: Event = {
      id: randomUUID(),
      scenarioId,
      date,
      time,
      iso: toISO(date, time),
      title,
      kind,
      category,
      channel,
      lat,
      lng,
      note,
      actors, // ★ 追加
    };

    addEvent(e);
    await db.write();
    res.status(201).json(e);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});
// DELETE /api/events/:id
app.delete("/api/events/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const before = db.data!.events.length;
    db.data!.events = db.data!.events.filter((e) => e.id !== id);
    if (db.data!.events.length === before) {
      return res.status(404).json({ error: "not found" });
    }
    await db.write();
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

/* -------------------- Participants -------------------- */
/**
 * 参加者はシナリオ単位で管理。
 * ただし、既存データとの互換のため scenarioId が未設定の参加者は「共通」として常に返す。
 */

// GET /api/participants?scenarioId=default
app.get("/api/participants", (req, res) => {
  const scenarioId = getScenarioId(req.query);
  const items = db.data!.participants.filter(
    (p) => !p.scenarioId || p.scenarioId === scenarioId
  );
  res.json({ items });
});

// POST /api/participants
// body: { scenarioId?, name, role?, icon?, color? }
app.post("/api/participants", async (req, res) => {
  try {
    const scenarioId = getScenarioId(req.body); // ★
    const name = (req.body?.name ?? "").toString().trim();
    if (!name) return res.status(400).json({ error: "name required" });
    const role = (req.body?.role ?? "").toString().trim() || undefined;
    const icon = (req.body?.icon ?? "").toString().trim() || undefined;
    const color = (req.body?.color ?? "").toString().trim() || undefined;

    const p: Participant = { id: randomUUID(), scenarioId, name, role, icon, color };
    db.data!.participants.push(p);
    await db.write();
    res.status(201).json(p);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// DELETE /api/participants/:id
app.delete("/api/participants/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const before = db.data!.participants.length;
    db.data!.participants = db.data!.participants.filter((p) => p.id !== id);
    if (db.data!.participants.length === before) return res.status(404).json({ error: "not found" });
    await db.write();
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

/* -------------------- Logs -------------------- */
app.get("/api/logs", (_req, res) => {
  res.json(db.data!.logs);
});

app.post("/api/logs", async (req, res) => {
  try {
    const item: LogItem = {
      id: randomUUID(),
      time: new Date().toISOString(),
      actor: (req.body?.actor ?? "System").toString(),
      action: (req.body?.action ?? "unknown").toString(),
      payload:
        req.body?.payload && typeof req.body.payload === "object" ? req.body.payload : {},
    };
    db.data!.logs.push(item);
    await db.write();
    res.status(201).json(item);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

/* -------------------- Health -------------------- */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, scenarios: db.data!.scenarios.length });
});

/* -------------------- Boot -------------------- */
const PORT = Number(process.env.PORT || 5174);
app.listen(PORT, () => {
  console.log(`✅ Backend API running at http://localhost:${PORT}`);
});
