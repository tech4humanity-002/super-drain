const ENDPOINT = "https://pflisxkcxbzboxwidywf.supabase.co/functions/v1/drain-lite-contact";
export async function saveContact({ email, marketingConsent = false, sessionId }) {
  const value = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { status: "BLOCKED", error: "invalid_email" };
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: value,
        marketing_consent: marketingConsent === true,
        session_id: sessionId || null,
        consent_source: "drain-lite",
        consent_version: "2026-09-24-v1"
      })
    });
    return await response.json().catch(() => ({ status: "BLOCKED", error: "invalid_contact_response" }));
  } catch (error) {
    return { status: "BLOCKED", error: error?.message || "contact_request_failed" };
  }
}