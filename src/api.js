const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export async function fetchTechs(params={}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/api/techs?${qs}`);
  return (await res.json()).data;
}
