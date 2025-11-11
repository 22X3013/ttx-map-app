// frontend/src/api.ts

// 開発(ローカル)では /api → Vite の proxy 経由で localhost:5174
// 本番(Vercel)では VITE_API_BASE 環境変数を使って Render を叩く
const API_BASE =
  import.meta.env.VITE_API_BASE || "/api";

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`DELETE ${path} failed: ${res.status}`);
  }
  return res.json();
}
