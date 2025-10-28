// --- シナリオ ---
export type Scenario = {
  id: string;
  name: string;
  createdAt: string; // ISO
};

// --- 可視化チャンネル（色・アイコンに対応） ---
export type Channel = "action" | "report" | "damage" | "request"; // 行動/通報/被害/要請

// --- 災害カテゴリ（表示フィルタ用） ---
export type DisasterCategory =
  | "earthquake"   // 地震
  | "heavy_rain"   // 豪雨
  | "landslide"    // 土砂災害
  | "flood"        // 洪水
  | "typhoon"      // 台風
  | "other";

// --- イベント種別（オブジェクトの種類） ---
export type EventKind = "disaster" | "shelter" | "misinfo" | "decision" | "poi";

// --- イベント（カテゴリ＋チャンネル＋日付/時刻対応） ---
export type Event = {
  id: string;
  scenarioId: string;

  // タイムライン表示用
  date: string;        // "YYYY-MM-DD"
  time: string;        // "HH:mm"
  iso?: string;        // ISO（サーバで自動生成）※任意

  title: string;

  // 旧: 'earthquake' | 'landslide' | 'shelter' | 'misinfo' | 'decision' | 'poi'
  // → 'kind' と 'category' に分離
  kind: EventKind;             // 何の種類のイベントか（災害/避難所/誤情報/意思決定/POI など）
  category: DisasterCategory;  // 災害カテゴリ（フィルタ用）

  channel: Channel;    // 行動/通報/被害/要請 のどれか

  lat: number;
  lng: number;
  note?: string;

  // ★ 追加：このイベントの実施者（参加者IDの配列・任意）
  actors?: string[];
};

// --- 参加者（シナリオ単位） ---
export type Participant = {
  id: string;
  scenarioId?: string; // ★ 追加：どのシナリオの参加者か（互換のため任意）
  name: string;
  role?: string; // 例:「危機管理課」「消防」「学校」
  icon?: string;
  color?: string;
};

// --- ログ ---
export type LogItem = {
  id: string;
  time: string;   // ISO
  actor: string;  // User/Systemなど
  action: string; // 例: イベント作成
  payload?: Record<string, any>;
};

// --- LowDB（全データ） ---
export type DBData = {
  scenarios: Scenario[];
  events: Event[];
  logs: LogItem[];
  participants: Participant[];
};
