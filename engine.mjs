const words = value => String(value || "").toLowerCase().match(/[a-z0-9][a-z0-9'-]{2,}/g) || [];
const clean = value => String(value || "").replace(/\s+/g, " ").trim();
const sentenceList = text => String(text || "").split(/(?<=[.!?])\s+|\n+/).map(clean).filter(x => x.length > 18);
const uniq = values => [...new Set(values.map(clean).filter(Boolean))];
const take = (values, n = 8) => uniq(values).slice(0, n);
const rx = (terms) => new RegExp(`\\b(${terms.join("|")})\\b`, "i");

const IDEA = rx(["idea", "concept", "could", "should", "propose", "opportunity", "imagine", "potential", "possibility"]);
const ACTION = rx(["need to", "must", "next", "build", "create", "fix", "change", "deploy", "contact", "test", "verify", "move", "add"]);
const GAP = rx(["unfinished", "missing", "blocked", "fails?", "broken", "not working", "gap", "pending", "todo", "incomplete", "absent"]);
const COST = rx(["cost", "waste", "lost", "delay", "risk", "billing", "revenue", "manual", "duplicate", "crash", "freeze"]);
const ASSET = rx(["repo", "github", "document", "workbook", "spreadsheet", "code", "site", "dashboard", "template", "api", "database"]);
const KNOWN = rx(["existing", "already", "current", "known", "baseline", "canonical", "built", "today"]);
const NOVEL = rx(["novel", "new", "first", "unique", "unexplored", "emerging", "different", "invent"]);

export async function sha256(value) {
  const bytes = value instanceof Uint8Array ? value : value instanceof ArrayBuffer ? new Uint8Array(value) : new TextEncoder().encode(String(value || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

export function extractTextFromHtml(html) {
  if (typeof DOMParser === "undefined") return String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, " ");
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  doc.querySelectorAll("script,style,noscript,svg").forEach(x => x.remove());
  return clean(doc.body?.textContent || "");
}

export function parseBookmarkHtml(html, fileName = "bookmarks.html") {
  if (typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  return [...doc.querySelectorAll("a[href]")].map((a, index) => {
    const folders = [];
    let node = a.parentElement;
    while (node) {
      const heading = node.previousElementSibling;
      if (heading && /^H[1-6]$/.test(heading.tagName)) folders.unshift(clean(heading.textContent));
      node = node.parentElement;
    }
    return {
      occurrence_ref: `${fileName}:link-${index + 1}`,
      title: clean(a.textContent) || a.href,
      url: a.getAttribute("href") || "",
      content: clean(a.textContent),
      folder_path: uniq(folders).join(" / "),
      source_type: "bookmark_occurrence"
    };
  });
}

export function analyseOccurrence(input, corpusTerms = new Set()) {
  const sourceText = [input.title, input.content, input.url, input.folder_path].filter(Boolean).join("\n");
  const text = clean(sourceText);
  const sentences = sentenceList(sourceText).map(x=>x.slice(0,500));
  const ideas = take(sentences.filter(x => IDEA.test(x)));
  const actions = take(sentences.filter(x => ACTION.test(x)));
  const unfinished = take(sentences.filter(x => GAP.test(x)));
  const opportunityCosts = take(sentences.filter(x => COST.test(x)));
  const assets = take(sentences.filter(x => ASSET.test(x)));
  const opportunities = take(sentences.filter(x => IDEA.test(x) || /revenue|customer|market|reuse|product/i.test(x)));
  const terms = words(text).filter(x => x.length > 4);
  const familiar = terms.filter(x => corpusTerms.has(x));
  const unseen = terms.filter(x => !corpusTerms.has(x));
  const knownEvidence = take(sentences.filter(x => KNOWN.test(x)).concat(familiar.length ? [`Recurring organisational language: ${take(familiar, 10).join(", ")}`] : []), 6);
  const noveltyEvidence = take(sentences.filter(x => NOVEL.test(x)).concat(unseen.length ? [`Less-established signals: ${take(unseen, 10).join(", ")}`] : []), 6);
  const intendedOutputs = take([
    ...sentences.filter(x => /(?:output|deliverable|generate|create|build|write_file|open:|what'?s built)/i.test(x)),
    ...(text.match(/[\w./-]+\.(?:html|json|csv|xlsx|md|py|js|sql)/gi)||[]).map(x=>`Intended artefact: ${x}`)
  ],15);
  const claims = take(sentences.filter(x => /(?:complete|verified|pass|success|100%|working|ready|real)/i.test(x)),10);
  const numericClaims=(text.match(/\b\d[\d,]*\s+(?:themes?|topics?|subtopics?|pages?|objects?|relationships?|studies?|files?)\b/gi)||[]);
  const mismatches=[];
  const topicScope=[...sourceText.matchAll(/["']topics["']\s*:\s*(\d+)/gi)].map(x=>Number(x[1])),topicBuilt=[...sourceText.matchAll(/(\d+)\s+Topic pages/gi)].map(x=>Number(x[1]));
  const subtopicScope=[...sourceText.matchAll(/["']subtopics["']\s*:\s*(\d+)/gi)].map(x=>Number(x[1])),subtopicBuilt=[...sourceText.matchAll(/(\d+)\s+Subtopic pages/gi)].map(x=>Number(x[1]));
  if(topicScope.length&&topicBuilt.length&&Math.max(...topicScope)!==Math.max(...topicBuilt))mismatches.push(`Declared topic scope ${Math.max(...topicScope)} but generator reports ${Math.max(...topicBuilt)} topic pages`);
  if(subtopicScope.length&&subtopicBuilt.length&&Math.max(...subtopicScope)!==Math.max(...subtopicBuilt))mismatches.push(`Declared subtopic scope ${Math.max(...subtopicScope)} but generator reports ${Math.max(...subtopicBuilt)} subtopic pages`);
  const signal = Math.min(25, 5 + ideas.length * 3 + actions.length * 2 + unfinished.length * 2);
  const reuse = Math.min(25, assets.length * 4 + familiar.length / Math.max(1, terms.length) * 12);
  const monetisation = Math.min(25, opportunities.length * 4 + (/revenue|price|buy|customer|market/i.test(text) ? 5 : 0));
  const gap = Math.min(25, unfinished.length * 5 + opportunityCosts.length * 3);
  const total = Math.round(signal + reuse + monetisation + gap);
  return {
    ideas, actions, unfinished: take([...unfinished,...mismatches]), assets, opportunities, opportunity_costs: opportunityCosts,
    intended_outputs: take([...intendedOutputs,...numericClaims.map(x=>`Declared scope: ${x}`)],15),
    completion_claims: claims,
    known: knownEvidence, novel: noveltyEvidence,
    measures: {
      organisation: { known: knownEvidence.length, novel: noveltyEvidence.length, actionable: actions.length, unfinished: unfinished.length },
      community: { people_or_groups: (text.match(/\b(team|family|community|customer|partner|people|user|worker)s?\b/gi) || []).length, opportunities: opportunities.length },
      ecosystem: { assets: assets.length, dependencies: (text.match(/\b(api|database|github|drive|vercel|supabase|s3|domain|service)s?\b/gi) || []).length, opportunity_costs: opportunityCosts.length }
    },
    scores: { signal: Math.round(signal), reuse: Math.round(reuse), monetisation: Math.round(monetisation), completion_gap: Math.round(gap), total }
  };
}

export async function createOccurrence(raw, batch, index, corpusTerms) {
  const content = clean(raw.content || "");
  const content_hash = await sha256(JSON.stringify({ title: clean(raw.title) || "", url: raw.url || "", content }));
  const analysis = analyseOccurrence(raw, corpusTerms);
  return {
    page_id: `PAGE-${batch.batch_id.slice(-8)}-${String(index + 1).padStart(5, "0")}`,
    occurrence_id: `occ_${content_hash.slice(0, 24)}_${String(index + 1).padStart(5, "0")}`,
    occurrence_number: index + 1,
    source_file: raw.source_file || batch.source_name,
    source_type: raw.source_type || batch.source_type,
    occurrence_ref: raw.occurrence_ref || `${batch.source_name}:${index + 1}`,
    folder_path: raw.folder_path || "",
    title: clean(raw.title) || raw.url || raw.source_file || "Untitled occurrence",
    url: raw.url || "",
    content,
    content_hash,
    status: "analysed",
    captured_at: new Date().toISOString(),
    analysis
  };
}

export function buildReport(items,pov="BLENDED") {
  const ranked = [...items].sort((a,b) => b.analysis.scores.total - a.analysis.scores.total);
  const flatten = key => ranked.flatMap(x => x.analysis[key].map(value => ({ page_id:x.page_id, title:x.title, value, score:x.analysis.scores.total })));
  const top = list => take(list.map(x => x.value), 10);
  const totals = ranked.reduce((out,x) => {
    for (const scope of ["organisation","community","ecosystem"]) for (const [k,v] of Object.entries(x.analysis.measures[scope])) out[scope][k]=(out[scope][k]||0)+v;
    return out;
  }, { organisation:{}, community:{}, ecosystem:{} });
  return {
    generated_at: new Date().toISOString(),
    pages: ranked.length,
    evidence_units: ranked.length,
    sources: new Set(ranked.map(x => x.source_file || x.source_name || "unknown")).size,
    top_pages: ranked.slice(0,10).map(x => ({page_id:x.page_id,title:x.title,score:x.analysis.scores.total})),
    top_opportunities: top(flatten("opportunities")),
    top_unfinished: top(flatten("unfinished")),
    top_actions: top(flatten("actions")),
    top_opportunity_costs: top(flatten("opportunity_costs")),
    top_reusable_assets: top(flatten("assets")),
    intended_outputs: top(flatten("intended_outputs")),
    completion_claims: top(flatten("completion_claims")),
    known_vs_novel: { known: flatten("known").length, novel: flatten("novel").length },
    scope_measures: totals
  };
}

export function csvEscape(value) { const s=typeof value==="object"?JSON.stringify(value):String(value??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
export function toCsv(items,pov="BLENDED") {
  const rows=[["POV","POV Score","POV Evidence","Page ID","Source","Occurrence","Title","URL","Status","Ideas","Actions","Unfinished","Assets","Opportunities","Opportunity Costs","Intended Outputs","Completion Claims","Known","Novel","Mode","Importance","Evidence","Receipt","Target","Signal","Reuse","Monetisation","Gap","Total"]];
  for(const x of items) rows.push([pov,x.pov?.score??x.analysis.scores.total,(x.pov?.evidence||[]).map(e=>`${e.kind}: ${e.value}`).join(" | "),x.page_id,x.source_file,x.occurrence_number,x.title,x.url,x.status,x.analysis.ideas,x.analysis.actions,x.analysis.unfinished,x.analysis.assets,x.analysis.opportunities,x.analysis.opportunity_costs,x.analysis.intended_outputs,x.analysis.completion_claims,x.analysis.known,x.analysis.novel,x.control?.mode,x.control?.importance,x.control?.evidence,x.control?.receipt_ref,x.control?.target_ref,x.analysis.scores.signal,x.analysis.scores.reuse,x.analysis.scores.monetisation,x.analysis.scores.completion_gap,x.analysis.scores.total]);
  return rows.map(r=>r.map(csvEscape).join(",")).join("\n");
}
