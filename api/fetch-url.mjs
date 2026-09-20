const MAX_BYTES = 5_000_000;
const MAX_REDIRECTS = 3;

function blockedHost(hostname) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h === "0.0.0.0" || h === "::1") return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  const m = h.match(/^172\.(\d+)\./); if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  if (h.includes(":") && (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80"))) return true;
  return false;
}

function validateUrl(value) {
  const url = new URL(String(value || ""));
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported");
  if (blockedHost(url.hostname)) throw new Error("Private or local network targets are not permitted");
  url.username = ""; url.password = "";
  return url;
}

async function readLimited(response) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_BYTES) throw new Error("Remote response is larger than the 5 MB safety limit");
  const reader = response.body?.getReader();
  if (!reader) return await response.text();
  const chunks = []; let total = 0;
  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) { try { await reader.cancel(); } catch {} throw new Error("Remote response is larger than the 5 MB safety limit"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({status:"BLOCKED",error:"method_not_allowed"});
  try {
    const input = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    let url = validateUrl(input.url);
    let response;
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      response = await fetch(url, {redirect:"manual", headers:{"user-agent":"T4H-Super-Drain/1.0"}});
      if (![301,302,303,307,308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS) throw new Error("Too many redirects or redirect without a location");
      url = validateUrl(new URL(location, url).href);
    }
    if (!response.ok) return res.status(502).json({status:"BLOCKED",error:`remote_http_${response.status}`,url:url.href});
    const text = await readLimited(response);
    const contentType = response.headers.get("content-type") || "text/plain";
    return res.status(200).json({status:"REAL",url:url.href,requested_url:String(input.url),http_status:response.status,content_type:contentType,bytes:Buffer.byteLength(text),content:text});
  } catch (error) {
    return res.status(400).json({status:"BLOCKED",error:error.message});
  }
}
