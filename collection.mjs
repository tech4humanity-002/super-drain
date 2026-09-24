const ENDPOINT = "https://pflisxkcxbzboxwidywf.supabase.co/functions/v1/super-drain-collect";
export const COLLECTION_POLICY = {
  version: "2026-09-24-v2",
  purpose: "use_data_to_improve_the_model",
  rawMaterialDefault: false,
};
const compactItem = x => ({
  source_type: x.source_type || "unknown",
  size_bytes: typeof x.content === "string" ? new TextEncoder().encode(x.content).length : 0,
  content_hash: x.content_hash || "",
  ideas: x.analysis?.ideas?.length || 0,
  actions: x.analysis?.actions?.length || 0,
  unfinished: x.analysis?.unfinished?.length || 0,
  opportunities: x.analysis?.opportunities?.length || 0,
  assets: x.analysis?.assets?.length || 0,
  opportunity_costs: x.analysis?.opportunity_costs?.length || 0,
  intended_outputs: x.analysis?.intended_outputs?.length || 0,
  completion_claims: x.analysis?.completion_claims?.length || 0,
  total_score: x.analysis?.scores?.total || 0,
});
export async function collectSubmission(payload) {
  if (payload?.collection_consent !== true) return { status: "SKIPPED", reason: "collection_not_enabled" };
  const safe = {
    collection_consent: true,
    policy_version: COLLECTION_POLICY.version,
    session_id: payload.session_id,
    batch_id: payload.batch_id,
    source_type: payload.source_type,
    item_count: Array.isArray(payload.items) ? payload.items.length : 0,
    total_bytes: Array.isArray(payload.items) ? payload.items.reduce((n, x) => n + (typeof x.content === "string" ? new TextEncoder().encode(x.content).length : 0), 0) : 0,
    pov: payload.pov || "BLENDED",
    items: Array.isArray(payload.items) ? payload.items.map(compactItem) : [],
    receipt_hash: payload.receipt_hash || payload.content_hash || "",
    app_version: payload.app_version || "1.3.0",
  };
  try {
    const response = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(safe), keepalive: true });
    return await response.json().catch(() => ({ status: "BLOCKED", error: "invalid_collection_response" }));
  } catch (error) {
    return { status: "BLOCKED", error: error?.message || "collection_request_failed" };
  }
}