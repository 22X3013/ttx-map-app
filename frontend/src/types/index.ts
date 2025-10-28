// ==============================
// 📘 フロントエンド型定義
// frontend/src/types/index.ts
// ==============================

// --- 可視化チャンネル（色・アイコン用）---
export type Channel = 'action' | 'report' | 'damage' | 'request';

// --- 災害カテゴリ（フィルタ用）---
export type DisasterCategory =
  | 'earthquake'   // 地震
  | 'heavy_rain'   // 豪雨
  | 'landslide'    // 土砂災害
  | 'flood'        // 洪水
  | 'typhoon'      // 台風
  | 'other';

// --- イベントの種類（オブジェクト種別）---
export type EventKind = 'disaster' | 'shelter' | 'misinfo' | 'decision' | 'poi';

// --- 地図ピン/タイムライン共通 ---
export type Pin = {
  id: string;
  title: string;

  // タイムライン表示
  date?: string;    // "YYYY-MM-DD"
  time?: string;    // "HH:mm"
  iso?: string;     // ISO（任意）

  // 位置
  lat: number;
  lng: number;

  // 旧: type（文字列）→ 新: kind/category/channel に分離
  kind?: EventKind;
  category?: DisasterCategory;
  channel?: Channel;

  note?: string;
  type?: string; // 旧データ互換

  // ★ 追加：このイベントに紐づく参加者ID（将来用・任意）
  actors?: string[];
};

// --- 参加者（ParticipantsPanel 用）---
export type Participant = {
  id: string;
  // ★ 追加：シナリオ単位管理（互換のため任意）
  scenarioId?: string;
  name: string;
  role?: string;   // 例: 「危機管理課」「消防」「学校」
  icon?: string;   // 例: "🚑"
  color?: string;  // 例: "#2563eb"
};
