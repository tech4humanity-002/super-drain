const ENDPOINT = "https://pflisxkcxbzboxwidywf.supabase.co/functions/v1/super-drain-collect";

export async function collectSubmission(payload) {
  if (payload?.collection_consent !== true) return {status:"SKIPPED", reason:"collection_not_enabled"};
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return await response.json().catch(() => ({status:"BLOCKED", error:"invalid_collection_response"}));
  } catch (error) {
    return {status:"BLOCKED", error:error?.message || "collection_request_failed"};
  }
}

export const COLLECTION_POLICY = {
  version: "2026-09-24",
  purpose: "product_improvement_and_review",
  storesSubmittedContent: true,
};